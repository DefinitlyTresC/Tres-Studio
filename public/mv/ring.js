/* ─────────────────────────────────────────────────────────────────────────
   The dot-ring — the map of the multiverse. One dot per site.

   A ring of dots (sizes varied, reference: Tres's circle-of-dots image),
   cut in half by the screen edge at the info area. Slow constant spin,
   jello reaction to pointer/touch. Desktop: click a dot -> curtain -> that
   site. Mobile: first tap grows the ring and blurs the page; then pick.
   Identical on every site — this and the ticker are the multiverse's two
   constants.

   Boot: window.MV = { current, sites:[{id,name,paper,ink,swatch}] } must
   exist (injected by each site's shell), then ring.js mounts itself against
   the element #mv-info (reveals when it scrolls into view).
   ──────────────────────────────────────────────────────────────────────── */
import { cover } from '/mv/curtain.js';

(function () {
  'use strict';
  const MV = window.MV;
  if (!MV || !MV.sites || !MV.sites.length) return;

  let reduce = false, fine = false;
  try {
    reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch (e) {}

  const dpr = Math.min(2, devicePixelRatio || 1);
  const N = MV.sites.length;

  /* geometry: ring center sits ON the right screen edge (half cut off) */
  let R = 0, CX = 0, CY = 0, SIZE = 0;
  const cv = document.createElement('canvas');
  cv.id = 'mv-ring';
  cv.style.cssText = 'position:fixed;right:0;top:50%;transform:translate(50%,-50%);z-index:60;' +
    'opacity:0;transition:opacity 500ms cubic-bezier(.23,1,.32,1);touch-action:manipulation';
  document.body.appendChild(cv);

  const blur = document.createElement('div');
  blur.style.cssText = 'position:fixed;inset:0;z-index:55;backdrop-filter:blur(0px);-webkit-backdrop-filter:blur(0px);' +
    'background:transparent;opacity:0;pointer-events:none;transition:opacity 400ms ease,backdrop-filter 400ms ease,-webkit-backdrop-filter 400ms ease';
  document.body.appendChild(blur);

  let expanded = false;   /* mobile expanded state */
  function layout() {
    const vmin = Math.min(innerWidth, innerHeight);
    R = expanded ? vmin * 0.34 : vmin * 0.22;
    SIZE = R * 2.7;
    cv.width = SIZE * dpr; cv.height = SIZE * dpr;
    cv.style.width = SIZE + 'px'; cv.style.height = SIZE + 'px';
    CX = SIZE / 2; CY = SIZE / 2;
  }
  layout();
  addEventListener('resize', layout, { passive: true });

  /* dots: varied sizes like the reference; current site's dot is hollow */
  const seeds = [1, .62, .8, .5, .9, .56, .72, .46, .84, .66];
  const dots = MV.sites.map((s, i) => ({
    site: s,
    a: (i / N) * Math.PI * 2,
    r0: (7 + seeds[i % seeds.length] * 9),      /* rest radius, px */
    dx: 0, dy: 0, vx: 0, vy: 0,                 /* jello displacement */
  }));

  const ctx = cv.getContext('2d');
  let spin = 0, px = -1e4, py = -1e4, raf = null, shown = false, over = false;

  function frame(now) {
    if (!shown) { raf = null; return; }
    spin += reduce ? 0 : 0.0022;                 /* slow constant spin */
    ctx.clearRect(0, 0, cv.width, cv.height);
    over = false;
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const ang = d.a + spin;
      const rx = CX + Math.cos(ang) * R;
      const ry = CY + Math.sin(ang) * R;
      /* jello: pointer repels; underdamped spring returns */
      if (!reduce) {
        const ddx = rx + d.dx - px, ddy = ry + d.dy - py;
        const dist = Math.hypot(ddx, ddy);
        if (dist < 70) {
          const f = (70 - dist) / 70 * 2.4;
          d.vx += (ddx / (dist || 1)) * f; d.vy += (ddy / (dist || 1)) * f;
        }
        d.vx += -d.dx * 0.06; d.vy += -d.dy * 0.06;   /* spring */
        d.vx *= 0.86; d.vy *= 0.86;                    /* damping (jiggle) */
        d.dx += d.vx; d.dy += d.vy;
      }
      const x = rx + d.dx, y = ry + d.dy;
      d._x = x; d._y = y;
      const hover = Math.hypot(x - px, y - py) < d.r0 + 12;
      if (hover) over = true;
      const rr = d.r0 * (expanded ? 1.5 : 1) * (hover ? 1.18 : 1);
      ctx.beginPath();
      ctx.arc(x * dpr, y * dpr, rr * dpr, 0, 6.2832);
      if (d.site.id === MV.current) {
        ctx.lineWidth = 2.5 * dpr;
        ctx.strokeStyle = d.site.swatch;
        ctx.stroke();
      } else {
        ctx.fillStyle = d.site.swatch;
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
      if (Math.hypot((d._x ?? -1e4) - x, (d._y ?? -1e4) - y) < d.r0 + 14) return d;
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
  }

  async function go(d, e) {
    if (d.site.id === MV.current) { collapse(); return; }
    await cover({ x: e.clientX, y: e.clientY, color: d.site.ink });
    location.href = '/' + d.site.id + '/';
  }

  cv.addEventListener('click', (e) => {
    const d = hit(e.clientX, e.clientY);
    if (fine) { if (d) go(d, e); return; }
    /* touch: first tap expands + blurs; second picks */
    if (!expanded) {
      expanded = true; layout();
      blur.style.opacity = '1';
      blur.style.backdropFilter = blur.style.webkitBackdropFilter = 'blur(9px)';
      blur.style.pointerEvents = 'auto';
      return;
    }
    if (d) go(d, e); else collapse();
  });
  blur.addEventListener('click', collapse);

  /* reveal when the info area arrives */
  const info = document.getElementById('mv-info');
  function show() { shown = true; cv.style.opacity = '1'; if (!raf) raf = requestAnimationFrame(frame); }
  if (info && 'IntersectionObserver' in window) {
    /* default hidden; if IO misbehaves the ring simply appears after 2s —
       never a dead control */
    const io = new IntersectionObserver((ens) => {
      ens.forEach((en) => { if (en.isIntersecting) show(); });
    }, { threshold: 0.15 });
    io.observe(info);
    setTimeout(() => { if (!shown) show(); }, 2000);
  } else {
    show();
  }
})();
