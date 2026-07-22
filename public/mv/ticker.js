/* ─────────────────────────────────────────────────────────────────────────
   The ticker, third edition — minimalist. "0342 visits" in quiet mono,
   mounted inline in #mv-ticker-slot. No cards, no seams.

   Clicking it is a different matter. Each true click plays one event from
   a pool (never the same one twice running): confetti · space-out-and-
   snap-back · scramble-to-"hi" · "please stop" · digit slot-spin · a full
   flip. The tenth click calls MVTHEME.redMode() — red pours up the page,
   holds two seconds, fades home — and the count of sins resets.

   Counting rules unchanged from edition two: /.netlify/functions/pulse,
   one session id per tab, excluded browsers (localStorage ts_off, set on
   /me) and webdriver clients send x=1 — they see the number, they are not
   in it. Reduced motion: a plain <span>, no events, no theatrics.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var slot = document.getElementById('mv-ticker-slot');
  if (!slot) return;

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var sid;
  try {
    sid = sessionStorage.getItem('ts_sid');
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('ts_sid', sid);
    }
  } catch (e) { sid = String(Math.random()).slice(2); }

  var OFF = false;
  try { OFF = localStorage.getItem('ts_off') === '1'; } catch (e) {}
  if (navigator.webdriver) OFF = true;

  var el = document.createElement(reduce ? 'span' : 'button');
  if (!reduce) {
    el.type = 'button';
    el.style.cursor = 'pointer';
  }
  el.id = 'mv-tkr';
  el.style.cssText += ';font:10px/1 "Space Mono", ui-monospace, monospace;letter-spacing:0.14em;' +
    'text-transform:uppercase;color:var(--faint, rgba(16,16,16,0.45));background:none;border:none;' +
    'padding:12px;margin:-12px;opacity:0;transition:opacity 300ms ease;white-space:nowrap;display:inline-block';
  slot.appendChild(el);

  var real = 0;
  function pad(n) { var s = String(Math.max(0, Math.floor(n))); return s.length < 4 ? ('0000' + s).slice(-4) : s; }
  function labelFor(n) { return pad(n) + ' visits'; }
  /* per-char spans so events can move letters; AT reads one clean label */
  function render(text) {
    el.setAttribute('aria-label', labelFor(real) + (reduce ? '' : ' — click me'));
    while (el.firstChild) el.removeChild(el.firstChild);
    var box = document.createElement('span');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = 'display:inline-block';
    for (var i = 0; i < text.length; i++) {
      var c = document.createElement('span');
      c.textContent = text[i];
      c.style.cssText = 'display:inline-block;white-space:pre;transition:margin 340ms cubic-bezier(0.34,1.56,0.64,1)';
      box.appendChild(c);
    }
    el.appendChild(box);
  }
  function chars() { return el.firstChild ? el.firstChild.childNodes : []; }

  var revealed = false;
  function reveal(n) {
    real = n;
    render(labelFor(n));
    if (!revealed) { revealed = true; el.style.opacity = '1'; }
  }

  var stallT = setTimeout(function () {
    if (revealed) return;
    var cached = 0;
    try { cached = parseInt(localStorage.getItem('ts_v3_ticker') || '0', 10) || 0; } catch (e) {}
    if (cached > 0) reveal(cached);
  }, 3500);
  fetch('/.netlify/functions/pulse?sid=' + encodeURIComponent(sid) + (OFF ? '&x=1' : ''), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || typeof data.total !== 'number') return;
      clearTimeout(stallT);
      try { localStorage.setItem('ts_v3_ticker', String(data.total)); } catch (e) {}
      reveal(data.total);
    })
    .catch(function () { /* an unreachable counter is not a page error */ });

  if (reduce) return;

  /* ── the events ──────────────────────────────────────────────────────── */
  var busy = false, clicks = 0, lastEv = -1;
  var GLYPHS = '#%@*+=?!0123456789';

  function inkOf() {
    var v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(); } catch (e) {}
    return v || '#101010';
  }

  function evConfetti(done) {
    var cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;z-index:95;pointer-events:none';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    var ctx = cv.getContext('2d');
    if (!ctx) { cv.remove(); done(); return; }
    var r = el.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top;
    var colors = [inkOf(), '#FF4D00', '#2431FF', '#00934D', '#F0A400'];
    var bits = [];
    for (var i = 0; i < 56; i++) {
      bits.push({ x: ox + (Math.random() - 0.5) * 20, y: oy, vx: (Math.random() - 0.5) * 6.4,
        vy: -(3.2 + Math.random() * 4.6), w: 3 + Math.random() * 4, h: 5 + Math.random() * 4,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, age: 0,
        life: 1000 + Math.random() * 480, c: colors[i % colors.length] });
    }
    var lastF = 0;
    function fall(now) {
      var dt = lastF ? Math.min(50, now - lastF) : 16.7;
      lastF = now;
      var k = dt / 16.7;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var j = bits.length - 1; j >= 0; j--) {
        var b = bits[j];
        b.age += dt;
        if (b.age > b.life) { bits.splice(j, 1); continue; }
        b.vy += 0.22 * k; b.x += b.vx * k; b.y += b.vy * k; b.rot += b.vr * k;
        ctx.save();
        ctx.translate(b.x * dpr, b.y * dpr);
        ctx.rotate(b.rot);
        ctx.globalAlpha = b.age > b.life * 0.7 ? 1 - (b.age - b.life * 0.7) / (b.life * 0.3) : 1;
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.w / 2 * dpr, -b.h / 2 * dpr, b.w * dpr, b.h * dpr);
        ctx.restore();
      }
      if (bits.length) requestAnimationFrame(fall);
      else { cv.remove(); done(); }
    }
    requestAnimationFrame(fall);
  }

  function evSpace(done) {
    var cs = chars(), i;
    for (i = 0; i < cs.length; i++) cs[i].style.margin = '0 5px';
    setTimeout(function () {
      var cs2 = chars();
      for (var j = 0; j < cs2.length; j++) cs2[j].style.margin = '0';
      setTimeout(done, 420);
    }, 380);
  }

  function scrambleTo(text, ms, after) {
    var steps = Math.max(4, Math.round(ms / 55));
    var n = 0;
    (function step() {
      n++;
      if (n >= steps) { render(text); if (after) after(); return; }
      var out = '';
      for (var i = 0; i < text.length; i++) {
        out += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      render(out);
      setTimeout(step, 55);
    })();
  }

  function evHi(done) {
    scrambleTo('hi', 380, function () {
      setTimeout(function () { scrambleTo(labelFor(real), 380, done); }, 900);
    });
  }

  function evStop(done) {
    scrambleTo('please stop', 300, function () {
      setTimeout(function () { scrambleTo(labelFor(real), 300, done); }, 1200);
    });
  }

  function evSpin(done) {
    var label = labelFor(real);
    var t = 0;
    (function step() {
      t++;
      if (t > 11) { render(label); done(); return; }
      var out = '';
      for (var i = 0; i < label.length; i++) {
        out += /\d/.test(label[i]) ? String((Math.random() * 10) | 0) : label[i];
      }
      render(out);
      setTimeout(step, 60);
    })();
  }

  function evFlip(done) {
    el.style.transition = 'transform 620ms cubic-bezier(0.34, 1.3, 0.5, 1), opacity 300ms ease';
    el.style.transform = 'rotate(360deg)';
    setTimeout(function () {
      el.style.transition = 'opacity 300ms ease';
      el.style.transform = 'none';
      done();
    }, 660);
  }

  var POOL = [evConfetti, evSpace, evHi, evStop, evSpin, evFlip];

  el.addEventListener('click', function () {
    if (busy) return;
    clicks++;
    if (clicks >= 10 && window.MVTHEME && window.MVTHEME.redMode) {
      clicks = 0;
      busy = true;
      window.MVTHEME.redMode().then(function () { busy = false; });
      return;
    }
    var i;
    do { i = (Math.random() * POOL.length) | 0; } while (i === lastEv);
    lastEv = i;
    busy = true;
    POOL[i](function () { busy = false; });
  });
})();
