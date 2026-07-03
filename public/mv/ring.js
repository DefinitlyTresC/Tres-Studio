/* ─────────────────────────────────────────────────────────────────────────
   The map — a plain row of dots, one per universe. Redesigned 2026-07-02
   per Tres: "just a row of dots, one highlighted, all black and white, each
   w a title in simple text beneath it. gets bigger when hover. super simple."

   Monochrome in the current site's ink; the current universe is the filled
   dot. Click any other dot -> ink-blot curtain -> that universe. Mounts
   into the info footer (#mv-info), anchored right.

   Also owns the LAB TAKEOVER: any link to /lab on the page gets intercepted
   and covered by the curtain before navigating — the lab is one shared
   place; entering it should feel like the screen being swallowed.

   Boot: window.MV = { current, sites:[...] } + #mv-info present.
   ──────────────────────────────────────────────────────────────────────── */
import { cover } from '/mv/curtain.js';

(function () {
  'use strict';
  const MV = window.MV;
  if (!MV || !MV.sites || !MV.sites.length) return;

  let reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  const cur = MV.sites.find((s) => s.id === MV.current) || MV.sites[0];
  const INK = cur.ink || '#111';

  /* one cover at a time — dots and lab links share the guard */
  let leaving = false;
  addEventListener('pageshow', (e) => {
    if (e.persisted) leaving = false; /* bfcache Back restores the latched heap */
  });

  /* ── the dot row ───────────────────────────────────────────────────────── */
  const info = document.getElementById('mv-info');
  if (info) {
    if (!info.style.position) info.style.position = 'relative';
    const row = document.createElement('nav');
    row.id = 'mv-map';
    row.setAttribute('aria-label', 'Universes');
    row.style.cssText =
      'position:absolute;right:max(24px,4vw);top:50%;transform:translateY(-50%);' +
      'display:flex;gap:clamp(14px,2vw,26px);z-index:6';

    MV.sites.forEach((s) => {
      const isCur = s.id === MV.current;
      const b = document.createElement(isCur ? 'span' : 'a');
      if (!isCur) b.href = '/' + s.id + '/';
      b.style.cssText =
        'display:flex;flex-direction:column;align-items:center;gap:8px;' +
        'min-width:34px;padding:6px 2px;text-decoration:none;cursor:' + (isCur ? 'default' : 'pointer') + ';' +
        'transition:transform 180ms cubic-bezier(0.23,1,0.32,1)';
      const dot = document.createElement('span');
      dot.style.cssText =
        'width:13px;height:13px;border-radius:50%;box-sizing:border-box;' +
        (isCur ? 'background:' + INK : 'border:1.5px solid ' + INK) + ';' +
        'transition:transform 180ms cubic-bezier(0.23,1,0.32,1)';
      const t = document.createElement('span');
      t.textContent = String(s.id).padStart(2, '0');
      t.style.cssText =
        'font:10px/1 "Space Mono",ui-monospace,monospace;letter-spacing:0.12em;' +
        'color:' + INK + ';opacity:' + (isCur ? '1' : '0.55');
      b.appendChild(dot); b.appendChild(t);

      if (!isCur) {
        try {
          if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
            b.addEventListener('pointerenter', () => { dot.style.transform = 'scale(1.45)'; t.style.opacity = '1'; });
            b.addEventListener('pointerleave', () => { dot.style.transform = ''; t.style.opacity = '0.55'; });
          }
        } catch (e) {}
        b.addEventListener('click', async (e) => {
          if (reduce) return; /* plain navigation */
          if (leaving) { e.preventDefault(); return; }
          leaving = true;
          e.preventDefault();
          await cover({ x: e.clientX, y: e.clientY, color: s.ink });
          location.href = b.href;
        });
      }
      row.appendChild(b);
    });
    info.appendChild(row);
  }

  /* ── lab takeover: every /lab link goes through the ink ─────────────────── */
  document.querySelectorAll('a[href="/lab"], a[href^="/lab#"]').forEach((a) => {
    a.addEventListener('click', async (e) => {
      if (reduce || leaving) return;
      leaving = true;
      e.preventDefault();
      await cover({ x: e.clientX, y: e.clientY, color: '#0A0806' });
      location.href = a.getAttribute('href');
    });
  });
})();
