/* ─────────────────────────────────────────────────────────────────────────
   The lab takeover — every link to /lab gets intercepted and covered by the
   ink-blot curtain before navigating: entering the lab should feel like the
   screen being swallowed. (Kept from the multiverse era's ring.js, which
   also owned the universe dot map — retired in the V3.0 collapse.)

   Listens at the DOCUMENT level on purpose: zero-g's own element-level
   click listener must run first so a drag-release (suppressed click,
   preventDefault'd by the engine) never triggers the takeover.

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

  document.addEventListener('click', async (e) => {
    const a = e.target && e.target.closest && e.target.closest('a[href="/lab"], a[href^="/lab#"]');
    if (!a) return;
    if (e.defaultPrevented) return; /* zero-g suppressed a drag's trailing click */
    /* modified/aux clicks keep their native meaning (new tab etc.) */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
    if (reduce) return; /* plain navigation */
    if (leaving) { e.preventDefault(); return; }
    leaving = true;
    e.preventDefault();
    /* keyboard activation clicks at (0,0) — flood from the link instead */
    const kb = !e.clientX && !e.clientY;
    const ra = kb ? a.getBoundingClientRect() : null;
    /* the ink follows the theme — a dusk-black flood is invisible on dark paper */
    let ink = '#0A0806';
    try { const v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(); if (v) ink = v; } catch (err) {}
    await cover({ x: kb ? ra.left + ra.width / 2 : e.clientX, y: kb ? ra.top + ra.height / 2 : e.clientY, color: ink });
    location.href = a.getAttribute('href');
  });
})();
