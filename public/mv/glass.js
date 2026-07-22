/* ─────────────────────────────────────────────────────────────────────────
   Glass loop — three jobs, one module:

   1. Pins the .glass dot grid to the VIEWPORT by counter-offsetting each
      glyph's background-position every frame (background-attachment:fixed
      silently degrades inside zero-g's transformed bodies and on iOS).
   2. Feeds each glyph's live color through the glass: copies the PARENT's
      computed color into background-color (background-clip:text clips it),
      so the engine's palette cycle + scroll reshuffle read exactly as they
      always did — through dotted glass.
   3. "Invert classic" on theme change: every palette-colored letter's
      inline color flips to its RGB complement (blue goes orange-family).
      Flipping the theme back flips the colors back. Watches data-theme.

   Under reduced motion the engine never moves anything: one pass at load
   plus scroll/resize keeps the parked letters honest.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var els = document.querySelectorAll('.glass');
  if (!els.length) return;
  /* mirror the CSS @supports gate: without background-clip:text the
     background paints as a solid slab behind same-colored text */
  try {
    if (!(CSS.supports('-webkit-background-clip', 'text') || CSS.supports('background-clip', 'text'))) return;
  } catch (e) { return; }

  function setAll() {
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var r = el.getBoundingClientRect();
      el.style.backgroundPosition = (-r.left).toFixed(1) + 'px ' + (-r.top).toFixed(1) + 'px';
      /* the parent holds the real color (palette inline, or theme ink) —
         the glass itself is transparent by design */
      var p = el.parentElement;
      if (p) {
        var c = getComputedStyle(p).color;
        if (el.__gc !== c) { el.__gc = c; el.style.backgroundColor = c; }
      }
    }
  }

  /* invert classic — 255 minus each channel, on the letters that hold an
     inline palette color; plain-ink letters retheme via vars on their own */
  function invertPalette() {
    var colored = document.querySelectorAll('[data-zg-color]');
    for (var i = 0; i < colored.length; i++) {
      var p = colored[i];
      var ic = p.style.color;
      if (!ic) continue;
      var m = /^#([0-9a-f]{6})$/i.exec(ic.trim());
      var r, g, b;
      if (m) {
        r = parseInt(m[1].slice(0, 2), 16); g = parseInt(m[1].slice(2, 4), 16); b = parseInt(m[1].slice(4, 6), 16);
      } else {
        var mm = /rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(ic);
        if (!mm) continue;
        r = +mm[1]; g = +mm[2]; b = +mm[3];
      }
      p.style.color = 'rgb(' + (255 - r) + ',' + (255 - g) + ',' + (255 - b) + ')';
    }
    setAll();
  }
  /* invert only on a REAL value change — same-value attribute writes still
     queue observer records, and a spurious invert breaks palette parity */
  var lastTheme = document.documentElement.getAttribute('data-theme');
  try {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].attributeName !== 'data-theme') continue;
        var now = document.documentElement.getAttribute('data-theme');
        if (now === lastTheme) return;
        lastTheme = now;
        invertPalette();
        return;
      }
    }).observe(document.documentElement, { attributes: true });
  } catch (e) {}
  /* web-font swap reshapes the glyph boxes — re-pin the texture when the
     real faces land (harmless if already aligned) */
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setAll(); }); } catch (e) {}

  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (reduce) {
    setAll();
    addEventListener('scroll', setAll, { passive: true });
    addEventListener('resize', setAll, { passive: true });
    return;
  }

  var raf = null;
  function loop() {
    raf = null;
    setAll();
    if (!document.hidden) raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !document.hidden) raf = requestAnimationFrame(loop); }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    else start();
  });
  setAll();
  start();
})();
