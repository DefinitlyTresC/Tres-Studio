/* ─────────────────────────────────────────────────────────────────────────
   Grav — site 8's hand-rolled gravity engine ("the drop"). Zerog canon
   architecture: one rAF loop, fixed 60Hz timestep, interpolated
   transform-only render, pointer model verbatim from /mv/zerog.js (slop
   rules, velocity sampler, capture failsafes). New dynamics: real gravity,
   shelf support surfaces, AABB stacking, contact shadows, and the
   stockkeeper — stray objects glide home after a rest.

   Scan-and-boot: every [data-g8] element becomes a body inside its nearest
   [data-g8-room] ancestor. [data-g8-shelf] elements are support surfaces —
   their TOP edge is the shelf line, spanning their horizontal extent; give
   the room one full-width shelf at the bottom as the floor. Homes are the
   body's natural layout position measured on boot (offset chain — immune
   to transforms), so the page CSS IS the seated state: no-JS and
   reduced-motion look identical to a settled room.

   Flags:
     data-g8-color   a true click cycles the label palette (the letters).
     data-g8-slim    ledger rows: no pair collisions, gravity pulls them
                     back to their OWN shelf line with a soft x-spring —
                     a ledger must never end up piled in a corner.
                     Keeps touch-action: pan-y (lists must scroll).

   The drop (the entrance): bodies boot just above the room's top edge and
   are released on a stagger — thud, squash, settle. ?drop=seated boots
   everything seated (QA / photography). Reduced motion: no listeners, no
   loop, no entrance — the CSS-seated page, text selectable.

   QA (lab lesson — occluded panes starve rAF and lie): on localhost,
   window.__g8 = { tick(ms), info() } steps the fixed clock synchronously.
   All scheduling (drop stagger, reshelve timers) runs off the FRAME clock,
   never performance.now(), so synthetic stepping behaves identically.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (window.__mvGrav) return;
  window.__mvGrav = 1;

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) return; /* calm fallback: CSS-seated shelves, plain links */

  /* ---- tuning (the feel lives here) ---- */
  var G = 2600;            /* gravity, px/s² */
  var H = 1 / 60;          /* fixed timestep */
  var VMAX = 4200;         /* velocity clamp */
  var THROW_MAX = 3500;    /* release speed clamp (zerog value) */
  var BOUNCE_MIN = 900;    /* impacts above this get one small hop */
  var BOUNCE_E = 0.12;     /* the hop */
  var WALL_E = 0.45;       /* side-wall restitution */
  var FRICTION = 10;       /* ground vx decay, exp(-FRICTION*H) */
  var SLEEP_V = 20;        /* below this speed a resting body sleeps */
  var RESHELVE_T = 9.0;    /* seconds at rest away from home (Tres: unhurried) */
  var RESHELVE_GAP = 1.4;  /* the stockkeeper carries ONE item at a time */
  var SHELVE_K = 120, SHELVE_C = 16;  /* the stockkeeper's spring */
  var DROP_AT = 0.25;      /* entrance: first release, s after boot */
  var DROP_GAP = 0.09;     /* stagger between bodies */
  var SQUASH_DIV = 2800;   /* impact speed → squash magnitude */

  var REST = 0, HELD = 1, FREE = 2, SHELVE = 3, WAIT = 4;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function init() {
    var els = document.querySelectorAll('[data-g8]');
    if (!els.length) return;

    /* the letters REST green (page CSS) — the cycle visits the label colors
       and ink, then comes home to green (ci 0 = inherit) */
    var PALETTE = ['#D8341F', '#2431FF', '#E3A008', '#7A1FE0', '#141310'];
    var seatedQA = /[?&]drop=seated/.test(location.search);

    var groups = [], bodies = [];
    var shelving = 0, lastShelve = -99; /* the stockkeeper's hands + clock */

    function groupFor(room) {
      for (var i = 0; i < groups.length; i++) if (groups[i].el === room) return groups[i];
      var g = { el: room, w: 0, h: 0, rect: null, list: [], shelves: [], layer: null };
      try { if (getComputedStyle(room).position === 'static') room.style.position = 'relative'; } catch (e) {}
      /* contact-shadow layer under the bodies */
      var layer = document.createElement('div');
      layer.className = 'g8-shadows';
      layer.setAttribute('aria-hidden', 'true');
      layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
      room.insertBefore(layer, room.firstChild);
      g.layer = layer;
      groups.push(g);
      return g;
    }

    function offsetIn(el, room) {
      var x = 0, y = 0, n = el;
      while (n && n !== room) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { x: x, y: y };
    }

    function makeBodies(list) {
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        var room = el.closest('[data-g8-room]');
        if (!room) continue;
        var g = groupFor(room);
        var b = {
          el: el, g: g,
          cyc: el.hasAttribute('data-g8-color'),
          slim: el.hasAttribute('data-g8-slim'),
          x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0,
          hx: 0, hy: 0, hw: 22, hh: 22, ax: 22, ay: 22, m: 1, im: 1,
          state: WAIT, wakeAt: 0, asleep: false, restT: 0, awayT: 0,
          onSeg: false, supportB: null, virgin: true, hsy: 0,
          link: !!el.closest('a[href]'), dropThru: 0,
          s: 1, sv: 0, sax: 0, u: 1, tilt: 0,
          sh: null, shW: 1,
          pid: -1, cx: 0, cy: 0, gox: 0, goy: 0,
          scx: 0, scy: 0, st: 0, moved: false, samples: [],
          suppress: false, ci: 0
        };
        /* its shadow — one transform-only div on the shadow layer */
        var sh = document.createElement('div');
        sh.className = 'g8-shadow';
        sh.style.cssText = 'position:absolute;left:0;top:0;height:10px;border-radius:50%;' +
          'background:radial-gradient(closest-side, rgba(20,19,16,0.5), rgba(20,19,16,0));' +
          'will-change:transform,opacity;opacity:0;';
        g.layer.appendChild(sh);
        b.sh = sh;
        g.list.push(b);
        bodies.push(b);
      }
    }

    /* a degenerate room (hidden tab, prerender, collapsed pane) must never
       become the world — measure reports failure and the caller retries */
    function saneRooms() {
      for (var gi = 0; gi < groups.length; gi++) {
        if (groups[gi].el.clientWidth < 60 || groups[gi].el.clientHeight < 40) return false;
      }
      return true;
    }

    function measureAll() {
      for (var gi = 0; gi < groups.length; gi++) {
        var g = groups[gi];
        g.w = g.el.clientWidth; g.h = g.el.clientHeight;
        /* shelves: top edge, horizontal extent */
        g.shelves.length = 0;
        var shEls = g.el.querySelectorAll('[data-g8-shelf]');
        for (var s = 0; s < shEls.length; s++) {
          var o = offsetIn(shEls[s], g.el);
          g.shelves.push({ x0: o.x, x1: o.x + shEls[s].offsetWidth, y: o.y });
        }
        for (var i = 0; i < g.list.length; i++) {
          var b = g.list[i];
          /* EXACT half-extents — the collision box IS the visual box, or
             seating drifts (a min-clamp taller than the element parks its
             box on the line and floats the pixels above it) */
          var w = b.el.offsetWidth, h = b.el.offsetHeight;
          b.hw = Math.max(w / 2, 4); b.hh = Math.max(h / 2, 4);
          b.m = Math.max(0.6, (b.hw * b.hh) / 3600);
          b.im = 1 / b.m;
          var off = offsetIn(b.el, g.el);
          b.ax = off.x + w / 2; b.ay = off.y + h / 2;
          b.hx = b.ax; b.hy = b.ay;
          b.sh.style.width = (w * 0.92).toFixed(0) + 'px';
          b.shW = w * 0.92;
        }
        /* home shelves need the full shelf list first */
        for (var i2 = 0; i2 < g.list.length; i2++) {
          g.list[i2].hsy = homeSeg(g.list[i2], g);
        }
      }
    }

    function im(b) { return b.state === HELD ? 0 : b.im; }

    function squash(b, ang, speed) {
      var mag = Math.min(speed / SQUASH_DIV, 1) * 0.16;
      var target = 1 - mag;
      if (target < b.s) { b.s = target; b.sax = ang; b.sv = 0; }
    }

    function pop(b) { b.u = 0.88; }

    function applyColor(b) {
      b.el.style.color = b.ci === 0 ? '' : PALETTE[b.ci - 1];
    }

    function wake(b) {
      if (b.asleep) { b.asleep = false; }
      if (b.state === REST) { b.state = FREE; }
      b.restT = 0;
      /* anything stacked on this body loses its floor */
      var list = b.g.list;
      for (var i = 0; i < list.length; i++) {
        var r = list[i];
        if (r.supportB === b) { r.supportB = null; r.onSeg = false; wake(r); }
      }
    }

    /* nearest support line at-or-below a body's bottom edge (shelves only —
       for the shadow and the seated-support check). The 6px band below the
       bottom counts as "at" — a seated body must always re-find its OWN
       shelf, or REST flips to FREE every step and nothing ever sleeps. */
    function segBelow(b, g, bottom) {
      var best = null;
      for (var i = 0; i < g.shelves.length; i++) {
        var sg = g.shelves[i];
        if (sg.y < bottom - 6) continue;
        var ov = Math.min(b.x + b.hw, sg.x1) - Math.max(b.x - b.hw, sg.x0);
        if (ov < Math.min(b.hw, 24)) continue;
        if (!best || sg.y < best.y) best = sg;
      }
      return best;
    }

    /* the body's own shelf: the support line directly under its HOME —
       virgin falls (the entrance) land only here, so the drop is a clean
       delivery: every object straight to its slot, no mid-air pileups */
    function homeSeg(b, g) {
      var bottom = b.hy + b.hh;
      var best = null;
      for (var i = 0; i < g.shelves.length; i++) {
        var sg = g.shelves[i];
        if (sg.y < bottom - 6) continue;
        var ov = Math.min(b.hx + b.hw, sg.x1) - Math.max(b.hx - b.hw, sg.x0);
        if (ov < Math.min(b.hw, 24)) continue;
        if (!best || sg.y < best.y) best = sg;
      }
      return best ? best.y : g.h;
    }

    /* swept landing: did the bottom edge cross a support line this step? */
    function tryLand(b, g, prevBottom) {
      if (b.vy < 0) return false;
      var bottom = b.y + b.hh;
      if (b.slim) {
        /* ledger rows land only on their own line */
        if (prevBottom <= b.hy + b.hh + 2 && bottom >= b.hy + b.hh) {
          b.y = b.hy; return land(b, null);
        }
        return false;
      }
      /* shelf lines — a virgin fall (the entrance) passes every line above
         its own home shelf: a clean delivery, straight to the slot */
      var best = null;
      for (var i = 0; i < g.shelves.length; i++) {
        var sg = g.shelves[i];
        if (b.virgin && sg.y < b.hsy - 4) continue;
        if (b.dropThru && sg.y < b.dropThru) continue; /* a click-drop passes its own level */
        if (prevBottom > sg.y + 2 || bottom < sg.y) continue;
        var ov = Math.min(b.x + b.hw, sg.x1) - Math.max(b.x - b.hw, sg.x0);
        if (ov < Math.min(b.hw, 24)) continue;
        if (!best || sg.y < best.y) best = sg;
      }
      if (best) { b.y = best.y - b.hh; return land(b, null); }
      /* the top of a resting body (never during a virgin fall) */
      if (b.virgin) return false;
      var list = g.list;
      for (var j = 0; j < list.length; j++) {
        var c = list[j];
        if (c === b || c.slim) continue;
        if (!(c.state === REST || c.state === HELD)) continue;
        var top = c.y - c.hh;
        if (b.dropThru && top < b.dropThru) continue;
        if (prevBottom > top + 2 || bottom < top) continue;
        if (Math.abs(b.x - c.x) > (b.hw + c.hw) * 0.8) continue;
        b.y = top - b.hh;
        return land(b, c);
      }
      return false;
    }

    function land(b, support) {
      var impact = b.vy;
      b.virgin = false;
      b.dropThru = 0;
      b.supportB = support;
      b.onSeg = !support;
      if (impact > BOUNCE_MIN) {
        b.vy = -impact * BOUNCE_E;   /* one small hop */
        b.state = FREE;
      } else {
        b.vy = 0;
        b.state = REST;
      }
      if (impact > 500) squash(b, 1.5708, impact);
      return true;
    }

    /* AABB pair shove — mid-air bounces and side nudges. Landings are
       handled by tryLand; this only separates and exchanges impulse. */
    function collide(a, b) {
      if (a.slim || b.slim) return;
      if (a.virgin || b.virgin) return; /* the entrance is a clean delivery */
      if (a.dropThru || b.dropThru) return; /* a click-drop ghosts to its level */
      if (a.asleep && b.asleep) return;
      if (a.state === SHELVE || b.state === SHELVE) return;
      var dx = b.x - a.x, dy = b.y - a.y;
      var px = a.hw + b.hw - Math.abs(dx);
      if (px <= 0) return;
      var py = a.hh + b.hh - Math.abs(dy);
      if (py <= 0) return;
      var ia = im(a), ib = im(b), sum = ia + ib;
      if (sum === 0) return;
      var nx = 0, ny = 0, pen;
      if (px < py) { nx = dx < 0 ? -1 : 1; pen = px; }
      else { ny = dy < 0 ? -1 : 1; pen = py; }
      var van = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (van < 0) {
        var e = van > -60 ? 0 : 0.15;
        var j = -(1 + e) * van / sum;
        a.vx -= ia * j * nx; a.vy -= ia * j * ny;
        b.vx += ib * j * nx; b.vy += ib * j * ny;
        if (van < -160) {
          var ang = ny !== 0 ? 1.5708 : 0;
          squash(a, ang, -van); squash(b, ang, -van);
        }
        if (van < -40) {
          if (a.asleep || a.state === REST) wake(a);
          if (b.asleep || b.state === REST) wake(b);
        }
      }
      var corr = Math.max(pen - 0.5, 0) / sum * 0.3;
      a.x -= ia * corr * nx; a.y -= ia * corr * ny;
      b.x += ib * corr * nx; b.y += ib * corr * ny;
    }

    function walls(b, g) {
      var iv;
      if (b.x < b.hw) {
        b.x = b.hw;
        if (b.vx < 0) { iv = -b.vx; b.vx = iv < 60 ? 0 : iv * WALL_E; if (iv > 200) squash(b, 0, iv); }
      } else if (b.x > g.w - b.hw) {
        b.x = g.w - b.hw;
        if (b.vx > 0) { iv = b.vx; b.vx = iv < 60 ? 0 : -iv * WALL_E; if (iv > 200) squash(b, 0, iv); }
      }
      /* no ceiling — throw them at the sky, gravity answers. The room
         floor is a shelf; this is only the absolute never-escape line. */
      if (b.y > g.h - b.hh) {
        b.y = g.h - b.hh;
        if (b.vy > 0) land(b, null);
      }
    }

    function step(t) {
      var gi, g, list, i, j, k, b;
      for (gi = 0; gi < groups.length; gi++) {
        g = groups[gi];
        list = g.list;
        for (i = 0; i < list.length; i++) {
          b = list[i];
          if (b.state === WAIT) {
            if (t >= b.wakeAt) { b.state = FREE; } else continue;
          }
          if (b.asleep) continue;
          var prevBottom = b.y + b.hh;
          if (b.state === HELD) {
            if (!g.rect) g.rect = g.el.getBoundingClientRect();
            var txp = clamp(b.cx - g.rect.left + b.gox, b.hw, g.w - b.hw);
            var typ = clamp(b.cy - g.rect.top + b.goy, -300, g.h - b.hh);
            var kk = 1 - Math.exp(-20 * H);
            var nx2 = b.x + (txp - b.x) * kk;
            var ny2 = b.y + (typ - b.y) * kk;
            b.vx = clamp((nx2 - b.x) / H, -5000, 5000);
            b.vy = clamp((ny2 - b.y) / H, -5000, 5000);
            b.x = nx2; b.y = ny2;
          } else if (b.state === SHELVE) {
            /* the stockkeeper: gravity off, glide home, seat */
            var axr = -SHELVE_K * (b.x - b.hx) - SHELVE_C * b.vx;
            var ayr = -SHELVE_K * (b.y - b.hy) - SHELVE_C * b.vy;
            b.vx += axr * H; b.vy += ayr * H;
            b.x += b.vx * H; b.y += b.vy * H;
            var ddx = b.x - b.hx, ddy = b.y - b.hy;
            if (ddx * ddx + ddy * ddy < 4 && b.vx * b.vx + b.vy * b.vy < 1600) {
              b.x = b.hx; b.y = b.hy; b.vx = 0; b.vy = 0;
              b.state = REST; b.onSeg = true; b.supportB = null; b.awayT = 0;
              if (--shelving < 0) shelving = 0; /* hands free — next item */
            }
          } else if (b.state === FREE) {
            b.vy += G * H;
            if (b.slim) {
              /* soft x-spring home — a ledger never piles up */
              b.vx += (-30 * (b.x - b.hx) - 4 * b.vx) * H;
            }
            var sp2 = b.vx * b.vx + b.vy * b.vy;
            if (sp2 > VMAX * VMAX) { var sc = VMAX / Math.sqrt(sp2); b.vx *= sc; b.vy *= sc; }
            b.x += b.vx * H; b.y += b.vy * H;
            tryLand(b, g, prevBottom);
          } else if (b.state === REST) {
            /* grounded: friction until asleep; validate the floor */
            if (b.supportB) {
              var c = b.supportB;
              if (c.state !== REST && c.state !== HELD) { b.supportB = null; b.state = FREE; }
              else b.y = (c.y - c.hh) - b.hh;
            } else if (!b.slim && b.onSeg) {
              var under = segBelow(b, g, b.y + b.hh);
              if (!under || under.y > b.y + b.hh + 6) { b.onSeg = false; b.state = FREE; }
            }
            if (b.state === REST) {
              b.vx *= Math.exp(-FRICTION * H);
              b.x += b.vx * H;
              var spd = Math.abs(b.vx);
              if (spd < SLEEP_V) {
                b.vx = 0;
                b.restT += H;
                if (b.restT > 0.35) {
                  var away = Math.abs(b.x - b.hx) > 6 || Math.abs(b.y - b.hy) > 6;
                  if (away) {
                    b.awayT += 0.35 + H; b.restT = 0;
                    /* one item at a time, unhurried — never a flock flying home */
                    if (b.awayT > RESHELVE_T && shelving === 0 && t - lastShelve > RESHELVE_GAP) {
                      b.state = SHELVE; b.asleep = false; b.supportB = null;
                      shelving++; lastShelve = t;
                    }
                  } else if (b.s > 0.995 && b.s < 1.005 && Math.abs(b.tilt) < 0.1) {
                    b.asleep = true; b.restT = 0; b.awayT = 0;
                    renderBody(b, 1); shadow(b, g, true);
                  }
                }
              } else { b.restT = 0; }
            }
          }
        }
        for (k = 0; k < 2; k++) {
          for (i = 0; i < list.length; i++) {
            for (j = i + 1; j < list.length; j++) collide(list[i], list[j]);
          }
        }
        for (i = 0; i < list.length; i++) {
          b = list[i];
          if (b.asleep || b.state === WAIT) continue;
          if (b.state !== HELD && b.state !== SHELVE) walls(b, g);
          b.sv += (-400 * (b.s - 1) - 20 * b.sv) * H;
          b.s = clamp(b.s + b.sv * H, 0.82, 1.18);
          var ut = b.state === HELD ? 0.96 : 1;
          b.u += (ut - b.u) * 0.25;
          var tt = (b.state === HELD || b.state === FREE) ? clamp(b.vx * 0.01, -8, 8) : 0;
          b.tilt += (tt - b.tilt) * 0.12;
        }
      }
    }

    function renderBody(b, alpha) {
      var x = b.px + (b.x - b.px) * alpha - b.ax;
      var y = b.py + (b.y - b.py) * alpha - b.ay;
      var tr = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      if (b.tilt > 0.05 || b.tilt < -0.05) tr += ' rotate(' + b.tilt.toFixed(2) + 'deg)';
      var s1 = b.s, ax2 = b.sax;
      if (s1 > 0.996 && s1 < 1.004) {
        s1 = 1;
        var sp2 = b.vx * b.vx + b.vy * b.vy;
        if (sp2 > 360000 && (b.state === FREE || b.state === HELD)) {
          s1 = 1 + Math.min(Math.sqrt(sp2) / 9000, 0.1);
          ax2 = Math.atan2(b.vy, b.vx);
        }
      }
      if (s1 !== 1 || b.u < 0.999) {
        var deg = ax2 * 57.2958;
        tr += ' rotate(' + deg.toFixed(1) + 'deg) scale(' + (b.u * s1).toFixed(3) + ',' + (b.u / s1).toFixed(3) + ') rotate(' + (-deg).toFixed(1) + 'deg)';
      }
      b.el.style.transform = tr;
    }

    /* the contact shadow: pinned to the support line under the body,
       detaching and thinning with altitude. Transform + opacity only. */
    function shadow(b, g, final) {
      var bottom = b.y + b.hh;
      var sg = b.slim ? null : segBelow(b, g, bottom - 4);
      var sy = sg ? sg.y : (b.slim ? b.hy + b.hh : g.h);
      var alt = Math.max(sy - bottom, 0);
      var sx = clamp(1 - alt / 900, 0.5, 1);
      var op = clamp(0.3 - alt / 1400, 0.05, 0.3);
      if (b.state === WAIT) op = 0;
      b.sh.style.transform = 'translate3d(' + (b.x - b.shW / 2).toFixed(1) + 'px,' + (sy - 5).toFixed(1) + 'px,0) scaleX(' + sx.toFixed(3) + ')';
      b.sh.style.opacity = op.toFixed(3);
      if (final) b.sh.style.opacity = '0.3';
    }

    /* ---- pointer: grab / lerp-follow / throw / click (zerog verbatim) ---- */

    function grab(b, e) {
      if (b.state === HELD) return;
      b.pid = e.pointerId;
      b.suppress = false;
      try { b.el.setPointerCapture(e.pointerId); } catch (err) {}
      var g = b.g;
      g.rect = g.el.getBoundingClientRect();
      b.virgin = false; /* the user took over — full physics from here on */
      if (b.state === SHELVE && --shelving < 0) shelving = 0; /* snatched mid-carry */
      b.dropThru = 0;
      wake(b);
      b.cx = e.clientX; b.cy = e.clientY;
      b.gox = b.x - (e.clientX - g.rect.left);
      b.goy = b.y - (e.clientY - g.rect.top);
      b.scx = e.clientX; b.scy = e.clientY;
      b.st = performance.now();
      b.moved = false;
      b.samples.length = 0;
      b.samples.push({ x: e.clientX, y: e.clientY, t: b.st });
      b.state = HELD; b.restT = 0; b.awayT = 0; b.supportB = null; b.onSeg = false;
    }

    function move(b, e) {
      if (b.state !== HELD || e.pointerId !== b.pid) return;
      b.cx = e.clientX; b.cy = e.clientY;
      b.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (b.samples.length > 24) b.samples.shift();
      if (!b.moved) {
        var dx = e.clientX - b.scx, dy = e.clientY - b.scy;
        var slop = e.pointerType === 'mouse' ? 64 : 196;
        if (dx * dx + dy * dy > slop) { b.moved = true; b.suppress = true; }
      }
    }

    function release(b, e) {
      if (b.state !== HELD || e.pointerId !== b.pid) return;
      b.pid = -1;
      var now = performance.now();
      if (!b.moved) {
        /* a true click: links navigate natively; loose stock DROPS A LEVEL —
           it falls through its own shelf and lands on the next one down
           (the stockkeeper will carry it home later). On the floor there is
           no next level — nothing to do. */
        b.state = FREE;
        if (!b.link && !b.slim && segBelow(b, b.g, b.y + b.hh + 8)) {
          b.dropThru = b.y + b.hh + 2;
          b.supportB = null; b.onSeg = false;
          b.vy = Math.max(b.vy, 60);
          b.restT = 0; b.awayT = 0;
        }
        if (b.cyc) {
          b.ci = (b.ci + 1) % (PALETTE.length + 1);
          applyColor(b);
          pop(b);
        }
        return;
      }
      var vx = 0, vy = 0;
      var s = b.samples;
      var last = s[s.length - 1];
      if (last && now - last.t < 90) {
        var i0 = s.length - 1;
        while (i0 > 0 && last.t - s[i0 - 1].t <= 100) i0--;
        var first = s[i0];
        var dt = (last.t - first.t) / 1000;
        if (dt > 0.008) {
          vx = (last.x - first.x) / dt;
          vy = (last.y - first.y) / dt;
        }
      }
      var sp = Math.sqrt(vx * vx + vy * vy);
      if (sp > THROW_MAX) { vx *= THROW_MAX / sp; vy *= THROW_MAX / sp; sp = THROW_MAX; }
      if (sp < 50) { vx = 0; vy = 0; }
      b.vx = vx; b.vy = vy;
      b.state = FREE; b.restT = 0;
      if (b.suppress) setTimeout(function () { b.suppress = false; }, 400);
    }

    function bind(b) {
      b.el.style.touchAction = b.slim ? 'pan-y' : 'none';
      b.el.style.willChange = 'transform';
      b.el.style.userSelect = 'none';
      b.el.style.webkitUserSelect = 'none';
      try { b.el.style.setProperty('-webkit-touch-callout', 'none'); } catch (e) {}
      b.el.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        grab(b, e);
      });
      b.el.addEventListener('pointermove', function (e) { move(b, e); });
      b.el.addEventListener('pointerup', function (e) { release(b, e); });
      b.el.addEventListener('pointercancel', function (e) {
        if (b.state === HELD && e.pointerId === b.pid) {
          b.pid = -1; b.state = FREE; b.vx = 0; b.vy = 0; b.restT = 0;
        }
      });
      if (!b.cyc) {
        b.el.addEventListener('click', function (e) {
          if (b.suppress) { e.preventDefault(); b.suppress = false; }
        });
      }
      b.el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    }

    /* ---- window inertia (ported from zerog): shake the OS window and the
       stock jumps off its shelves. Dead on mobile, clamped against snaps. */
    var wsx = null, wsy = null;
    function windowKick() {
      var sx = window.screenX, sy = window.screenY;
      if (wsx === null) { wsx = sx; wsy = sy; return; }
      var dx = sx - wsx, dy = sy - wsy;
      wsx = sx; wsy = sy;
      if (dx === 0 && dy === 0) return;
      if (dx > 200 || dx < -200 || dy > 200 || dy < -200) return;
      dx = clamp(dx, -80, 80); dy = clamp(dy, -80, 80);
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        if (b.state === HELD || b.state === WAIT) continue;
        if (dx * dx + dy * dy > 36) wake(b);
        b.vx -= dx * 5.5;
        b.vy -= dy * 5.5;
      }
    }

    /* ---- loop: fixed timestep + interpolated render ---- */
    var lastT = 0, acc = 0, simT = 0;
    function frameBody(now) {
      if (!lastT) { lastT = now; return; }
      var dt = Math.min((now - lastT) / 1000, 0.032);
      lastT = now;
      acc += dt;
      for (var gi = 0; gi < groups.length; gi++) groups[gi].rect = null;
      windowKick();
      var n = 0;
      while (acc >= H && n < 4) {
        for (var i = 0; i < bodies.length; i++) { bodies[i].px = bodies[i].x; bodies[i].py = bodies[i].y; }
        simT += H;
        step(simT);
        acc -= H;
        n++;
      }
      if (n === 4) acc = 0;
      var alpha = clamp(acc / H, 0, 1);
      for (var bi = 0; bi < bodies.length; bi++) {
        var b = bodies[bi];
        if (b.asleep || b.state === WAIT) continue;
        renderBody(b, alpha);
        shadow(b, b.g, false);
      }
    }
    function loop(now) { requestAnimationFrame(loop); frameBody(now); }

    function onResize() {
      if (!saneRooms()) { setTimeout(onResize, 400); return; } /* wait out the collapse */
      measureAll();
      for (var gi = 0; gi < groups.length; gi++) {
        var g = groups[gi];
        for (var i = 0; i < g.list.length; i++) {
          var b = g.list[i];
          /* seated stock snaps to the reflowed shelf; strays re-clamp */
          if (b.state === WAIT) {
            /* the entrance is still pending — re-spawn above the room at
               the new home column, NEVER at home (a resize between boot and
               the drop must not skip the identity moment) */
            b.x = b.hx; b.y = -(b.hh + 30); b.vx = 0; b.vy = 0;
            b.px = b.x; b.py = b.y;
            renderBody(b, 1); shadow(b, g, false);
            continue;
          }
          if (b.state === REST || b.state === SHELVE) {
            if (b.state === SHELVE && --shelving < 0) shelving = 0;
            b.x = b.hx; b.y = b.hy; b.vx = 0; b.vy = 0;
            b.state = REST; b.onSeg = true; b.supportB = null;
            b.asleep = false; /* re-render + re-sleep next frames */
          } else {
            b.x = clamp(b.x, b.hw, g.w - b.hw);
            b.y = clamp(b.y, -300, g.h - b.hh);
          }
          b.px = b.x; b.py = b.y;
        }
      }
    }

    var started = false, bootTries = 0;
    function start() {
      if (started) return;
      if (!bodies.length) makeBodies(els);
      if (!bodies.length) return;
      /* never boot into a degenerate viewport — retry until layout is real
         (a hidden/prerendered page boots on its first real reveal) */
      if (!saneRooms()) {
        if (++bootTries < 40) setTimeout(start, 400);
        return;
      }
      started = true;
      measureAll();
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        if (seatedQA) {
          b.x = b.px = b.hx; b.y = b.py = b.hy;
          b.state = REST; b.onSeg = true; b.virgin = false;
        } else {
          /* the drop: spawn just above the room, release on a stagger */
          b.x = b.px = b.hx;
          b.y = b.py = -(b.hh + 30);
          b.state = WAIT;
          b.wakeAt = DROP_AT + i * DROP_GAP;
          /* slim ledger rows don't do the entrance — they're already shelved */
          if (b.slim) { b.x = b.px = b.hx; b.y = b.py = b.hy; b.state = REST; b.onSeg = true; b.virgin = false; }
        }
        bind(b);
        renderBody(b, 1);
        shadow(b, b.g, b.state === REST);
      }
      for (var gi = 0; gi < groups.length; gi++) groups[gi].el.classList.add('sim');
      var rT = 0;
      function queueResize() {
        clearTimeout(rT);
        rT = setTimeout(onResize, 150);
      }
      addEventListener('resize', queueResize);
      /* the world can drift without a window resize — svh settling,
         scrollbars appearing, late font reflow. Any change to a room's box
         re-measures shelves + homes so seated stock never floats. */
      if ('ResizeObserver' in window) {
        /* RO always fires once on observe() — only a REAL size change may
           queue a re-measure, or every boot gets a spurious onResize 150ms
           in (mid-entrance) */
        var ro = new ResizeObserver(function () {
          for (var gi = 0; gi < groups.length; gi++) {
            var g = groups[gi];
            if (Math.abs(g.el.clientWidth - g.w) > 1 || Math.abs(g.el.clientHeight - g.h) > 1) { queueResize(); return; }
          }
        });
        for (var oi = 0; oi < groups.length; oi++) ro.observe(groups[oi].el);
      }
      function releaseAny(e) {
        for (var i = 0; i < bodies.length; i++) {
          var b = bodies[i];
          if (b.state === HELD && b.pid === e.pointerId) release(b, e);
        }
      }
      addEventListener('pointerup', releaseAny, true);
      addEventListener('pointercancel', releaseAny, true);
      requestAnimationFrame(loop);

      /* QA hook — localhost only (lab lesson: panes starve rAF) */
      if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
        window.__g8 = {
          tick: function (ms) {
            var steps = Math.max(1, Math.round((ms || 16.7) / (H * 1000)));
            for (var k = 0; k < steps; k++) {
              for (var i = 0; i < bodies.length; i++) { bodies[i].px = bodies[i].x; bodies[i].py = bodies[i].y; }
              simT += H;
              step(simT);
            }
            for (var j = 0; j < bodies.length; j++) {
              if (bodies[j].state === WAIT) continue;
              renderBody(bodies[j], 1);
              shadow(bodies[j], bodies[j].g, false);
            }
            return simT;
          },
          info: function () {
            return bodies.map(function (b) {
              return { st: b.state, asleep: b.asleep, x: Math.round(b.x), y: Math.round(b.y), hx: Math.round(b.hx), hy: Math.round(b.hy) };
            });
          }
        };
      }
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (started) onResize(); else start();
      });
      /* fonts.ready can resolve BEFORE the font stylesheet even arrives
         (no faces known yet = instantly "ready") — when the real faces land
         later, re-measure homes in the true metrics */
      try {
        document.fonts.addEventListener('loadingdone', function () {
          if (started) onResize();
        });
      } catch (e) {}
      setTimeout(start, 1600);
    } else {
      start();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
