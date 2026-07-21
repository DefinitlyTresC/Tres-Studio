/* ─────────────────────────────────────────────────────────────────────────
   The lab takeover — every link to /lab gets intercepted and covered by the
   ink-blot curtain before navigating: entering the lab should feel like the
   screen being swallowed. (Kept from the multiverse era's ring.js, which
   also owned the universe dot map — retired in the V3.0 collapse.)

   Boot: import on any page that links to /lab, after curtain.js is loadable.
   ──────────────────────────────────────────────────────────────────────── */
import { cover } from '/mv/curtain.js';

(function () {
  'use strict';
  let reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* one cover at a time */
  let leaving = false;
  addEventListener('pageshow', (e) => {
    if (e.persisted) leaving = false; /* bfcache Back restores the latched heap */
  });

  document.querySelectorAll('a[href="/lab"], a[href^="/lab#"]').forEach((a) => {
    a.addEventListener('click', async (e) => {
      /* modified/aux clicks keep their native meaning (new tab etc.) */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      if (reduce) return; /* plain navigation */
      if (leaving) { e.preventDefault(); return; }
      leaving = true;
      e.preventDefault();
      /* keyboard activation clicks at (0,0) — flood from the link instead */
      const kb = !e.clientX && !e.clientY;
      const ra = kb ? a.getBoundingClientRect() : null;
      await cover({ x: kb ? ra.left + ra.width / 2 : e.clientX, y: kb ? ra.top + ra.height / 2 : e.clientY, color: '#0A0806' });
      location.href = a.getAttribute('href');
    });
  });
})();
