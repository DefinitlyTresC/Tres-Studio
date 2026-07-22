/* ─────────────────────────────────────────────────────────────────────────
   Glass loop — pins the .glass texture to the VIEWPORT by counter-offsetting
   each glyph's background-position every frame. The glyphs live inside
   zero-g-transformed bodies, where background-attachment:fixed silently
   degrades to local (a transformed ancestor is a containing block) — so we
   measure and offset instead, which behaves identically everywhere,
   including iOS.

   Cost: a handful of getBoundingClientRect calls per frame, only while the
   page is visible. Under reduced motion the engine never moves anything, so
   one pass at load + on scroll/resize keeps the parked letters honest.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var els = document.querySelectorAll('.glass');
  if (!els.length) return;

  function setAll() {
    for (var i = 0; i < els.length; i++) {
      var r = els[i].getBoundingClientRect();
      /* both layers share the offset: hatch phase + gradient anchor */
      els[i].style.backgroundPosition = (-r.left).toFixed(1) + 'px ' + (-r.top).toFixed(1) + 'px';
    }
  }

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
