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

  var real = stored();

  /* the ritual decision — reload, or the session's first page */
  var ritual = false;
  if (!reduce) {
    var nav = 'navigate';
    try {
      var en = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      nav = en ? en.type : (performance.navigation && performance.navigation.type === 1 ? 'reload' : 'navigate');
    } catch (e) {}
    var seen = false;
    try { seen = sessionStorage.getItem('mv:seen') === '1'; } catch (e) {}
    ritual = nav === 'reload' || (!seen && nav !== 'back_forward');
    try { sessionStorage.setItem('mv:seen', '1'); } catch (e) {}
  }
  apply(ritual ? (real === 'dark' ? 'light' : 'dark') : real);

  /* ── the liquid ──────────────────────────────────────────────────────── */
  var pouring = false;
  function pour(target, done) {
    if (reduce || !document.body) { apply(target); if (done) done(); return; }
    if (pouring) { if (done) done(); return; }
    pouring = true;
    var color = PAPER[target] || PAPER.dark;
    var wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:2147482000;pointer-events:none;overflow:hidden';
    var liq = document.createElement('div');
    liq.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:0;background:' + color +
      ';transition:height 620ms cubic-bezier(0.34, 1.14, 0.42, 1)'; /* slight overshoot = the jello */
    /* the surface: a low two-crest wave lapping sideways as the body rises */
    var wave = document.createElement('div');
    wave.style.cssText = 'position:absolute;left:-120px;right:-120px;top:-22px;height:23px;' +
      'background:url("data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 23" preserveAspectRatio="none">' +
        '<path d="M0 23 L0 12 Q 15 1 30 12 T 60 12 T 90 12 T 120 12 L120 23 Z" fill="' + color + '"/></svg>'
      ) + '") repeat-x bottom / 120px 23px;animation:mv-lap 1.05s linear infinite';
    var kf = document.createElement('style');
    kf.textContent = '@keyframes mv-lap { from { transform: translateX(0); } to { transform: translateX(120px); } }';
    liq.appendChild(wave);
    wrap.appendChild(kf);
    wrap.appendChild(liq);
    document.body.appendChild(wrap);
    var fin = false;
    function finish() {
      if (fin) return;
      fin = true;
      apply(target);
      /* the risen liquid IS the new paper — drop it a beat later, no seam.
         Timers, not rAF: rAF starves in hidden tabs and would latch
         `pouring` forever, eating the next toggle. */
      setTimeout(function () {
        if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
        pouring = false;
        if (done) done();
      }, 40);
    }
    liq.addEventListener('transitionend', finish);
    setTimeout(finish, 950); /* a starved transition must never hang a theme */
    function commit() { liq.style.height = 'calc(100% + 22px)'; }
    requestAnimationFrame(function () { requestAnimationFrame(commit); });
    setTimeout(commit, 80); /* hidden-tab guard — setting height twice is harmless */
  }

  var api = {
    current: function () { return doc.getAttribute('data-theme') || 'dark'; },
    liquidTo: function (t) { return new Promise(function (res) { pour(t, res); }); },
    toggle: function () {
      var t = api.current() === 'dark' ? 'light' : 'dark';
      persist(t);
      return api.liquidTo(t);
    },
    redMode: function () {
      var back = stored();
      return api.liquidTo('red').then(function () {
        return new Promise(function (res) { setTimeout(res, 2000); });
      }).then(function () {
        if (reduce) { apply(back); return; }
        /* vars can't transition; the painted properties can — briefly */
        var st = document.createElement('style');
        st.textContent = 'html.mv-fade, html.mv-fade body, html.mv-fade *, html.mv-fade *::before, html.mv-fade *::after' +
          '{ transition: background-color 560ms ease, color 560ms ease, border-color 560ms ease, fill 560ms ease, stroke 560ms ease !important }';
        document.head.appendChild(st);
        doc.classList.add('mv-fade');
        apply(back);
        setTimeout(function () {
          doc.classList.remove('mv-fade');
          if (st.parentNode) st.parentNode.removeChild(st);
        }, 640);
      });
    },
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

  /* the load ritual: pour the real theme over the inverse start */
  if (ritual) {
    var go = function () { setTimeout(function () { pour(real); }, 50); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }
})();
