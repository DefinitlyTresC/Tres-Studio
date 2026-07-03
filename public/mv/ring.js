/* ─────────────────────────────────────────────────────────────────────────
   The dot-cluster map — the multiverse switcher.

   A packed disc of dots (reference: Tres's circle-of-dots image — large dots
   inside, small dots crowding the rim), anchored to the right edge of the
   info footer, cut in half by the screen. The layout is seeded, so the map
   is IDENTICAL on every site and every load — only the coloring adapts to
   the site's brand. Slow constant spin; jello on pointer/touch.

   The N site dots are the large, colored, clickable ones; fillers complete
   the form. Desktop: click a site dot -> ink-blot curtain -> that site.
   Mobile: first tap grows the cluster and blurs the page, then pick.

   Boot: window.MV = { current, sites:[...] } + an element #mv-info.
   ──────────────────────────────────────────────────────────────────────── */
import { cover } from '/mv/curtain.js';

(function () {
  'use strict';
  const MV = window.MV;
  const info = document.getElementById('mv-info');
  if (!MV || !MV.sites || !MV.sites.length || !info) return;

  let reduce = false, fine = false;
  try {
    reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) {}

  const dpr = Math.min(2, devicePixelRatio || 1);
  const N = MV.sites.length;
  const cur = MV.sites.find((s) => s.id === MV.current) || MV.sites[0];
  const INK = cur.ink || '#111';

  /* ── seeded layout: identical map everywhere ───────────────────────────
     Unit-space disc (radius 1). Site dots first (large, golden-angle spread
     around mid-radius), then rejection-packed fillers — bigger toward the
     center, small and dense at the rim, like the reference. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = mulberry32(20260702);
  const dots = [];
  function overlaps(x, y, r) {
    for (const d of dots) {
      if (Math.hypot(d.x - x, d.y - y) < d.r + r + 0.02) return true;
    }
    return false;
  }
  for (let i = 0; i < N; i++) {           /* site dots */
    const size = 0.15 + rnd() * 0.045;
    for (let tries = 0; tries < 200; tries++) {
      const ang = i * 2.39996 + rnd() * 0.8;
      const dist = 0.12 + rnd() * 0.5;
      const x = Math.cos(ang) * dist, y = Math.sin(ang) * dist;
      if (Math.hypot(x, y) + size < 0.9 && !overlaps(x, y, size)) {
        dots.push({ x, y, r: size, site: MV.sites[i], dx: 0, dy: 0, vx: 0, vy: 0 });
        break;
      }
    }
  }
  for (let tries = 0; tries < 2600 && dots.length < 120; tries++) {  /* fillers */
    const t = Math.sqrt(rnd());
    const ang = rnd() * 6.2832;
    const x = Math.cos(ang) * t, y = Math.sin(ang) * t;
    const band = Math.hypot(x, y);
    const r = band > 0.72
      ? 0.012 + rnd() * 0.035                       /* rim: small, dense */
      : 0.03 + rnd() * (0.115 - band * 0.08);       /* center: larger */
    if (band + r > 0.99 || overlaps(x, y, r)) continue;
    dots.push({ x, y, r, site: null, dx: 0, dy: 0, vx: 0, vy: 0 });
  }

  /* ── canvas anchored to the footer's right edge, half cut off ─────────── */
  info.style.position = info.style.position || 'relative';
  const cv = document.createElement('canvas');
  cv.id = 'mv-ring';
  cv.setAttribute('role', 'navigation');
  cv.setAttribute('aria-label', 'Site map — pick a universe');
  cv.style.cssText = 'position:absolute;right:0;top:50%;transform:translate(50%,-50%);z-index:6;touch-action:manipulation';
  info.appendChild(cv);

  const blur = document.createElement('div');
  blur.style.cssText = 'position:fixed;inset:0;z-index:5;opacity:0;pointer-events:none;' +
    'backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px);transition:opacity 400ms ease,backdrop-filter 400ms ease,-webkit-backdrop-filter 400ms ease';
  document.body.appendChild(blur);

  let expanded = false, R = 0, SIZE = 0, C = 0;
  function layout() {
    const vmin = Math.min(innerWidth, innerHeight);
    R = expanded ? Math.min(vmin * 0.4, 320) : Math.min(vmin * 0.26, 230);
    SIZE = R * 2.2;
    cv.width = SIZE * dpr; cv.height = SIZE * dpr;
    cv.style.width = SIZE + 'px'; cv.style.height = SIZE + 'px';
    C = SIZE / 2;
  }
  layout();
  addEventListener('resize', layout, { passive: true });

  const ctx = cv.getContext('2d');
  let spin = 0, px = -1e4, py = -1e4, raf = null, running = true, over = false;

  function frame() {
    if (!running) { raf = null; return; }
    spin += reduce ? 0 : 0.0016;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const cs = Math.cos(spin), sn = Math.sin(spin);
    over = false;
    for (const d of dots) {
      const rx = C + (d.x * cs - d.y * sn) * R;
      const ry = C + (d.x * sn + d.y * cs) * R;
      if (!reduce) {
        const ddx = rx + d.dx - px, ddy = ry + d.dy - py;
        const dist = Math.hypot(ddx, ddy);
        if (dist < 60) {
          const f = ((60 - dist) / 60) * 2.2;
          d.vx += (ddx / (dist || 1)) * f; d.vy += (ddy / (dist || 1)) * f;
        }
        d.vx += -d.dx * 0.06; d.vy += -d.dy * 0.06;
        d.vx *= 0.86; d.vy *= 0.86;
        d.dx += d.vx; d.dy += d.vy;
      }
      const x = rx + d.dx, y = ry + d.dy;
      d._x = x; d._y = y;
      const pr = d.r * R;
      ctx.beginPath();
      if (d.site) {
        const hover = Math.hypot(x - px, y - py) < pr + 10;
        if (hover) over = true;
        ctx.arc(x * dpr, y * dpr, pr * (hover ? 1.12 : 1) * dpr, 0, 6.2832);
        if (d.site.id === MV.current) {
          ctx.lineWidth = 2.5 * dpr;
          ctx.strokeStyle = d.site.swatch;
          ctx.stroke();
        } else {
          ctx.fillStyle = d.site.swatch;
          ctx.fill();
        }
      } else {
        ctx.arc(x * dpr, y * dpr, pr * dpr, 0, 6.2832);
        ctx.fillStyle = INK;
        ctx.fill();
      }
    }
    cv.style.cursor = over ? 'pointer' : 'default';
    raf = requestAnimationFrame(frame);
  }

  function hit(cx, cy) {
    const rect = cv.getBoundingClientRect();
    const x = cx - rect.left, y = cy - rect.top;
    for (const d of dots) {
      if (d.site && Math.hypot((d._x ?? -1e4) - x, (d._y ?? -1e4) - y) < d.r * R + 12) return d;
    }
    return null;
  }

  cv.addEventListener('pointermove', (e) => {
    const rect = cv.getBoundingClientRect();
    px = e.clientX - rect.left; py = e.clientY - rect.top;
  }, { passive: true });
  cv.addEventListener('pointerleave', () => { px = py = -1e4; }, { passive: true });

  function collapse() {
    expanded = false; layout();
    blur.style.opacity = '0';
    blur.style.backdropFilter = blur.style.webkitBackdropFilter = 'blur(0px)';
    blur.style.pointerEvents = 'none';
    cv.style.zIndex = '6';
  }
  async function go(d, e) {
    if (d.site.id === MV.current) { collapse(); return; }
    await cover({ x: e.clientX, y: e.clientY, color: d.site.ink });
    location.href = '/' + d.site.id + '/';
  }
  cv.addEventListener('click', (e) => {
    const d = hit(e.clientX, e.clientY);
    if (fine) { if (d) go(d, e); return; }
    if (!expanded) {
      expanded = true; layout();
      cv.style.zIndex = '8';
      blur.style.opacity = '1';
      blur.style.backdropFilter = blur.style.webkitBackdropFilter = 'blur(9px)';
      blur.style.pointerEvents = 'auto';
      return;
    }
    if (d) go(d, e); else collapse();
  });
  blur.addEventListener('click', collapse);

  /* paint only while the footer is on screen (default running — safe if the
     observer never fires) */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ens) => {
      ens.forEach((en) => {
        running = en.isIntersecting || expanded;
        if (running && !raf) raf = requestAnimationFrame(frame);
      });
    }, { rootMargin: '10% 0px' });
    io.observe(cv);
  }
  raf = requestAnimationFrame(frame);
})();
