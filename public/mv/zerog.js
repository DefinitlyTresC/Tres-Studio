/* ─────────────────────────────────────────────────────────────────────────
   Zero-G — site 2's hand-rolled physics engine, extracted so the whole
   site can float. One rAF loop, fixed 60Hz timestep, interpolated
   transform-only render.

   Scan-and-boot: every element marked [data-zg] becomes a grabbable,
   throwable body inside its nearest [data-zg-room] ancestor. Bodies stay
   within their room's bounds, collide with each other, bounce off walls,
   and spring home underdamped (k=180, c=13) after 2.5s at rest.
   Click-vs-drag: under 8px and 400ms is a click (links navigate);
   anything more is a grab (the trailing click is suppressed).

   Homes — two flavors:
     data-home-x / data-home-y   percents of the room (data-home-xn /
                                 data-home-yn override on <=640px screens).
                                 These bodies wander gently in FLOAT, and
                                 expect page CSS to park them at the same
                                 percents while the sim is off. On boot the
                                 room gets a 'sim' class so that CSS can
                                 hand position over to the engine.
     (no home attributes)        home = the body's natural layout position,
                                 measured on boot (offset chain — immune to
                                 transforms). No wander: the page looks
                                 identical until something is grabbed.

   Flags:
     data-zg-color   a true click cycles the palette; rooms holding these
                     reshuffle colors on scroll re-entry (the TRES letters).
     data-zg-slim    wide flat bodies (index rows): collision radius scales
                     from element height, not the (w+h)/4 blob radius, so
                     stacked rows rest without jostling.

   Reduced motion: fully static — no listeners, no loop, text selectable.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  if (window.__mvZeroG) return;
  window.__mvZeroG = 1;

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) return; /* calm fallback: static homes, plain links */

  function init() {
    var els = document.querySelectorAll('[data-zg]');
    if (!els.length) return;

    var PALETTE = ['#FF4D00', '#2431FF', '#00934D', '#E62E8A', '#7A1FE0', '#F0A400'];
    var FLOAT = 0, HELD = 1, FREE = 2, RETURN = 3;
    var H = 1 / 60;
    var narrow = null;
    try { narrow = matchMedia('(max-width: 640px)'); } catch (e) {}

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

    var groups = [];
    var bodies = [];

    function groupFor(room) {
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].el === room) return groups[i];
      }
      var g = { el: room, w: 0, h: 0, rect: null, list: [] };
      try {
        if (getComputedStyle(room).position === 'static') room.style.position = 'relative';
      } catch (e) {}
      groups.push(g);
      return g;
    }

    function makeBodies(list) {
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        var room = el.closest('[data-zg-room]');
        if (!room) continue;
        var g = groupFor(room);
        var b = {
          el: el, g: g,
          cyc: el.hasAttribute('data-zg-color'),
          slim: el.hasAttribute('data-zg-slim'),
          pct: el.hasAttribute('data-home-x') || el.hasAttribute('data-home-y'),
          x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0,
          hx: 0, hy: 0, hw: 22, hh: 22, ax: 22, ay: 22, r: 30, m: 1, im: 1,
          state: FLOAT, restT: 0,
          wa: 14,
          w1: 0.22 + Math.random() * 0.25, w2: 0.2 + Math.random() * 0.28,
          p1: Math.random() * 6.283, p2: Math.random() * 6.283,
          s: 1, sv: 0, sax: 0, u: 1, tilt: 0,
          pid: -1, cx: 0, cy: 0, gox: 0, goy: 0,
          scx: 0, scy: 0, st: 0, moved: false, samples: [],
          suppress: false, ci: 0
        };
        g.list.push(b);
        bodies.push(b);
      }
    }

    function measureAll() {
      for (var gi = 0; gi < groups.length; gi++) {
        var g = groups[gi];
        g.w = g.el.clientWidth; g.h = g.el.clientHeight;
        for (var i = 0; i < g.list.length; i++) {
          var b = g.list[i];
          var w = b.el.offsetWidth, h = b.el.offsetHeight;
          b.hw = Math.max(w / 2, 22); b.hh = Math.max(h / 2, 22);
          b.r = b.slim
            ? Math.max(14, Math.min((w + h) / 4, h * 0.45))
            : (w + h) / 4;
          b.m = Math.max(0.6, (b.r * b.r) / 6000);
          b.im = 1 / b.m;
          if (b.pct) {
            /* percent home — wanders like the index letters */
            b.wa = 10 + b.r * 0.12;
            var useN = narrow && narrow.matches;
            var hxRaw = (useN && b.el.getAttribute('data-home-xn')) || b.el.getAttribute('data-home-x');
            var hyRaw = (useN && b.el.getAttribute('data-home-yn')) || b.el.getAttribute('data-home-y');
            var pctX = parseFloat(hxRaw); if (isNaN(pctX)) pctX = 50;
            var pctY = parseFloat(hyRaw); if (isNaN(pctY)) pctY = 50;
            b.hx = clamp(pctX / 100 * g.w, b.hw + 4, Math.max(b.hw + 4, g.w - b.hw - 4));
            b.hy = clamp(pctY / 100 * g.h, b.hh + 4, Math.max(b.hh + 4, g.h - b.hh - 4));
            /* page CSS zeroes the body's slot under .sim — anchor is the box itself */
            b.ax = b.hw; b.ay = b.hh;
          } else {
            /* measured home — the natural layout center, transform-immune */
            b.wa = 0;
            var ox = 0, oy = 0, n = b.el;
            while (n && n !== g.el) { ox += n.offsetLeft; oy += n.offsetTop; n = n.offsetParent; }
            b.ax = ox + w / 2; b.ay = oy + h / 2;
            b.hx = b.ax; b.hy = b.ay;
          }
        }
      }
    }

    function tgx(b, t) { return b.hx + Math.sin(t * b.w1 + b.p1) * b.wa; }
    function tgy(b, t) { return b.hy + Math.sin(t * b.w2 + b.p2) * b.wa * 0.8; }
    function im(b) { return b.state === HELD ? 0 : b.im; }

    function squash(b, ang, speed) {
      var mag = Math.min(speed / 3200, 1) * 0.14;
      var target = 1 - mag;
      if (target < b.s) { b.s = target; b.sax = ang; b.sv = 0; }
    }

    function pop(b) { b.u = 0.88; }

    function applyColor(b) {
      b.el.style.color = b.ci === 0 ? '' : PALETTE[b.ci - 1];
    }

    function collide(a, b) {
      var nx = b.x - a.x, ny = b.y - a.y;
      var rs = a.r + b.r;
      var d2 = nx * nx + ny * ny;
      if (d2 >= rs * rs || d2 === 0) return;
      var d = Math.sqrt(d2);
      nx /= d; ny /= d;
      var ia = im(a), ib = im(b), sum = ia + ib;
      if (sum === 0) return;
      var van = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (van < 0) {
        var e = van > -60 ? 0 : 0.3;
        var j = -(1 + e) * van / sum;
        a.vx -= ia * j * nx; a.vy -= ia * j * ny;
        b.vx += ib * j * nx; b.vy += ib * j * ny;
        if (van < -120) {
          var ang = Math.atan2(ny, nx);
          squash(a, ang, -van); squash(b, ang, -van);
        }
        /* a hard hit knocks a floating body loose — it bounces, then springs home */
        if (a.state === FLOAT && a.vx * a.vx + a.vy * a.vy > 62500) { a.state = FREE; a.restT = 0; }
        if (b.state === FLOAT && b.vx * b.vx + b.vy * b.vy > 62500) { b.state = FREE; b.restT = 0; }
      }
      var corr = Math.max(rs - d - 0.5, 0) / sum * 0.25;
      a.x -= ia * corr * nx; a.y -= ia * corr * ny;
      b.x += ib * corr * nx; b.y += ib * corr * ny;
    }

    function walls(b, g) {
      var iv;
      if (b.x < b.hw) {
        b.x = b.hw;
        if (b.vx < 0) { iv = -b.vx; b.vx = iv < 60 ? 0 : iv * 0.5; if (iv > 120) squash(b, 0, iv); }
      } else if (b.x > g.w - b.hw) {
        b.x = g.w - b.hw;
        if (b.vx > 0) { iv = b.vx; b.vx = iv < 60 ? 0 : -iv * 0.5; if (iv > 120) squash(b, 0, iv); }
      }
      if (b.y < b.hh) {
        b.y = b.hh;
        if (b.vy < 0) { iv = -b.vy; b.vy = iv < 60 ? 0 : iv * 0.5; if (iv > 120) squash(b, 1.5708, iv); }
      } else if (b.y > g.h - b.hh) {
        b.y = g.h - b.hh;
        if (b.vy > 0) { iv = b.vy; b.vy = iv < 60 ? 0 : -iv * 0.5; if (iv > 120) squash(b, 1.5708, iv); }
      }
    }

    function step(t) {
      var gi, g, list, i, j, k, b;
      for (gi = 0; gi < groups.length; gi++) {
        g = groups[gi];
        list = g.list;
        for (i = 0; i < list.length; i++) {
          b = list[i];
          if (b.state === HELD) {
            if (!g.rect) g.rect = g.el.getBoundingClientRect();
            var txp = clamp(b.cx - g.rect.left + b.gox, b.hw, g.w - b.hw);
            var typ = clamp(b.cy - g.rect.top + b.goy, b.hh, g.h - b.hh);
            var kk = 1 - Math.exp(-20 * H);
            var nx = b.x + (txp - b.x) * kk;
            var ny = b.y + (typ - b.y) * kk;
            b.vx = clamp((nx - b.x) / H, -5000, 5000);
            b.vy = clamp((ny - b.y) / H, -5000, 5000);
            b.x = nx; b.y = ny;
          } else {
            var ax = 0, ay = 0;
            if (b.state === FLOAT) {
              ax = -5 * (b.x - tgx(b, t)) - 4.4 * b.vx;
              ay = -5 * (b.y - tgy(b, t)) - 4.4 * b.vy;
            } else if (b.state === RETURN) {
              ax = -180 * (b.x - tgx(b, t)) - 13 * b.vx;
              ay = -180 * (b.y - tgy(b, t)) - 13 * b.vy;
            }
            b.vx += ax * H; b.vy += ay * H;
            if (b.state === FREE) { b.vx *= 0.994; b.vy *= 0.994; }
            var sp2 = b.vx * b.vx + b.vy * b.vy;
            if (sp2 > 16000000) {
              var sc = 4000 / Math.sqrt(sp2);
              b.vx *= sc; b.vy *= sc;
            }
            b.x += b.vx * H; b.y += b.vy * H;
          }
        }
        for (k = 0; k < 2; k++) {
          for (i = 0; i < list.length; i++) {
            for (j = i + 1; j < list.length; j++) collide(list[i], list[j]);
          }
        }
        for (i = 0; i < list.length; i++) {
          b = list[i];
          if (b.state !== HELD) walls(b, g);
          if (b.state === FREE) {
            var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (sp < 40) b.restT += H; else b.restT = 0;
            if (b.restT > 2.5) { b.state = RETURN; b.restT = 0; }
          } else if (b.state === RETURN) {
            var dx = b.x - tgx(b, t), dy = b.y - tgy(b, t);
            if (dx * dx + dy * dy < 4 && b.vx * b.vx + b.vy * b.vy < 100) b.state = FLOAT;
          }
          b.sv += (-400 * (b.s - 1) - 20 * b.sv) * H;
          b.s = clamp(b.s + b.sv * H, 0.82, 1.18);
          var ut = b.state === HELD ? 0.96 : 1;
          b.u += (ut - b.u) * 0.25;
          var tt = (b.state === HELD || b.state === FREE) ? clamp(b.vx * 0.012, -9, 9) : 0;
          b.tilt += (tt - b.tilt) * 0.12;
        }
      }
    }

    function render(alpha) {
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        var x = b.px + (b.x - b.px) * alpha - b.ax;
        var y = b.py + (b.y - b.py) * alpha - b.ay;
        var tr = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
        if (b.tilt > 0.05 || b.tilt < -0.05) tr += ' rotate(' + b.tilt.toFixed(2) + 'deg)';
        var s1 = b.s, ax = b.sax;
        if (s1 > 0.996 && s1 < 1.004) {
          s1 = 1;
          var sp2 = b.vx * b.vx + b.vy * b.vy;
          if (sp2 > 360000 && (b.state === FREE || b.state === HELD)) {
            s1 = 1 + Math.min(Math.sqrt(sp2) / 9000, 0.1);
            ax = Math.atan2(b.vy, b.vx);
          }
        }
        if (s1 !== 1 || b.u < 0.999) {
          var deg = ax * 57.2958;
          var dA = deg.toFixed(1), dB = (-deg).toFixed(1);
          tr += ' rotate(' + dA + 'deg) scale(' + (b.u * s1).toFixed(3) + ',' + (b.u / s1).toFixed(3) + ') rotate(' + dB + 'deg)';
        }
        b.el.style.transform = tr;
      }
    }

    /* ---- pointer: grab / lerp-follow / throw / click ---- */

    function grab(b, e) {
      if (b.state === HELD) return;
      b.pid = e.pointerId;
      b.suppress = false; /* a stale flag must never eat this gesture's click */
      try { b.el.setPointerCapture(e.pointerId); } catch (err) {}
      var g = b.g;
      g.rect = g.el.getBoundingClientRect();
      b.cx = e.clientX; b.cy = e.clientY;
      b.gox = b.x - (e.clientX - g.rect.left);
      b.goy = b.y - (e.clientY - g.rect.top);
      b.scx = e.clientX; b.scy = e.clientY;
      b.st = performance.now();
      b.moved = false;
      b.samples.length = 0;
      b.samples.push({ x: e.clientX, y: e.clientY, t: b.st });
      b.state = HELD; b.restT = 0;
    }

    function move(b, e) {
      if (b.state !== HELD || e.pointerId !== b.pid) return;
      b.cx = e.clientX; b.cy = e.clientY;
      b.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (b.samples.length > 24) b.samples.shift();
      if (!b.moved) {
        var dx = e.clientX - b.scx, dy = e.clientY - b.scy;
        /* fingers jitter ~10px through an honest tap; mice do not */
        var slop = e.pointerType === 'mouse' ? 64 : 196;
        if (dx * dx + dy * dy > slop) { b.moved = true; b.suppress = true; }
      }
    }

    function release(b, e) {
      if (b.state !== HELD || e.pointerId !== b.pid) return;
      b.pid = -1;
      var now = performance.now();
      if (!b.moved) {
        /* never crossed the slop: a click no matter how long the press —
           color bodies cycle; links navigate natively */
        b.state = FLOAT;
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
      if (sp > 3500) { vx *= 3500 / sp; vy *= 3500 / sp; sp = 3500; }
      if (sp < 50) { vx = 0; vy = 0; }
      b.vx = vx; b.vy = vy;
      b.state = FREE; b.restT = 0;
      if (b.suppress) setTimeout(function () { b.suppress = false; }, 400);
    }

    function bind(b) {
      /* sim-only affordances, inline so pages need no extra CSS.
         Slim (list-row) bodies keep vertical panning alive on touch — a
         phone must always be able to scroll a list; grabbing them stays
         full-fidelity on fine pointers. */
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

    /* ---- loop: fixed timestep + interpolated render ---- */

    /* window inertia (the Ball Pool move): dragging or shaking the OS
       window sloshes every body the other way. Invisible at rest, dead on
       mobile (screenX never moves), clamped so window-snap teleports are
       ignored rather than detonated. */
    var wsx = null, wsy = null;
    function windowKick() {
      var sx = window.screenX, sy = window.screenY;
      if (wsx === null) { wsx = sx; wsy = sy; return; }
      var dx = sx - wsx, dy = sy - wsy;
      wsx = sx; wsy = sy;
      if (dx === 0 && dy === 0) return;
      if (dx > 200 || dx < -200 || dy > 200 || dy < -200) return; /* snap/maximize */
      dx = clamp(dx, -80, 80); dy = clamp(dy, -80, 80);
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        if (b.state === HELD) continue;
        b.vx -= dx * 5.5;
        b.vy -= dy * 5.5;
        if (b.state === FLOAT && (dx * dx + dy * dy > 36)) { b.state = FREE; b.restT = 0; }
      }
    }

    var lastT = 0, acc = 0, simT = 0;
    function loop(now) {
      requestAnimationFrame(loop);
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
      render(clamp(acc / H, 0, 1));
    }

    /* ---- color-room re-entry: randomized reshuffle (the letter field) ---- */

    function watchRoom(g, list) {
      var wasOut = false;
      new IntersectionObserver(function (entries) {
        var vis = entries[entries.length - 1].isIntersecting;
        if (!vis) { wasOut = true; return; }
        if (!wasOut) return;
        wasOut = false;
        var idx = [1, 2, 3, 4, 5, 6];
        for (var i = idx.length - 1; i > 0; i--) {
          var j = (Math.random() * (i + 1)) | 0;
          var tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
        }
        for (var k = 0; k < list.length; k++) {
          list[k].ci = idx[k % idx.length];
          applyColor(list[k]);
          pop(list[k]);
        }
      }, { threshold: 0.04 }).observe(g.el);
    }

    function watchColorRooms() {
      if (!('IntersectionObserver' in window)) return;
      for (var gi = 0; gi < groups.length; gi++) {
        var g = groups[gi], cyc = [];
        for (var i = 0; i < g.list.length; i++) {
          if (g.list[i].cyc) cyc.push(g.list[i]);
        }
        if (cyc.length) watchRoom(g, cyc);
      }
    }

    function onResize() {
      var prev = [];
      for (var gi = 0; gi < groups.length; gi++) prev.push({ w: groups[gi].w, h: groups[gi].h });
      for (var bi = 0; bi < bodies.length; bi++) {
        var bb = bodies[bi];
        /* measured-home bodies parked at home snap to the reflowed home */
        bb._home = bb.wa === 0 && bb.state === FLOAT &&
          Math.abs(bb.x - bb.hx) < 1 && Math.abs(bb.y - bb.hy) < 1;
      }
      measureAll();
      for (gi = 0; gi < groups.length; gi++) {
        var g = groups[gi], p = prev[gi];
        for (var i = 0; i < g.list.length; i++) {
          var b = g.list[i];
          if (b._home) {
            b.x = b.hx; b.y = b.hy;
          } else {
            if (p.w > 0) b.x = b.x / p.w * g.w;
            if (p.h > 0) b.y = b.y / p.h * g.h;
            b.x = clamp(b.x, b.hw, g.w - b.hw);
            b.y = clamp(b.y, b.hh, g.h - b.hh);
          }
          b.px = b.x; b.py = b.y;
        }
      }
    }

    var started = false;
    function start() {
      if (started) return;
      started = true;
      makeBodies(els);
      if (!bodies.length) return;
      measureAll();
      for (var i = 0; i < bodies.length; i++) {
        var b = bodies[i];
        b.x = b.px = b.hx;
        b.y = b.py = b.hy;
        bind(b);
      }
      render(1);
      for (var gi = 0; gi < groups.length; gi++) groups[gi].el.classList.add('sim');
      watchColorRooms();
      /* V3.1: the landing's pop portals bump the words — a minimal
         read/kick surface. Viewport-space circles out, impulses in; held
         bodies are untouchable. (index.astro's blob loop is the consumer.) */
      window.__zg = {
        each: function (fn) {
          for (var i = 0; i < bodies.length; i++) {
            var b = bodies[i];
            if (b.state === HELD) continue;
            var rc = b.el.getBoundingClientRect();
            fn(i, rc.left + rc.width / 2, rc.top + rc.height / 2, b.r);
          }
        },
        kick: function (i, vx, vy) {
          var b = bodies[i];
          if (!b || b.state === HELD) return;
          b.vx += vx; b.vy += vy;
          /* a real shove knocks a floating body loose; it springs home after */
          if (b.state === FLOAT && b.vx * b.vx + b.vy * b.vy > 22500) { b.state = FREE; b.restT = 0; }
        },
      };
      var rT = 0;
      addEventListener('resize', function () {
        clearTimeout(rT);
        rT = setTimeout(onResize, 150);
      });
      /* failsafe: if pointer capture was refused/lost, the element never
         hears pointerup and a body would stay glued to a ghost cursor —
         the window always hears it */
      function releaseAny(e) {
        for (var i = 0; i < bodies.length; i++) {
          var b = bodies[i];
          if (b.state === HELD && b.pid === e.pointerId) release(b, e);
        }
      }
      addEventListener('pointerup', releaseAny, true);
      addEventListener('pointercancel', releaseAny, true);
      requestAnimationFrame(loop);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (started) onResize(); else start();
      });
      setTimeout(start, 1600);
    } else {
      start();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
