/* ─────────────────────────────────────────────────────────────────────────
   Site 1 — the sketch engine (R5).

   The whole site is a sheet of paper. This file owns everything the pencil
   does: drawing, the pencil box (lead / point / tool), per-page persistence,
   the save-as-JPG export, the landing auto-draw demo, the TRES letter
   erasers, and the mobile draw mode.

   Coordinate model: strokes live in DOCUMENT coords (client + scroll at
   capture) and render onto a fixed viewport canvas — marks stay glued to
   the page content and scroll off screen like anything else on the sheet.
   One sheet per pathname in localStorage.

   Render architecture (the pattern pipeline is expensive; scroll is not
   allowed to pay for it):
     · saved strokes bake ONCE into an offscreen buffer band (viewport +
       margin above/below, device px); scroll frames only blit the band
     · the in-progress stroke draws incrementally onto BOTH the buffer and
       the screen — live latency never waits for a bake
     · erasing uses destination-out on the buffer as the live preview and
       reconciles with a real re-bake on release
   Rendering is deterministic: every stroke carries a seed; ghost-pass
   jitter comes from a PRNG keyed (seed, segment index), so re-bakes never
   shimmer. Erase splits inherit the parent's seed + offset.

   DOM contract (provided by _pencil.astro on every site-1 page):
     #sk-cv canvas · #sk-tools stack (#sk-opt/#sk-clear/#sk-save/#sk-bg)
     #sk-box popover · #sk-mob mobile toggle
     landing only: body[data-sk-demo] + #sk-mark with .ml letter spans
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var cv = document.getElementById('sk-cv');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  if (!ctx) return;
  var buf = document.createElement('canvas');
  var bctx = buf.getContext('2d');

  var fine = false, reduce = false;
  try {
    fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  /* ── identity ──────────────────────────────────────────────────────────── */

  var PATH = location.pathname.replace(/\/+$/, '') || '/';
  var KEY = 'mv1-sheet:' + PATH;
  var TOOLKEY = 'mv1-pencil';
  try { localStorage.removeItem('mv1-sketch'); } catch (e) {} /* pre-R5 viewport-coord data */

  var LEADS = [
    { id: 'graphite',  hex: '#2B1F1A', rgb: [43, 31, 26] },
    { id: 'sanguine',  hex: '#B4543B', rgb: [180, 84, 59] },
    { id: 'blueprint', hex: '#35608A', rgb: [53, 96, 138] },
    { id: 'umber',     hex: '#BF9270', rgb: [191, 146, 112] }
  ];
  var POINTS = [0.6, 1, 1.9];            /* F / M / B width multipliers */
  var TOOLS = ['pencil', 'ink', 'marker', 'eraser'];
  var MAX_PTS = 8000;                    /* per sheet */
  var ERASE_R = 16;                      /* eraser tool radius, css px */
  var BAND = 0.75;                       /* buffer margin, fraction of vh per side */

  /* pencil state — remembered across pages and sessions */
  var lead = 0, point = 1, tool = 0, bgOnly = false;
  try {
    var ts = JSON.parse(localStorage.getItem(TOOLKEY));
    if (ts) {
      if (ts.c >= 0 && ts.c < LEADS.length) lead = ts.c;
      if (ts.s >= 0 && ts.s < POINTS.length) point = ts.s;
      if (ts.t >= 0 && ts.t < TOOLS.length - 1) tool = ts.t; /* never boot into eraser */
      bgOnly = !!ts.b;
    }
  } catch (e) {}
  function saveTools() {
    try { localStorage.setItem(TOOLKEY, JSON.stringify({ c: lead, s: point, t: tool, b: bgOnly ? 1 : 0 })); } catch (e) {}
  }

  /* ── sheet storage ─────────────────────────────────────────────────────── */
  /* stroke: { t: toolIdx, c: leadIdx, seed, o: segRngOffset, p: [[x,y,w]…], bb } */

  var strokes = [];
  try {
    var raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.v === 2 && Array.isArray(raw.s)) {
      strokes = raw.s.filter(function (s) { return s && Array.isArray(s.p) && s.p.length > 1; });
    }
  } catch (e) {}
  strokes.forEach(bbox);

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        v: 2,
        s: strokes.map(function (s) { return { t: s.t, c: s.c, seed: s.seed, o: s.o || 0, p: s.p }; })
      }));
    } catch (e) {}
  }
  function trim() {
    var total = 0, i;
    for (i = 0; i < strokes.length; i++) total += strokes[i].p.length;
    while (total > MAX_PTS && strokes.length > 1) total -= strokes.shift().p.length;
  }
  function bbox(s) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, i, p;
    for (i = 0; i < s.p.length; i++) {
      p = s.p[i];
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    s.bb = [x0 - 26, y0 - 26, x1 + 26, y1 + 26];
  }

  /* Ramer-Douglas-Peucker — finished strokes shed redundant points before
     persisting; keeps localStorage lean and re-renders identically */
  function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    var keep = new Uint8Array(pts.length);
    keep[0] = keep[pts.length - 1] = 1;
    var stack = [[0, pts.length - 1]];
    while (stack.length) {
      var seg = stack.pop(), a = seg[0], b = seg[1];
      var A = pts[a], B = pts[b];
      var dx = B[0] - A[0], dy = B[1] - A[1];
      var len2 = dx * dx + dy * dy || 1;
      var far = -1, fd = 0;
      for (var i = a + 1; i < b; i++) {
        var t = Math.max(0, Math.min(1, ((pts[i][0] - A[0]) * dx + (pts[i][1] - A[1]) * dy) / len2));
        var px = A[0] + t * dx - pts[i][0], py = A[1] + t * dy - pts[i][1];
        var d = px * px + py * py;
        if (d > fd) { fd = d; far = i; }
      }
      if (fd > eps * eps && far > 0) {
        keep[far] = 1;
        stack.push([a, far], [far, b]);
      }
    }
    var out = [];
    for (var k = 0; k < pts.length; k++) if (keep[k]) out.push(pts[k]);
    return chunk(out, 26);
  }

  /* the eraser tests POINTS, so no segment may grow longer than `step` —
     re-subdivide what rdp straightened, lerping width */
  function chunk(pts, step) {
    var out = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var d = Math.sqrt(dx * dx + dy * dy);
      var n = Math.ceil(d / step);
      for (var k = 1; k <= n; k++) {
        var t = k / n;
        out.push(k === n ? b : [
          Math.round(a[0] + dx * t),
          Math.round(a[1] + dy * t),
          Math.round((a[2] + (b[2] - a[2]) * t) * 10) / 10
        ]);
      }
    }
    return out;
  }

  /* ── deterministic grain ───────────────────────────────────────────────── */

  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function segRng(seed, i) { return mulberry((seed ^ Math.imul(i + 1, 2654435761)) | 0); }

  /* graphite tooth per lead — noise tile the pencil strokes pick up */
  var pats = [];
  function makePatterns() {
    pats = LEADS.map(function (L) {
      var n = document.createElement('canvas');
      n.width = n.height = 64;
      var nx = n.getContext('2d');
      var id = nx.createImageData(64, 64);
      var r = mulberry(7);
      for (var i = 0; i < id.data.length; i += 4) {
        id.data[i] = L.rgb[0]; id.data[i + 1] = L.rgb[1]; id.data[i + 2] = L.rgb[2];
        id.data[i + 3] = 150 + (r() * 105 | 0);
      }
      nx.putImageData(id, 0, 0);
      return ctx.createPattern(n, 'repeat');
    });
  }

  /* ── the renderer ──────────────────────────────────────────────────────── */
  /* One smoothed segment (quadratic through midpoints) in doc coords,
     translated by (ox, oy). Tool decides the hand:
       pencil — three ghost passes with seeded jitter over the tooth pattern
       ink    — one confident pass, full color
       marker — one broad translucent pass, flat and juicy               */

  function drawSeg(g, s, i, ox, oy, alpha) {
    var pts = s.p;
    var pp = i > 1 ? pts[i - 2] : null, p0 = pts[i - 1], p1 = pts[i];
    var m0x = pp ? (pp[0] + p0[0]) / 2 : p0[0];
    var m0y = pp ? (pp[1] + p0[1]) / 2 : p0[1];
    var m1x = (p0[0] + p1[0]) / 2, m1y = (p0[1] + p1[1]) / 2;
    var w = p1[2], t = TOOLS[s.t] || 'pencil';
    var rng = segRng(s.seed, (s.o || 0) + i);
    var fade = alpha === undefined ? 1 : alpha;

    function jr(k) { return (rng() - 0.5) * k; }
    function path(o) {
      g.beginPath();
      g.moveTo(m0x + jr(o) + ox, m0y + jr(o) + oy);
      g.quadraticCurveTo(p0[0] + jr(o) + ox, p0[1] + jr(o) + oy, m1x + jr(o) + ox, m1y + jr(o) + oy);
      g.stroke();
    }

    if (t === 'ink') {
      g.strokeStyle = LEADS[s.c].hex;
      g.globalAlpha = 0.92 * fade;
      g.lineWidth = Math.max(0.6, w * 0.8);
      path(0);
    } else if (t === 'marker') {
      g.strokeStyle = LEADS[s.c].hex;
      g.globalAlpha = 0.26 * fade;
      g.lineWidth = Math.max(6, w * 5);
      path(0);
    } else {
      g.strokeStyle = pats[s.c] || LEADS[s.c].hex;
      var passes = [[0.32, 0], [0.16, 1.4], [0.09, 0.8]];
      for (var k = 0; k < passes.length; k++) {
        g.globalAlpha = passes[k][0] * (0.8 + rng() * 0.4) * fade;
        g.lineWidth = Math.max(0.5, w * (k === 0 ? 1 : 0.6 + rng() * 0.7));
        path(passes[k][1]);
      }
    }
    g.globalAlpha = 1;
  }

  function drawStroke(g, s, ox, oy, alpha) {
    for (var i = 1; i < s.p.length; i++) drawSeg(g, s, i, ox, oy, alpha);
  }

  /* demo strokes live beside user strokes: ephemeral, never persisted */
  var demo = [], demoFade = 1;

  /* ── buffer band + compositing ─────────────────────────────────────────── */

  var vw = 0, vh = 0, dpr = 1;
  var bandY = 0, bandH = 0;   /* band top in doc coords, band height in css px */

  function bake() {
    bandH = vh * (1 + BAND * 2);
    bandY = Math.max(0, (window.scrollY || 0) - vh * BAND);
    if (buf.width !== cv.width || buf.height !== Math.round(bandH * dpr)) {
      buf.width = cv.width;
      buf.height = Math.round(bandH * dpr);
    }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, buf.width, buf.height);
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.lineCap = 'round';
    bctx.lineJoin = 'round';
    var top = bandY, bot = bandY + bandH;
    for (var i = 0; i < strokes.length; i++) {
      var s = strokes[i];
      if (s.bb[3] < top || s.bb[1] > bot) continue;
      drawStroke(bctx, s, 0, -bandY);
    }
    if (cur && cur.p.length > 1) drawStroke(bctx, cur, 0, -bandY);
  }

  function frame() {
    var sy = window.scrollY || 0, sx = window.scrollX || 0;
    if (sy < bandY || sy + vh > bandY + bandH) bake();
    ctx.clearRect(0, 0, vw, vh);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(buf, 0, Math.round((bandY - sy) * dpr));
    ctx.restore();
    if (demo.length && demoFade > 0) {
      for (var i = 0; i < demo.length; i++) drawStroke(ctx, demo[i], -sx, -sy, 0.85 * demoFade);
    }
  }

  var rafId = null;
  function queue() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () { rafId = null; frame(); });
  }
  function rebake() { bake(); queue(); }

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    vw = window.innerWidth; vh = window.innerHeight;
    /* one coordinate space: CSS box is set from the same numbers as the
       bitmap, so clientX/Y, the bitmap, and the box can never disagree */
    cv.style.width = vw + 'px';
    cv.style.height = vh + 'px';
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    makePatterns();
    bake();
    frame();
  }

  /* ── vector eraser ─────────────────────────────────────────────────────── */
  /* Remove points within r of (x, y) in doc coords, splitting strokes into
     surviving runs. Splits inherit seed + point offset so their grain does
     not jump. Live feedback is destination-out on the buffer; the honest
     re-bake happens once per gesture on release. */

  function eraseAt(x, y, r, arr) {
    var r2 = r * r, changed = false, out = [], i, j, s, run, runStart;
    for (i = 0; i < arr.length; i++) {
      s = arr[i];
      if (x + r < s.bb[0] || x - r > s.bb[2] || y + r < s.bb[1] || y - r > s.bb[3]) { out.push(s); continue; }
      var hit = false;
      run = null; runStart = 0;
      var pieces = [];
      for (j = 0; j < s.p.length; j++) {
        var dx = s.p[j][0] - x, dy = s.p[j][1] - y;
        if (dx * dx + dy * dy > r2) {
          if (!run) { run = []; runStart = j; }
          run.push(s.p[j]);
        } else {
          hit = true;
          if (run && run.length > 1) pieces.push({ run: run, at: runStart });
          run = null;
        }
      }
      if (!hit) { out.push(s); continue; }
      changed = true;
      if (run && run.length > 1) pieces.push({ run: run, at: runStart });
      for (j = 0; j < pieces.length; j++) {
        var ns = { t: s.t, c: s.c, seed: s.seed, o: (s.o || 0) + pieces[j].at, p: pieces[j].run };
        bbox(ns);
        out.push(ns);
      }
    }
    if (changed) { arr.length = 0; Array.prototype.push.apply(arr, out); }
    return changed;
  }

  var erasedDirty = false;
  function eraseLive(x, y, r) {
    var a = eraseAt(x, y, r, strokes);
    var b = demo.length ? eraseAt(x, y, r, demo) : false;
    if (!a && !b) return;
    erasedDirty = erasedDirty || a;
    /* cheap visual: punch the hole in the baked band + repaint */
    bctx.save();
    bctx.globalCompositeOperation = 'destination-out';
    bctx.beginPath();
    bctx.arc(x, y - bandY, r, 0, Math.PI * 2);
    bctx.fill();
    bctx.restore();
    queue();
  }
  function eraseSettle() {
    if (!erasedDirty) return;
    erasedDirty = false;
    persist();
    refreshBtns();
    rebake();
  }

  /* ── UI: the stack + the pencil box ────────────────────────────────────── */

  var elOpt = document.getElementById('sk-opt');
  var elClear = document.getElementById('sk-clear');
  var elSave = document.getElementById('sk-save');
  var elSaveRow = document.getElementById('sk-save-row');
  var elBg = document.getElementById('sk-bg');
  var elBox = document.getElementById('sk-box');
  var elMob = document.getElementById('sk-mob');

  function refreshBtns() {
    var on = strokes.length > 0 || demo.length > 0;
    if (elClear) elClear.classList.toggle('sk-off', !on);
    if (elSaveRow) elSaveRow.classList.toggle('sk-off', !on);
  }

  /* cursor: the pencil tip carries the current lead; eraser gets the block */
  function cursorFor() {
    if (!fine) return;
    var css;
    if (TOOLS[tool] === 'eraser') {
      css = 'url("data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><rect x="4" y="9" width="18" height="10" rx="2" transform="rotate(-20 13 14)" fill="#EDCDBB" stroke="#2B1F1A" stroke-width="1.4"/><path d="M9.5 7.5l3.4 9.4" stroke="#2B1F1A" stroke-width="1.1"/></svg>'
      ) + '") 13 14, auto';
    } else {
      css = 'url("data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><path fill="' + LEADS[lead].hex + '" d="M3 23L5.1 16.7 8 13.8 12.2 18 9.3 20.9Z"/><path fill="#2B1F1A" d="M8 13.8L13.6 8.2 17.8 12.4 12.2 18Z"/><path stroke="#FFEDDB" stroke-width="1.1" fill="none" d="M11.5 10.3L15.7 14.5"/></svg>'
      ) + '") 3 23, auto';
    }
    document.documentElement.style.setProperty('--sk-cursor', css);
  }

  function syncBox() {
    if (!elBox) return;
    var i;
    var cs = elBox.querySelectorAll('[data-lead]');
    for (i = 0; i < cs.length; i++) cs[i].setAttribute('aria-pressed', String(+cs[i].getAttribute('data-lead') === lead));
    var ss = elBox.querySelectorAll('[data-point]');
    for (i = 0; i < ss.length; i++) ss[i].setAttribute('aria-pressed', String(+ss[i].getAttribute('data-point') === point));
    var tsb = elBox.querySelectorAll('[data-tool]');
    for (i = 0; i < tsb.length; i++) tsb[i].setAttribute('aria-pressed', String(+tsb[i].getAttribute('data-tool') === tool));
    if (elBg) elBg.setAttribute('aria-pressed', String(bgOnly));
    cursorFor();
  }

  var boxOpen = false;
  function toggleBox(open) {
    if (!elBox || !elOpt) return;
    boxOpen = open === undefined ? !boxOpen : open;
    elBox.classList.toggle('sk-open', boxOpen);
    elOpt.setAttribute('aria-expanded', String(boxOpen));
    if (!boxOpen && document.activeElement && elBox.contains(document.activeElement)) elOpt.focus();
  }

  if (elOpt) elOpt.addEventListener('click', function () { toggleBox(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && boxOpen) toggleBox(false);
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      if (strokes.length) {
        strokes.pop();
        persist(); refreshBtns(); rebake();
        e.preventDefault();
      }
    }
  });
  document.addEventListener('pointerdown', function (e) {
    if (boxOpen && !e.target.closest('#sk-box') && !e.target.closest('#sk-opt')) toggleBox(false);
  }, true);

  if (elBox) {
    elBox.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-lead')) { lead = +b.getAttribute('data-lead'); if (TOOLS[tool] === 'eraser') tool = 0; }
      else if (b.hasAttribute('data-point')) point = +b.getAttribute('data-point');
      else if (b.hasAttribute('data-tool')) tool = +b.getAttribute('data-tool');
      else if (b.id === 'sk-undo') {
        if (strokes.length) { strokes.pop(); persist(); refreshBtns(); rebake(); }
        return;
      } else return;
      saveTools(); syncBox();
    });
  }

  if (elClear) elClear.addEventListener('click', function () {
    strokes = [];
    killDemo();
    try { localStorage.removeItem(KEY); } catch (e) {}
    refreshBtns(); rebake();
  });

  if (elBg) elBg.addEventListener('click', function () {
    bgOnly = !bgOnly;
    saveTools(); syncBox();
  });

  /* ── save sketch: viewport → JPG ───────────────────────────────────────── */
  /* Layers, matching the page's own stacking: cream, page type (unless [b]),
     strokes, paper grain. Type is re-rendered with fillText from computed
     styles — never a foreignObject, so fonts stay clean and nothing taints. */

  var GRAINS = [
    { url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)'/%3E%3C/svg%3E", a: 0.045 },
    { url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='560' height='560'%3E%3Cfilter id='m'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.045' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='560' height='560' filter='url(%23m)'/%3E%3C/svg%3E", a: 0.03 }
  ];

  function loadImg(src) {
    return new Promise(function (res) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = function () { res(null); };
      im.src = src;
    });
  }

  function visible(el) {
    var e = el;
    while (e && e !== document.body) {
      var cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
      e = e.parentElement;
    }
    return true;
  }

  function transform(text, mode) {
    if (mode === 'uppercase') return text.toUpperCase();
    if (mode === 'lowercase') return text.toLowerCase();
    if (mode === 'capitalize') return text.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    return text;
  }

  /* re-render the page's visible type + hairlines into g (viewport coords) */
  function paintType(g) {
    var SKIP = '[data-sk-ui],.mv-paper,.lb,.pv,.r-pv,#mv-map,script,style,canvas,img,video,svg';
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      var el = node.parentElement;
      if (!visible(el)) continue;
      var range = document.createRange();
      range.selectNodeContents(node);
      var rects = Array.prototype.slice.call(range.getClientRects()).filter(function (r) {
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
      });
      if (!rects.length) continue;
      var cs = getComputedStyle(el);
      var fs = parseFloat(cs.fontSize) || 16;
      g.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      if ('letterSpacing' in g) g.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
      g.fillStyle = cs.color;
      g.textBaseline = 'alphabetic';
      var text = transform(node.nodeValue.replace(/\s+/g, ' '), cs.textTransform);
      if (rects.length === 1) {
        var r0 = rects[0];
        g.fillText(text.trim(), r0.left, r0.top + (r0.height - fs) / 2 + fs * 0.8);
      } else {
        /* wrapped text: greedy re-wrap against each line rect's width */
        var words = text.trim().split(' ');
        var wi = 0;
        for (var li = 0; li < rects.length && wi < words.length; li++) {
          var line = words[wi], next;
          while (wi + 1 < words.length) {
            next = line + ' ' + words[wi + 1];
            if (g.measureText(next).width > rects[li].width + 2) break;
            line = next; wi++;
          }
          wi++;
          var rl = rects[li];
          g.fillText(line, rl.left, rl.top + (rl.height - fs) / 2 + fs * 0.8);
        }
      }
    }
    /* hairlines — the rules are part of the sheet */
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var e2 = all[i];
      if (e2.closest(SKIP) || !visible(e2)) continue;
      var c2 = getComputedStyle(e2);
      var rb = null;
      if (parseFloat(c2.borderBottomWidth) > 0 && c2.borderBottomStyle === 'solid') {
        rb = e2.getBoundingClientRect();
        if (rb.width > 0 && rb.bottom > 0 && rb.bottom < vh) {
          g.strokeStyle = c2.borderBottomColor; g.lineWidth = parseFloat(c2.borderBottomWidth);
          g.beginPath(); g.moveTo(rb.left, rb.bottom); g.lineTo(rb.right, rb.bottom); g.stroke();
        }
      }
      if (parseFloat(c2.borderTopWidth) > 0 && c2.borderTopStyle === 'solid') {
        rb = rb || e2.getBoundingClientRect();
        if (rb.width > 0 && rb.top > 0 && rb.top < vh) {
          g.strokeStyle = c2.borderTopColor; g.lineWidth = parseFloat(c2.borderTopWidth);
          g.beginPath(); g.moveTo(rb.left, rb.top); g.lineTo(rb.right, rb.top); g.stroke();
        }
      }
    }
  }

  var saving = false;
  function saveSketch() {
    if (saving || !elSave) return;
    saving = true;
    var out = document.createElement('canvas');
    out.width = Math.round(vw * dpr); out.height = Math.round(vh * dpr);
    var g = out.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = '#FFEDDB';
    g.fillRect(0, 0, vw, vh);

    if (!bgOnly) { try { paintType(g); } catch (e) {} }

    var sx = -(window.scrollX || 0), sy = -(window.scrollY || 0);
    var i;
    for (i = 0; i < strokes.length; i++) drawStroke(g, strokes[i], sx, sy);
    if (demo.length && demoFade > 0) for (i = 0; i < demo.length; i++) drawStroke(g, demo[i], sx, sy, 0.85 * demoFade);

    Promise.all(GRAINS.map(function (t) { return loadImg(t.url); })).then(function (imgs) {
      for (var k = 0; k < imgs.length; k++) {
        if (!imgs[k]) continue;
        var pat = g.createPattern(imgs[k], 'repeat');
        g.globalCompositeOperation = 'multiply';
        g.globalAlpha = GRAINS[k].a;
        g.fillStyle = pat;
        g.fillRect(0, 0, vw, vh);
      }
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
      var name = PATH.split('/').filter(Boolean).pop() || 'index';
      if (name === '1') name = 'index';
      var a = document.createElement('a');
      a.download = 'tres-sketch-' + name + '.jpg';
      a.href = out.toDataURL('image/jpeg', 0.92);
      a.click();
      elSave.textContent = '[ saved ]';
      setTimeout(function () { elSave.textContent = '[ save sketch ]'; saving = false; }, 1100);
    });
  }
  if (elSave) elSave.addEventListener('click', saveSketch);

  /* ── mobile draw mode ──────────────────────────────────────────────────── */

  var mdraw = false;
  function setMdraw(on) {
    mdraw = on;
    document.body.classList.toggle('sk-mdraw', on);
    if (elMob) {
      elMob.textContent = on ? '[ done ]' : '[ draw ]';
      elMob.setAttribute('aria-pressed', String(on));
    }
    if (!on) { endStroke(); toggleBox(false); }
  }
  if (elMob) elMob.addEventListener('click', function () { setMdraw(!mdraw); });

  /* in draw mode the page is paper: links are inert so a stroke over the
     menu never navigates */
  document.addEventListener('click', function (e) {
    if (!mdraw) return;
    if (e.target.closest('[data-sk-ui]')) return;
    var a = e.target.closest('a,button');
    if (a) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  /* ── drawing ───────────────────────────────────────────────────────────── */

  function canDraw(e) {
    if (e.target && e.target.closest &&
        (e.target.closest('[data-sk-ui]') || e.target.closest('.lb') ||
         e.target.closest('.ml') || e.target.closest('#mv-map'))) return false;
    if (e.pointerType === 'touch') return mdraw;  /* fingers draw only in draw mode */
    return fine || mdraw;                          /* mouse/pen: always on fine devices */
  }

  var drawing = false, cur = null, activeId = null, vf = 0, lastT = 0, lastW = 2.2, swallow = false;

  function addPoint(x, y, tstamp, pressure, ptype) {
    var last = cur.p[cur.p.length - 1];
    var dx = x - last[0], dy = y - last[1];
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d < 2.5) return;
    var dt = Math.max(1, tstamp - lastT);
    lastT = tstamp;
    var v = d / dt;
    vf = 0.7 * v + 0.3 * vf;
    var w = Math.min(2.6, Math.max(1.2, 2.6 / (vf + 0.8))) * POINTS[point];
    if (ptype === 'pen' && pressure > 0 && pressure < 1) w *= 0.55 + pressure * 0.9;
    w = lastW + (w - lastW) * 0.35;
    lastW = w;
    cur.p.push([Math.round(x), Math.round(y), Math.round(w * 10) / 10]);
    var i = cur.p.length - 1;
    var sy = window.scrollY || 0, sx = window.scrollX || 0;
    drawSeg(ctx, cur, i, -sx, -sy);          /* screen: zero-latency */
    drawSeg(bctx, cur, i, 0, -bandY);        /* band: survives the next blit */
    if (cur.p.length === 4) swallow = true;
  }

  addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    swallow = false;
    if (!canDraw(e)) return;
    if (boxOpen) return;
    if (drawing && e.pointerId !== activeId) {
      /* second finger while drawing = the visitor wants to scroll (or it is
         a palm) — cancel the in-flight stroke and yield */
      cur = null; drawing = false; activeId = null;
      document.body.classList.remove('sk-drawing');
      rebake();
      return;
    }
    killDemo();
    drawing = true;
    activeId = e.pointerId;
    vf = 0; lastT = e.timeStamp; lastW = 2.2 * POINTS[point];
    var x = Math.round(e.clientX + (window.scrollX || 0));
    var y = Math.round(e.clientY + (window.scrollY || 0));
    if (TOOLS[tool] === 'eraser') {
      cur = null;
      eraseLive(x, y, ERASE_R * POINTS[point] * 1.4);
    } else {
      cur = {
        t: tool, c: lead,
        seed: (Math.random() * 0x7fffffff) | 0, o: 0,
        p: [[x, y, 2 * POINTS[point]]]
      };
    }
    document.body.classList.add('sk-drawing');
  }, { passive: true });

  addEventListener('pointermove', function (e) {
    if (!drawing || e.pointerId !== activeId) return;
    var sx = window.scrollX || 0, sy = window.scrollY || 0;
    if (TOOLS[tool] === 'eraser') {
      eraseLive(e.clientX + sx, e.clientY + sy, ERASE_R * POINTS[point] * 1.4);
      return;
    }
    if (!cur) return;
    var events = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (events && events.length) {
      for (var k = 0; k < events.length; k++) {
        var ce = events[k];
        addPoint(ce.clientX + sx, ce.clientY + sy, ce.timeStamp || e.timeStamp, ce.pressure, e.pointerType);
      }
    } else {
      addPoint(e.clientX + sx, e.clientY + sy, e.timeStamp, e.pressure, e.pointerType);
    }
  }, { passive: true });

  function endStroke() {
    if (!drawing) return;
    drawing = false;
    activeId = null;
    document.body.classList.remove('sk-drawing');
    eraseSettle();
    if (cur && cur.p.length > 1) {
      cur.p = rdp(cur.p, 0.55);
      bbox(cur);
      strokes.push(cur);
      trim(); persist(); refreshBtns();
      rebake();
    } else if (cur && mdraw && cur.p.length === 1) {
      /* a tap in draw mode is a dot — pencils dot */
      var p0 = cur.p[0];
      cur.p.push([p0[0] + 1.5, p0[1] + 1.5, 2 * POINTS[point]]);
      bbox(cur);
      strokes.push(cur);
      persist(); refreshBtns(); rebake();
    }
    cur = null;
  }
  addEventListener('pointerup', endStroke, { passive: true });
  addEventListener('pointercancel', endStroke, { passive: true });
  addEventListener('blur', endStroke);
  addEventListener('dragstart', function (e) { if (drawing) e.preventDefault(); });

  /* a real stroke that started on a link should not also navigate */
  addEventListener('click', function (e) {
    if (swallow) {
      swallow = false;
      if (!e.target.closest('[data-sk-ui]')) { e.preventDefault(); e.stopPropagation(); }
    }
  }, true);

  addEventListener('scroll', queue, { passive: true });
  var rto = null;
  function resized() {
    clearTimeout(rto);
    rto = setTimeout(size, 120);
  }
  addEventListener('resize', resized);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resized);

  /* hybrid devices: a tap must not leave sticky :hover dims behind —
     pages read this class to neutralize hover-only styling */
  addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') document.body.classList.add('sk-touch');
  }, { passive: true, capture: true });
  addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') document.body.classList.remove('sk-touch');
  }, { passive: true, capture: true });

  /* ── the TRES letters are erasers ──────────────────────────────────────── */

  (function letters() {
    var mark = document.getElementById('sk-mark');
    if (!mark) return;
    var mls = mark.querySelectorAll('.ml');
    for (var i = 0; i < mls.length; i++) {
      (function (ml) {
        var sx0 = 0, sy0 = 0, dragging = false, moved = false, r = 30;
        ml.addEventListener('pointerdown', function (e) {
          if (e.button !== 0) return;
          dragging = true; moved = false;
          killDemo();
          sx0 = e.clientX; sy0 = e.clientY;
          var rect = ml.getBoundingClientRect();
          r = Math.max(rect.width, rect.height) * 0.34;
          ml.classList.add('ml-drag');
          document.body.classList.add('sk-erasing');
          try { ml.setPointerCapture(e.pointerId); } catch (err) {}
          e.preventDefault();
        });
        ml.addEventListener('pointermove', function (e) {
          if (!dragging) return;
          var dx = e.clientX - sx0, dy = e.clientY - sy0;
          if (!moved && dx * dx + dy * dy < 9) return;
          moved = true;
          ml.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(-4deg) scale(1.04)';
          eraseLive(e.clientX + (window.scrollX || 0), e.clientY + (window.scrollY || 0), r);
        });
        function drop() {
          if (!dragging) return;
          dragging = false;
          eraseSettle();
          ml.classList.remove('ml-drag');
          if (moved) {
            ml.classList.add('ml-home');
            ml.style.transform = '';
            setTimeout(function () { ml.classList.remove('ml-home'); }, 520);
          } else {
            ml.style.transform = '';
          }
          document.body.classList.remove('sk-erasing');
        }
        ml.addEventListener('pointerup', drop);
        ml.addEventListener('pointercancel', drop);
      })(mls[i]);
    }
  })();

  /* ── the demo: the site sketches first ─────────────────────────────────── */
  /* Landing only. Traces the TRES letterforms, scribbles the period, then
     handwrites "draw something" under the spec line. Ephemeral — fades the
     moment the visitor picks up the pencil. Skipped under reduced motion,
     on coarse pointers, when the sheet already has marks, and after it has
     run once this session. */

  var demoTimers = [], demoRunning = false;

  function killDemo() {
    demoRunning = false;
    if (demoTimers.length) {
      demoTimers.forEach(clearTimeout);
      demoTimers = [];
    }
    if (!demo.length || demoFade < 1) return;
    var t0 = performance.now();
    (function fadeStep(now) {
      demoFade = Math.max(0, 1 - (now - t0) / 600);
      queue();
      if (demoFade > 0) requestAnimationFrame(fadeStep);
      else { demo = []; demoFade = 1; refreshBtns(); queue(); }
    })(t0);
  }

  /* silhouette traces for T R E S in a 0..1 glyph box (y: 0 top, 1 base) */
  var CAPS = {
    T: [[[0.04, 0.04], [0.5, 0.02], [0.97, 0.03], [0.97, 0.2], [0.64, 0.2], [0.64, 0.6], [0.63, 0.97], [0.38, 0.97], [0.38, 0.2], [0.03, 0.21], [0.04, 0.05], [0.12, 0.04]]],
    R: [
      [[0.07, 0.97], [0.07, 0.5], [0.08, 0.03], [0.55, 0.02], [0.8, 0.06], [0.93, 0.19], [0.93, 0.33], [0.83, 0.47], [0.63, 0.55], [0.78, 0.72], [0.94, 0.96], [0.7, 0.97], [0.52, 0.68], [0.33, 0.6], [0.32, 0.97], [0.09, 0.98]],
      [[0.32, 0.19], [0.55, 0.18], [0.67, 0.25], [0.66, 0.34], [0.54, 0.4], [0.33, 0.4], [0.32, 0.2]]
    ],
    E: [[[0.93, 0.04], [0.5, 0.02], [0.09, 0.03], [0.08, 0.5], [0.09, 0.97], [0.94, 0.98], [0.94, 0.8], [0.33, 0.8], [0.33, 0.59], [0.85, 0.58], [0.85, 0.42], [0.33, 0.41], [0.33, 0.2], [0.94, 0.2], [0.93, 0.05]]],
    S: [[[0.89, 0.15], [0.72, 0.04], [0.42, 0.02], [0.15, 0.1], [0.06, 0.26], [0.12, 0.4], [0.3, 0.48], [0.6, 0.54], [0.83, 0.62], [0.92, 0.75], [0.85, 0.89], [0.6, 0.98], [0.3, 0.97], [0.1, 0.86], [0.05, 0.74]]]
  };

  /* single-stroke handwriting; y: ~0.55 x-height, 1 baseline, >1 descender */
  var HAND = {
    d: { a: 0.62, s: [[[0.48, 0.08], [0.5, 0.6], [0.48, 0.98], [0.28, 1.0], [0.1, 0.88], [0.07, 0.7], [0.2, 0.57], [0.38, 0.58], [0.5, 0.72]]] },
    r: { a: 0.46, s: [[[0.1, 0.56], [0.13, 0.8], [0.12, 1.0], [0.11, 0.74], [0.2, 0.58], [0.34, 0.54], [0.42, 0.6]]] },
    a: { a: 0.58, s: [[[0.42, 0.6], [0.24, 0.55], [0.09, 0.68], [0.08, 0.88], [0.22, 1.0], [0.4, 0.92], [0.45, 0.7], [0.46, 0.92], [0.52, 1.0]]] },
    w: { a: 0.66, s: [[[0.05, 0.56], [0.17, 1.0], [0.3, 0.66], [0.43, 1.0], [0.56, 0.56]]] },
    s: { a: 0.44, s: [[[0.38, 0.6], [0.2, 0.55], [0.08, 0.66], [0.17, 0.78], [0.33, 0.84], [0.4, 0.94], [0.26, 1.02], [0.07, 0.97]]] },
    o: { a: 0.52, s: [[[0.28, 0.55], [0.1, 0.67], [0.08, 0.87], [0.24, 1.0], [0.4, 0.9], [0.43, 0.7], [0.3, 0.56]]] },
    m: { a: 0.68, s: [[[0.07, 1.0], [0.06, 0.58], [0.14, 0.53], [0.24, 0.6], [0.26, 0.78], [0.27, 1.0], [0.27, 0.68], [0.36, 0.54], [0.47, 0.58], [0.5, 0.75], [0.5, 1.0]]] },
    e: { a: 0.5, s: [[[0.08, 0.78], [0.36, 0.72], [0.36, 0.58], [0.2, 0.54], [0.07, 0.68], [0.1, 0.9], [0.27, 1.0], [0.42, 0.94]]] },
    t: { a: 0.44, s: [[[0.2, 0.18], [0.22, 0.6], [0.22, 0.9], [0.3, 1.0], [0.4, 0.95]], [[0.04, 0.52], [0.38, 0.5]]] },
    h: { a: 0.56, s: [[[0.09, 0.08], [0.08, 0.6], [0.08, 1.0], [0.09, 0.72], [0.2, 0.55], [0.34, 0.58], [0.39, 0.74], [0.4, 1.0]]] },
    i: { a: 0.24, s: [[[0.1, 0.58], [0.13, 1.0]], [[0.11, 0.36], [0.13, 0.39]]] },
    n: { a: 0.56, s: [[[0.08, 0.56], [0.09, 1.0], [0.09, 0.7], [0.2, 0.55], [0.34, 0.58], [0.39, 0.74], [0.4, 1.0]]] },
    g: { a: 0.58, s: [[[0.4, 0.6], [0.22, 0.55], [0.08, 0.68], [0.09, 0.86], [0.24, 0.96], [0.4, 0.88], [0.43, 0.6], [0.44, 1.05], [0.38, 1.28], [0.2, 1.32], [0.08, 1.2]]] },
    ' ': { a: 0.4, s: [] }
  };

  /* subdivide a polyline so replay is smooth, with light human wobble */
  function densify(pts, step, wob) {
    var out = [], i, a, b, d, n, k;
    for (i = 0; i < pts.length - 1; i++) {
      a = pts[i]; b = pts[i + 1];
      d = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
      n = Math.max(1, Math.round(d / step));
      for (k = 0; k < n; k++) {
        var t = k / n;
        out.push([
          a[0] + (b[0] - a[0]) * t + (Math.random() - 0.5) * wob,
          a[1] + (b[1] - a[1]) * t + (Math.random() - 0.5) * wob
        ]);
      }
    }
    out.push(pts[pts.length - 1].slice());
    return out;
  }

  function runDemo() {
    if (!document.body.hasAttribute('data-sk-demo')) return;
    if (reduce || !fine) return;
    if (strokes.length) return;
    try { if (sessionStorage.getItem('mv1-demo')) return; } catch (e) {}
    var mark = document.getElementById('sk-mark');
    if (!mark) return;

    /* build the play list in doc coords */
    var plan = []; /* { pts, w, pause } */
    var sy = window.scrollY || 0, sx = window.scrollX || 0;
    var mls = mark.querySelectorAll('.ml');
    var order = ['T', 'R', 'E', 'S'];

    /* pixel-true letter boxes: an empty inline-block probe sits ON the
       baseline, and TextMetrics gives each glyph's real ink extents */
    var probe = document.createElement('span');
    probe.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0';
    mls[0].appendChild(probe);
    var baseline = probe.getBoundingClientRect().top + sy;
    probe.remove();
    var mcs = getComputedStyle(mls[0].parentElement);
    ctx.save();
    ctx.font = mcs.fontWeight + ' ' + parseFloat(mcs.fontSize) + 'px ' + mcs.fontFamily;

    for (var i = 0; i < Math.min(4, mls.length); i++) {
      var box = mls[i].getBoundingClientRect();
      var glyph = CAPS[order[i]];
      if (!glyph) continue;
      var m = ctx.measureText(order[i]);
      var asc = m.actualBoundingBoxAscent || box.height * 0.72;
      var inkL = box.left + sx - (m.actualBoundingBoxLeft || 0);
      var inkW = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || box.width);
      var gy = baseline - asc;
      /* the S trace is a spine, not a perimeter — push it outward so it
         orbits the glyph edges instead of hiding under the ink */
      var grow = order[i] === 'S' ? 1.18 : 1;
      for (var s = 0; s < glyph.length; s++) {
        var pts = glyph[s].map(function (p) {
          return [
            inkL + (0.5 + (p[0] - 0.5) * grow) * inkW,
            gy + (0.5 + (p[1] - 0.5) * grow) * asc
          ];
        });
        plan.push({ pts: densify(pts, 14, 1.6), w: 2.1, pause: s === 0 ? 150 : 90 });
      }
    }
    ctx.restore();

    /* the period gets circled — a redline on the drawing set */
    var pd = mark.querySelector('.pd');
    if (pd) {
      var pb = pd.getBoundingClientRect();
      var cxp = pb.left + sx + pb.width * 0.5, cyp = baseline - pb.width * 0.42;
      var rx = Math.max(9, pb.width * 0.85), ry = Math.max(8, pb.width * 0.72), spts = [];
      for (var a2 = -0.6; a2 < Math.PI * 4.15; a2 += 0.42) {
        var wob = 1 + Math.sin(a2 * 2.3) * 0.06;
        spts.push([cxp + Math.cos(a2) * rx * wob, cyp + Math.sin(a2) * ry * wob]);
      }
      plan.push({ pts: densify(spts, 9, 1.2), w: 2.2, pause: 260 });
    }

    /* "draw something" under the spec line, canted like a margin note;
       sized to the room it actually has */
    var spec = document.querySelector('.hero .spec');
    var anchor = spec ? spec.getBoundingClientRect() : mark.getBoundingClientRect();
    var gap = 0.06;
    var phrase = 'draw something';
    var totalAdv = 0;
    for (var c = 0; c < phrase.length; c++) totalAdv += (HAND[phrase[c]] ? HAND[phrase[c]].a : 0.4) + gap;
    var H = Math.min(42, Math.max(22, (vw - 72) / totalAdv));
    var px = anchor.left + sx + anchor.width / 2 - (totalAdv * H) / 2;
    var py = anchor.bottom + sy + 46;
    var cx0 = anchor.left + sx + anchor.width / 2;
    var tilt = -0.035;
    for (var c2 = 0; c2 < phrase.length; c2++) {
      var gph = HAND[phrase[c2]];
      if (!gph) { px += 0.4 * H; continue; }
      for (var s2 = 0; s2 < gph.s.length; s2++) {
        var pts2 = gph.s[s2].map(function (p) {
          var lx = px + p[0] * H, ly = py + (p[1] - 1) * H * 0.62;
          return [lx, ly + (lx - cx0) * tilt];
        });
        plan.push({ pts: densify(pts2, 6, 1.2), w: 2.2, pause: s2 === 0 ? 110 : 70 });
      }
      px += (gph.a + gap) * H;
    }

    /* replay: ONE rAF clock drives pen travel AND the pauses between pen
       lifts — setTimeout gets clamped in throttled tabs and would stretch
       the choreography */
    demoRunning = true;
    refreshBtns();
    var pi = 0, k = 1, ds = null, pauseUntil = 0;
    var SPEED = 1.4; /* doc px per ms */
    var last = performance.now();
    function step(now) {
      if (!demoRunning) return;
      /* clamp the frame delta: a stalled tab resumes drawing at pen speed
         instead of dumping the rest of the sketch in one frame */
      var budget = Math.min(now - last, 48) * SPEED;
      last = now;
      if (now < pauseUntil) { requestAnimationFrame(step); return; }
      if (!ds) {
        if (pi >= plan.length) {
          demoRunning = false;
          try { sessionStorage.setItem('mv1-demo', '1'); } catch (e) {}
          refreshBtns();
          return;
        }
        var st0 = plan[pi];
        ds = {
          t: 0, c: st0.c || 0,
          seed: (Math.random() * 0x7fffffff) | 0, o: 0,
          p: [[Math.round(st0.pts[0][0]), Math.round(st0.pts[0][1]), st0.w]]
        };
        demo.push(ds);
        k = 1;
      }
      var st = plan[pi];
      while (budget > 0 && k < st.pts.length) {
        var p = st.pts[k], q = ds.p[ds.p.length - 1];
        var d = Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
        ds.p.push([Math.round(p[0]), Math.round(p[1]), st.w]);
        drawSeg(ctx, ds, ds.p.length - 1, -(window.scrollX || 0), -(window.scrollY || 0), 0.85);
        budget -= d;
        k++;
      }
      if (k >= st.pts.length) {
        bbox(ds);
        ds = null;
        pi++;
        pauseUntil = now + st.pause;
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(function (t0) { last = t0; step(t0); });
  }

  /* ── boot ──────────────────────────────────────────────────────────────── */

  size();
  syncBox();
  refreshBtns();
  cursorFor();

  var reveal = window.mvReveal && typeof window.mvReveal.then === 'function'
    ? window.mvReveal : Promise.resolve();
  /* the plan measures the real glyphs — Archivo must be in before we trace,
     or the strokes land where the fallback font used to be */
  var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  Promise.all([reveal, fonts]).then(function () {
    demoTimers.push(setTimeout(runDemo, 350));
  });
})();
