/* ─────────────────────────────────────────────────────────────────────────
   Theme — dark is home. (V3.2, design: docs/specs/2026-07-21-v32-design.md)

   Loaded SYNCHRONOUSLY in <head> on every themed page: sets
   html[data-theme] before first paint, owns the liquid pour (toggle, the
   reload ritual, red mode), rewrites the theme-color meta, and mounts the
   toggle button. Pages only define the var block and consume vars.

   Themes: 'dark' (default) · 'light' · 'red' (the ticker's stunt — never
   persisted). localStorage mv:theme holds only 'dark' | 'light'.

   The load ritual: a manual reload — or the session's first page — paints
   in the INVERSE theme for a beat, then the real theme pours in bottom-up:
   a quick liquid load-in. In-site navigation and back/forward skip it
   (sessionStorage mv:seen). PRM: every change is an instant swap.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var PAPER = { light: '#FAFAF7', dark: '#101010', red: '#E0301F' };
  var doc = document.documentElement;
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function stored() {
    var t = null;
    try { t = localStorage.getItem('mv:theme'); } catch (e) {}
    return t === 'light' ? 'light' : 'dark';
  }
  function apply(t) {
    doc.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', PAPER[t] || PAPER.dark);
  }
  function persist(t) {
    if (t !== 'light' && t !== 'dark') return;
    try { localStorage.setItem('mv:theme', t); } catch (e) {}
  }

  /* loads are SOLID — stored theme, painted immediately, no pour. The
     liquid belongs to the toggle and to red mode only. */
  apply(stored());

  /* ── the liquid ──────────────────────────────────────────────────────────
     Preferred path: the View Transitions API. The theme flips UNDERNEATH
     and the new page is revealed through a rising wavy clip — text never
     disappears, it inverts as the waterline passes it. The wave is ONE
     wavelength spanning the screen, traveling a full period sideways as it
     rises (~1.3s). No-VT browsers get the overlay pour at the same pace. */
  var DUR = 1300;

  /* clip-path keyframes: 25 surface points on a one-period sine; base rises
     with an eased t, phase runs a full period linearly — the crest travels
     across the screen exactly once per pour */
  function waveFrames() {
    var A = 5.5, STEPS = 12, N = 24;
    var out = '';
    for (var s = 0; s <= STEPS; s++) {
      var t = s / STEPS;
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; /* easeInOutQuad */
      var base = (100 + A) - e * (100 + 2 * A);
      var phase = t * 6.28318;
      var pts = ['0% 110%'];
      for (var i = 0; i <= N; i++) {
        var x = i / N * 100;
        var y = base + A * Math.sin(6.28318 * x / 100 + phase);
        pts.push(x.toFixed(1) + '% ' + y.toFixed(2) + '%');
      }
      pts.push('100% 110%');
      out += (t * 100).toFixed(1) + '% { clip-path: polygon(' + pts.join(',') + '); }\n';
    }
    return out;
  }

  var vtReady = false;
  function vtStyle() {
    if (vtReady) return;
    vtReady = true;
    var st = document.createElement('style');
    st.textContent =
      '::view-transition-old(root), ::view-transition-new(root) { animation: none; mix-blend-mode: normal; }\n' +
      '::view-transition-old(root) { z-index: 1; }\n' +
      '::view-transition-new(root) { z-index: 2; animation: mv-pour ' + DUR + 'ms linear both; }\n' +
      '@keyframes mv-pour {\n' + waveFrames() + '}';
    document.head.appendChild(st);
  }

  var pouring = false;
  function pour(target, done) {
    if (reduce || !document.body) { apply(target); if (done) done(); return; }
    if (pouring) { if (done) done(); return; }
    pouring = true;

    if (document.startViewTransition) {
      vtStyle();
      var vt = document.startViewTransition(function () { apply(target); });
      var fin0 = false;
      var settle = function () {
        if (fin0) return;
        fin0 = true;
        pouring = false;
        if (done) done();
      };
      vt.finished.then(settle, settle);
      setTimeout(settle, DUR + 700); /* starved animations must never latch the theme */
      return;
    }

    /* fallback pour (no View Transitions): an opaque sheet with a one-
       wavelength surface, same duration */
    var color = PAPER[target] || PAPER.dark;
    var wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147482000;pointer-events:none;overflow:hidden';
    var liq = document.createElement('div');
    liq.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:0;background:' + color +
      ';transition:height ' + DUR + 'ms cubic-bezier(0.45, 0, 0.2, 1)';
    var wave = document.createElement('div');
    wave.style.cssText = 'position:absolute;left:-100vw;right:0;top:-5.4svh;height:5.5svh;width:300vw;' +
      'background:url("data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20" preserveAspectRatio="none">' +
        '<path d="M0 20 L0 10 Q 25 0 50 10 T 100 10 L100 20 Z" fill="' + color + '"/></svg>'
      ) + '") repeat-x bottom / 100vw 100%;animation:mv-lap ' + DUR + 'ms linear both';
    var kf = document.createElement('style');
    kf.textContent = '@keyframes mv-lap { from { transform: translateX(0); } to { transform: translateX(100vw); } }';
    liq.appendChild(wave);
    wrap.appendChild(kf);
    wrap.appendChild(liq);
    document.body.appendChild(wrap);
    var fin = false;
    function finish() {
      if (fin) return;
      fin = true;
      apply(target);
      /* timers, not rAF: rAF starves in hidden tabs and would latch
         `pouring`, eating the next toggle */
      setTimeout(function () {
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        pouring = false;
        if (done) done();
      }, 40);
    }
    liq.addEventListener('transitionend', finish);
    setTimeout(finish, DUR + 400);
    function commit() { liq.style.height = 'calc(100% + 5.4svh)'; }
    requestAnimationFrame(function () { requestAnimationFrame(commit); });
    setTimeout(commit, 80);
  }

  var api = {
    current: function () { return doc.getAttribute('data-theme') || 'dark'; },
    liquidTo: function (t) { return new Promise(function (res) { pour(t, res); }); },
    toggle: function () {
      /* from red, the toggle rescues you back to your stored theme */
      var cur = api.current();
      var t = cur === 'red' ? stored() : (cur === 'dark' ? 'light' : 'dark');
      persist(t);
      return api.liquidTo(t);
    },
    /* red STAYS — it was never persisted, so any refresh or navigation
       comes back in the stored theme. The toggle is the other way out. */
    redMode: function () { return api.liquidTo('red'); },
  };
  window.MVTHEME = api;

  /* ── the toggle — a half-filled dot, fixed top-right, 44px target ────── */
  function mount() {
    if (document.getElementById('mv-thm') || !document.body) return;
    var b = document.createElement('button');
    b.id = 'mv-thm';
    b.type = 'button';
    b.setAttribute('aria-label', 'Switch between light and dark');
    b.style.cssText = 'position:fixed;top:calc(8px + env(safe-area-inset-top,0px));right:calc(12px + env(safe-area-inset-right,0px));' +
      'z-index:90;width:44px;height:44px;display:grid;place-items:center;background:none;border:none;padding:0;cursor:pointer';
    var dot = document.createElement('span');
    dot.style.cssText = 'width:15px;height:15px;border-radius:50%;box-sizing:border-box;' +
      'border:1.5px solid var(--ink, currentColor);' +
      'background:linear-gradient(90deg, var(--ink, currentColor) 50%, transparent 50%);' +
      'transition:transform 320ms cubic-bezier(0.22, 1, 0.36, 1)';
    if (api.current() === 'light') dot.style.transform = 'rotate(180deg)';
    b.appendChild(dot);
    b.addEventListener('click', function () {
      dot.style.transform = api.current() === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)';
      api.toggle();
    });
    document.body.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
