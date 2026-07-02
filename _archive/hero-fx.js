// ═══════════════════════════════════════════════════════════════
// hero-fx.js — homepage hero overlay: boids + constellation lines
//
// Single transparent canvas pinned to the viewport. Hosts two
// independent systems on one rAF loop, both reading state from
// the same playground (.letter-chunk + .y-dot--free) that dot.js
// and letters.js drive:
//
//   1. Boids — 5 chevrons (4 ink + 1 yellow rogue) drifting over
//      the hero. Standard flocking (separation / alignment /
//      cohesion) plus repellers at every loose letter chunk and
//      the free dot. Throwing a letter scatters the flock; the
//      rogue ignores alignment + cohesion so it wanders apart.
//      Static TRES letters are not repellers — the flock gets to
//      thread through the intact title, which looks great.
//
//   2. Constellation — when at least 2 of (loose letters + free
//      dot) exist, faint dashed yellow lines connect every pair
//      within ~400px. Alpha falls off with distance so distant
//      pairs barely show. Encourages the play mechanic: throw
//      more, see more pattern.
//
// Skip-render past hero (matches flow-field.js's behavior). Bow
// out entirely under reduced-motion. Inserted right after the
// flow-field canvas so it stacks above the field but below the
// .content layer once you scroll past the hero.
// ═══════════════════════════════════════════════════════════════
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ─── Canvas mount ────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-fx';
  canvas.setAttribute('aria-hidden', 'true');
  // Insert right after the flow-field canvas (or the static .dot-grid
  // fallback) so the boids/lines stack above the field but pointer
  // events still pass through to the dot/letters/content below.
  function mount() {
    const after = document.querySelector('.flow-field, .dot-grid');
    if (after && after.parentNode) {
      after.parentNode.insertBefore(canvas, after.nextSibling);
    } else {
      document.body.insertBefore(canvas, document.body.firstChild);
    }
  }
  mount();
  const ctx = canvas.getContext('2d', { alpha: true });

  let W = 0, H = 0, DPR = 1;
  // (hover: none) is the right test for "primary input can't hover" —
  // i.e. phones + touch-only tablets. Plain `'ontouchstart' in window`
  // false-positives on Windows laptops with touchscreens (mouse is the
  // real primary input there) and would wrongly shrink the flock.
  const isTouch = window.matchMedia('(hover: none)').matches;
  const DPR_CAP = isTouch ? 1.5 : 2;

  function resize() {
    DPR = Math.min(DPR_CAP, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ─── Boid flock ──────────────────────────────────────────────
  // Flock size scales with viewport width on desktop so the hero
  // doesn't look sparse on widescreens. Touch devices get a smaller
  // calmer flock so it reads as ambient atmosphere, not noise.
  //
  // Tuning rationale:
  //   • MIN_SPEED keeps boids drifting forward — kills the "stuck
  //     spinning" pattern where weak cohesion + a nearby repeller
  //     locks a boid into orbit at near-zero velocity
  //   • WANDER_AMOUNT adds a small random nudge per frame so any
  //     accidental orbit dissolves in a couple seconds
  //   • Repeller force uses a cubic ramp — gentle far away, very
  //     strong near the center, so boids get punched clear of
  //     letter chunks instead of orbiting them
  //   • Boundary forces only fire when the boid is moving OUTWARD
  //     so they don't compound with separation in a corner
  //
  // `isTouch` is declared up in the DPR section. We reuse it here —
  // touch users get a smaller flock, large desktops scale up.
  // O(n²) inner loop at 45 boids = ~2000 ops/frame, still sub-ms.
  const BOID_COUNT     = isTouch ? 20 : Math.max(40, Math.min(45, Math.round(W / 45)));

  const MAX_SPEED      = 1.75;
  const MIN_SPEED      = 0.55;   // hard floor — boids never stall
  const MAX_FORCE      = 0.045;
  const NEIGHBOR_R     = 115;    // alignment + cohesion radius
  const SEPARATION_R   = 38;     // tighter than neighbor so the flock packs
  const REPELLER_PAD   = 85;
  const REPELLER_FORCE = 0.42;   // peak push at center of a chunk
  const SCATTER_R      = 280;
  const SCATTER_FORCE  = 0.95;
  const SCATTER_LIFE   = 1200;   // ms — total click-scatter lifetime
  const WANDER_AMOUNT  = 0.025;  // per-frame random nudge magnitude
  const BOUNDARY_K     = 0.0010;

  // Flocking weights (rogue gets reduced alignment + cohesion so it
  // visibly wanders apart, but full separation so it still avoids
  // bumping into anyone).
  const W_SEPARATION   = 1.55;
  const W_ALIGNMENT    = 1.05;
  const W_COHESION     = 1.00;
  const ROGUE_FACTOR   = 0.22;

  const boids = [];
  for (let i = 0; i < BOID_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Cluster the initial positions in the upper-mid band so the
    // flock starts visible and already loosely together.
    boids.push({
      x: W * 0.2 + Math.random() * W * 0.6,
      y: H * 0.22 + Math.random() * H * 0.32,
      vx: Math.cos(angle) * MAX_SPEED * 0.55,
      vy: Math.sin(angle) * MAX_SPEED * 0.55,
      rogue: i === 0,  // first boid is the rogue, deterministic
    });
  }

  // Hero region the flock prefers to stay in. Top edge avoids the
  // fixed .nav (1.5rem padding + line height ≈ 70px). Bottom edge
  // sits well above the index list so boids don't peek through.
  function getRegion() {
    return { top: 70, bottom: H * 0.78, left: 32, right: W - 32 };
  }

  // Snapshot of repellers (loose letter chunks + free dot). One
  // DOM read per frame — chunk count is normally 0–4, so the cost
  // is trivial. Cached as plain rect+radius pairs.
  function collectRepellers() {
    const out = [];
    document.querySelectorAll('.letter-chunk').forEach(el => {
      const r = el.getBoundingClientRect();
      out.push({
        x: r.left + r.width  * 0.5,
        y: r.top  + r.height * 0.5,
        r: Math.max(r.width, r.height) * 0.55,
      });
    });
    const fd = document.querySelector('.y-dot--free');
    if (fd) {
      const r = fd.getBoundingClientRect();
      out.push({
        x: r.left + r.width  * 0.5,
        y: r.top  + r.height * 0.5,
        r: r.width * 0.65,
      });
    }
    return out;
  }

  // ─── Click-scatter ──────────────────────────────────────────
  // Clicking empty space (not on letters / dot / links) records a
  // scatter point. The next ~1.2s of ticks push every boid away
  // from it with distance × age falloff. Reuses the same exclude
  // list that flow-field.js uses for its ripples so the two effects
  // co-fire on the same body clicks.
  const SCATTERS = [];
  const SCATTER_IGNORE = [
    'a', 'button', 'input', 'textarea',
    '.letter', '.letter-chunk', '.y-dot',
    '.nav', '.footer',
    '[data-hover]',
  ].join(', ');
  let lastDownExcluded = false;
  function isExcluded(t) {
    return !!(t && t.closest && t.closest(SCATTER_IGNORE));
  }
  window.addEventListener('pointerdown', (e) => {
    lastDownExcluded = isExcluded(e.target);
  }, true);
  window.addEventListener('click', (e) => {
    if (lastDownExcluded) { lastDownExcluded = false; return; }
    if (isExcluded(e.target)) return;
    SCATTERS.push({ x: e.clientX, y: e.clientY, bornAt: performance.now() });
    if (SCATTERS.length > 4) SCATTERS.shift();
  });

  function tickBoids(repellers) {
    const region = getRegion();
    const now = performance.now();

    // Drop dead scatters before the per-boid loop
    for (let i = SCATTERS.length - 1; i >= 0; i--) {
      if (now - SCATTERS[i].bornAt > SCATTER_LIFE) SCATTERS.splice(i, 1);
    }

    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      let sepX = 0, sepY = 0, sepN = 0;
      let aliX = 0, aliY = 0, aliN = 0;
      let cohX = 0, cohY = 0, cohN = 0;

      for (let j = 0; j < boids.length; j++) {
        if (i === j) continue;
        const o  = boids[j];
        const dx = b.x - o.x;
        const dy = b.y - o.y;
        const d  = Math.hypot(dx, dy);
        if (d <= 0) continue;
        if (d < SEPARATION_R) {
          // Weighted by inverse distance so close neighbours push harder
          sepX += (dx / d) / d;
          sepY += (dy / d) / d;
          sepN++;
        }
        if (d < NEIGHBOR_R) {
          aliX += o.vx;
          aliY += o.vy;
          cohX += o.x;
          cohY += o.y;
          aliN++;
          cohN++;
        }
      }

      let ax = 0, ay = 0;

      if (sepN > 0) {
        let fx = sepX, fy = sepY;
        const m = Math.hypot(fx, fy) || 1;
        fx = (fx / m) * MAX_SPEED - b.vx;
        fy = (fy / m) * MAX_SPEED - b.vy;
        const fm = Math.hypot(fx, fy);
        if (fm > MAX_FORCE) { fx = (fx / fm) * MAX_FORCE; fy = (fy / fm) * MAX_FORCE; }
        ax += fx * W_SEPARATION;
        ay += fy * W_SEPARATION;
      }
      if (aliN > 0) {
        let fx = aliX / aliN, fy = aliY / aliN;
        const m = Math.hypot(fx, fy) || 1;
        fx = (fx / m) * MAX_SPEED - b.vx;
        fy = (fy / m) * MAX_SPEED - b.vy;
        const fm = Math.hypot(fx, fy);
        if (fm > MAX_FORCE) { fx = (fx / fm) * MAX_FORCE; fy = (fy / fm) * MAX_FORCE; }
        const w = W_ALIGNMENT * (b.rogue ? ROGUE_FACTOR : 1);
        ax += fx * w;
        ay += fy * w;
      }
      if (cohN > 0) {
        const dx = cohX / cohN - b.x;
        const dy = cohY / cohN - b.y;
        const d  = Math.hypot(dx, dy);
        if (d > 0) {
          let fx = (dx / d) * MAX_SPEED - b.vx;
          let fy = (dy / d) * MAX_SPEED - b.vy;
          const fm = Math.hypot(fx, fy);
          if (fm > MAX_FORCE) { fx = (fx / fm) * MAX_FORCE; fy = (fy / fm) * MAX_FORCE; }
          const w = W_COHESION * (b.rogue ? ROGUE_FACTOR : 1);
          ax += fx * w;
          ay += fy * w;
        }
      }

      // Repellers — every loose letter chunk + the free dot.
      // Cubic ramp so the push gets very strong near the center,
      // which prevents the orbit-lock that was making boids spin
      // around a chunk indefinitely.
      for (let k = 0; k < repellers.length; k++) {
        const rp = repellers[k];
        const dx = b.x - rp.x;
        const dy = b.y - rp.y;
        const d  = Math.hypot(dx, dy);
        const range = rp.r + REPELLER_PAD;
        if (d > 0 && d < range) {
          const t = 1 - d / range;
          const force = t * t * t * REPELLER_FORCE;
          ax += (dx / d) * force;
          ay += (dy / d) * force;
        }
      }

      // Click-scatter — distance × age falloff. Quadratic in both
      // so the kick is sharp on impact and fades smoothly.
      for (let k = 0; k < SCATTERS.length; k++) {
        const s = SCATTERS[k];
        const dx = b.x - s.x;
        const dy = b.y - s.y;
        const d  = Math.hypot(dx, dy);
        if (d > 0 && d < SCATTER_R) {
          const distF = 1 - d / SCATTER_R;
          const lifeF = 1 - (now - s.bornAt) / SCATTER_LIFE;
          if (lifeF <= 0) continue;
          const f = distF * distF * lifeF * lifeF * SCATTER_FORCE;
          ax += (dx / d) * f;
          ay += (dy / d) * f;
        }
      }

      // Wander — small random nudge per frame. Breaks accidental
      // orbits and gives the flock a natural, organic drift even
      // when nothing else is influencing them.
      ax += (Math.random() - 0.5) * WANDER_AMOUNT;
      ay += (Math.random() - 0.5) * WANDER_AMOUNT;

      // Soft boundary — only push back when the boid is moving
      // *toward* the edge. Avoids the corner-trap where the x and y
      // boundary forces compound with separation into a stuck spin.
      if (b.x < region.left   && b.vx < 0) ax += (region.left   - b.x) * BOUNDARY_K;
      if (b.x > region.right  && b.vx > 0) ax -= (b.x - region.right)  * BOUNDARY_K;
      if (b.y < region.top    && b.vy < 0) ay += (region.top    - b.y) * BOUNDARY_K;
      if (b.y > region.bottom && b.vy > 0) ay -= (b.y - region.bottom) * BOUNDARY_K;

      b.vx += ax;
      b.vy += ay;

      // Speed clamps: hard max for stability, hard min so boids
      // never sit still (orbit-lock kill switch).
      let speed = Math.hypot(b.vx, b.vy);
      if (speed > MAX_SPEED) {
        b.vx = (b.vx / speed) * MAX_SPEED;
        b.vy = (b.vy / speed) * MAX_SPEED;
      } else if (speed < MIN_SPEED) {
        if (speed > 0.0001) {
          b.vx = (b.vx / speed) * MIN_SPEED;
          b.vy = (b.vy / speed) * MIN_SPEED;
        } else {
          // Total stop — random kick to restart
          const a = Math.random() * Math.PI * 2;
          b.vx = Math.cos(a) * MIN_SPEED;
          b.vy = Math.sin(a) * MIN_SPEED;
        }
      }

      b.x += b.vx;
      b.y += b.vy;
    }
  }

  function drawBoids() {
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      const angle = Math.atan2(b.vy, b.vx);
      const size = b.rogue ? 6.5 : 5.5;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);
      ctx.fillStyle = b.rogue ? '#F5CB5C' : 'rgba(10, 10, 10, 0.62)';
      // Chevron pointing in direction of travel
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size * 0.7, -size * 0.55);
      ctx.lineTo(-size * 0.35, 0);
      ctx.lineTo(-size * 0.7,  size * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ─── Constellation ───────────────────────────────────────────
  // Pulls the same loose-pieces snapshot the boids use, draws
  // dashed yellow segments between every pair within range.
  const CONSTELL_MAX_DIST = 420;
  function drawConstellation() {
    const pts = [];
    document.querySelectorAll('.letter-chunk').forEach(el => {
      const r = el.getBoundingClientRect();
      pts.push({ x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 });
    });
    const fd = document.querySelector('.y-dot--free');
    if (fd) {
      const r = fd.getBoundingClientRect();
      pts.push({ x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 });
    }
    if (pts.length < 2) return;

    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d  = Math.hypot(dx, dy);
        if (d > CONSTELL_MAX_DIST) continue;
        const alpha = (1 - d / CONSTELL_MAX_DIST) * 0.5;
        ctx.strokeStyle = `rgba(245, 203, 92, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
    // Tiny halo at each anchor point — sells the "constellation" read
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(245, 203, 92, 0.55)';
    for (let i = 0; i < pts.length; i++) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ─── Main loop ───────────────────────────────────────────────
  function loop() {
    requestAnimationFrame(loop);
    // Skip when content has covered the hero — same trick as flow-field
    if (window.scrollY > H * 0.95) return;
    ctx.clearRect(0, 0, W, H);
    const repellers = collectRepellers();
    drawConstellation();
    tickBoids(repellers);
    drawBoids();
  }
  requestAnimationFrame(loop);
})();
