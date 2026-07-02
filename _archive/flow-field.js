// ═══════════════════════════════════════════════════════════════
// flow-field.js — background grid of directional line segments
//
// Replaces the static .dot-grid element (if present) with a canvas
// that paints a grid of short line segments. Each segment has:
//   • a base angle from cheap 2D pseudo-noise that drifts faster
//     than you'd expect — the field feels alive even when nothing
//     else is interacting
//   • a slow per-cell "breath" length pulse so even still cells
//     look alive
//   • a reactive angle pointing AWAY from the cursor, weighted by
//     a quadratic falloff over a wide radius (segments near the
//     cursor swing strongly, distant ones still respond)
//   • an optional secondary "extra point" attractor — dot.js sets
//     this to the ball position while the ball is free
//   • a small filled dot at the segment's tip so direction reads
//
// Click ripple (big + slow):
//   Click on empty space → ripple from that point. A wavefront
//   expands outward at ~0.65 px/ms over 3.5s — easily wide enough
//   to sweep a full screen. Cells caught in the wave band rotate
//   up to 90° and lengthen smoothly. Plus a central "density pulse"
//   — cells within ~320px of the click point get extra length that
//   fades over 1.2s, like the click is densifying its immediate
//   area before the wave radiates out.
//
//   Exclusion: pointerdown AND click target are both checked
//   against an interactive selector list — pressing on a letter or
//   the ball and releasing on body won't accidentally trigger a
//   ripple.
//
// Cursor ghost trail (subtle movement effect):
//   A second "ghost" reactor follows the live cursor with ~8%/frame
//   lag at smaller radius (~55%) and weight (~40%). While the mouse
//   moves the ghost is briefly behind, giving the field a soft
//   trailing influence. When the cursor stops the ghost catches up
//   and they merge — invisible at rest, visible while moving.
//
// Auto-detects palette from body class: light variant on white pages,
// dark variant when body.lab-body is present.
//
// Public API (window.FlowField):
//   setExtraPoint(x, y) — register a secondary reactor (viewport coords)
//   clearExtraPoint()   — remove it
// ═══════════════════════════════════════════════════════════════
window.FlowField = (() => {
  // Reduced motion: leave the static dot-grid in place and do nothing.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { setExtraPoint: () => {}, clearExtraPoint: () => {} };
  }

  // ─── Tuning — visuals ────────────────────────────────────────
  const GRID          = 28;     // px between cells (denser)
  const SEG_LEN       = 18;     // segment length at full reactor weight
  const SEG_LEN_MIN   = 10;     // segment length at zero reactor weight
  const DOT_R         = 1.6;    // tip-dot radius
  const REACTOR_R     = 500;    // cursor/ball influence radius
  const NOISE_SCALE   = 0.0042;
  const TIME_RATE     = 0.0008; // noise drift speed — more visible
  const BREATHE_RATE  = 0.0005; // global slow length pulse
  const BREATHE_AMP   = 0.18;   // breath length amplitude (adds to w)

  // Touch devices get a lower DPR cap to keep rasterization cheap on
  // Retina iPhones (DPR 3) — visually almost identical, frame-time win.
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const DPR_CAP = isTouch ? 1.5 : 2;

  // ─── Tuning — ripple (click) ─────────────────────────────────
  const RIPPLE_SPEED           = 0.65;          // px per ms — wavefront speed
  const RIPPLE_DURATION        = 3500;          // total ripple lifetime
  const RIPPLE_BAND            = 280;           // wave band width
  const RIPPLE_SPIN_MAX        = Math.PI / 2;   // 90° peak rotation (smoother)
  const RIPPLE_MAX             = 4;             // cap simultaneous ripples
  const RIPPLE_CENTER_R        = 320;           // central density pulse radius
  const RIPPLE_CENTER_DURATION = 1200;          // central pulse lifetime
  const RIPPLE_CENTER_BOOST    = 0.85;          // length boost at center

  // ─── Tuning — cursor ghost trail ─────────────────────────────
  // A second "ghost" reactor lags behind the live cursor, giving a
  // subtle trailing influence on the field while the mouse moves.
  // When the cursor stops, the ghost catches up and they merge.
  const GHOST_LAG    = 0.08;   // ghost catches up this fraction per frame
  const GHOST_R_MUL  = 0.55;   // ghost radius vs. main reactor radius
  const GHOST_W_MUL  = 0.4;    // ghost weight vs. main reactor weight

  // ─── State ───────────────────────────────────────────────────
  let canvas, ctx;
  let W = 0, H = 0, DPR = 1;
  let cursorX = -9999, cursorY = -9999;
  let ghostX  = -9999, ghostY  = -9999;
  let extraX  = -9999, extraY  = -9999;
  const ripples = [];
  let lastPointerDownExcluded = false;

  const isDark = document.body.classList.contains('lab-body');
  // On lab pages the field is the persistent background visible through
  // the entire scrollable card list — we don't want to skip-render when
  // scrolled past the first viewport. On the main site the hero is the
  // only place the field lives so skip-render is safe.
  const skipRenderWhenScrolled = !isDark;
  const strokeColor = isDark
    ? 'rgba(255, 255, 255, 0.22)'
    : 'rgba(10, 10, 10, 0.30)';

  // ─── DOM swap — replace existing .dot-grid with our canvas ───
  function mount() {
    canvas = document.createElement('canvas');
    canvas.className = 'flow-field' + (isDark ? ' flow-field--dark' : '');
    canvas.setAttribute('aria-hidden', 'true');
    const existing = document.querySelector('.dot-grid');
    if (existing) {
      existing.parentNode.replaceChild(canvas, existing);
    } else {
      document.body.insertBefore(canvas, document.body.firstChild);
    }
    ctx = canvas.getContext('2d', { alpha: true });
  }

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

  // ─── Noise ────────────────────────────────────────────────────
  function noiseAngle(x, y, t) {
    const a = Math.sin(x * 0.013 + t * 0.7)
            + Math.cos(y * 0.011 - t * 0.5) * 0.9
            + Math.sin((x + y) * 0.0073 + t * 0.31) * 0.6;
    return a * 1.4;
  }

  // ─── Ripple helpers ──────────────────────────────────────────
  function spawnRipple(x, y) {
    if (ripples.length >= RIPPLE_MAX) ripples.shift();
    ripples.push({ x: x, y: y, born: performance.now() });
  }

  // ─── Render loop ─────────────────────────────────────────────
  function render(t) {
    requestAnimationFrame(render);
    // Skip render when canvas is covered by content — the .content
    // layer (z:2) sits above the flow field once you scroll past the
    // hero, so painting it costs CPU for nothing AND fights the
    // browser's scroll compositing. Big win for scroll smoothness.
    // Lab pages keep the field as their persistent background so we
    // never skip there.
    if (skipRenderWhenScrolled && window.scrollY > window.innerHeight * 0.9) return;
    ctx.clearRect(0, 0, W, H);

    const cols = Math.ceil(W / GRID) + 1;
    const rows = Math.ceil(H / GRID) + 1;
    const offsetX = ((W % GRID) - GRID) / 2;
    const offsetY = ((H % GRID) - GRID) / 2;
    const tt = t * TIME_RATE;
    const r2 = REACTOR_R * REACTOR_R;
    const hasCursor = cursorX > -9000;
    const hasExtra  = extraX  > -9000;
    const now = performance.now();

    // Prune dead ripples up front so we don't iterate them per cell.
    for (let i = ripples.length - 1; i >= 0; i--) {
      if (now - ripples[i].born > RIPPLE_DURATION) ripples.splice(i, 1);
    }
    const hasRipples = ripples.length > 0;

    // Ghost position eases toward live cursor — when the mouse moves
    // the ghost lags briefly behind, giving a soft trailing influence.
    // When the cursor stops, ghost catches up and they merge.
    if (hasCursor) {
      if (ghostX < -9000) { ghostX = cursorX; ghostY = cursorY; }
      else {
        ghostX += (cursorX - ghostX) * GHOST_LAG;
        ghostY += (cursorY - ghostY) * GHOST_LAG;
      }
    } else {
      ghostX = -9999; ghostY = -9999;
    }
    const hasGhost = ghostX > -9000;
    const ghostR  = REACTOR_R * GHOST_R_MUL;
    const ghostR2 = ghostR * ghostR;

    // Two paths so lines + tip dots each get one Path2D + one draw call.
    const linesPath = new Path2D();
    const dotsPath  = new Path2D();

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * GRID + offsetX;
        const y = j * GRID + offsetY;

        // Base drift angle from noise
        const baseA = noiseAngle(x * NOISE_SCALE * 240, y * NOISE_SCALE * 240, tt);
        let vx = Math.cos(baseA);
        let vy = Math.sin(baseA);

        // Reactor blends (cursor + ghost-trail + extra point). Lerp by
        // working with unit vectors to avoid 2π wrap issues.
        let w = 0;
        if (hasCursor) {
          const dx = x - cursorX, dy = y - cursorY;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            const d = Math.sqrt(d2);
            const f = 1 - d / REACTOR_R;
            const cw = f * f;
            const inv = 1 / (d + 0.001);
            vx = vx * (1 - cw) + (dx * inv) * cw;
            vy = vy * (1 - cw) + (dy * inv) * cw;
            if (cw > w) w = cw;
          }
        }
        if (hasGhost) {
          const dx = x - ghostX, dy = y - ghostY;
          const d2 = dx * dx + dy * dy;
          if (d2 < ghostR2) {
            const d = Math.sqrt(d2);
            const f = 1 - d / ghostR;
            const cw = f * f * GHOST_W_MUL;
            const inv = 1 / (d + 0.001);
            vx = vx * (1 - cw) + (dx * inv) * cw;
            vy = vy * (1 - cw) + (dy * inv) * cw;
            if (cw > w) w = cw;
          }
        }
        if (hasExtra) {
          const dx = x - extraX, dy = y - extraY;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            const d = Math.sqrt(d2);
            const f = 1 - d / REACTOR_R;
            const cw = f * f;
            const inv = 1 / (d + 0.001);
            vx = vx * (1 - cw) + (dx * inv) * cw;
            vy = vy * (1 - cw) + (dy * inv) * cw;
            if (cw > w) w = cw;
          }
        }

        // Ripple pass — wavefront (spin + length) plus central density pulse
        if (hasRipples) {
          let spin = 0;
          let rippleW = 0;
          for (let ri = 0; ri < ripples.length; ri++) {
            const rp = ripples[ri];
            const age = now - rp.born;
            const dx = x - rp.x, dy = y - rp.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Wavefront (expanding band)
            const waveR = age * RIPPLE_SPEED;
            const off = Math.abs(dist - waveR);
            if (off < RIPPLE_BAND) {
              const band = 1 - off / RIPPLE_BAND;
              const life = 1 - age / RIPPLE_DURATION;
              const intensity = band * band * life;
              spin += intensity * RIPPLE_SPIN_MAX;
              if (intensity > rippleW) rippleW = intensity;
            }

            // Central density pulse — cells near the click densify
            // and lengthen, then fade out over RIPPLE_CENTER_DURATION
            if (age < RIPPLE_CENTER_DURATION && dist < RIPPLE_CENTER_R) {
              const lifeC = 1 - age / RIPPLE_CENTER_DURATION;
              const prox  = 1 - dist / RIPPLE_CENTER_R;
              const cb = lifeC * prox * RIPPLE_CENTER_BOOST;
              if (cb > rippleW) rippleW = cb;
            }
          }
          if (spin !== 0) {
            const cs = Math.cos(spin);
            const sn = Math.sin(spin);
            const nvx = vx * cs - vy * sn;
            const nvy = vx * sn + vy * cs;
            vx = nvx; vy = nvy;
          }
          if (rippleW > w) w = rippleW;
        }

        // Renormalize after all blends.
        const mag = Math.hypot(vx, vy) || 1;
        vx /= mag; vy /= mag;

        // Idle "breath" — phase varies per cell so the breath travels
        // across the field in waves instead of all cells pulsing in sync.
        const breath = 0.5 + 0.5 * Math.sin(t * BREATHE_RATE + (x + y) * 0.013);
        const lenWeight = Math.min(1, w + breath * BREATHE_AMP);
        const len = SEG_LEN_MIN + (SEG_LEN - SEG_LEN_MIN) * lenWeight;
        const h = len * 0.5;
        const tipX = x + vx * h;
        const tipY = y + vy * h;

        linesPath.moveTo(x - vx * h, y - vy * h);
        linesPath.lineTo(tipX, tipY);

        dotsPath.moveTo(tipX + DOT_R, tipY);
        dotsPath.arc(tipX, tipY, DOT_R, 0, Math.PI * 2);
      }
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = 1;
    ctx.lineCap     = 'round';
    ctx.stroke(linesPath);

    ctx.fillStyle = strokeColor;
    ctx.fill(dotsPath);
  }

  // ─── Input ───────────────────────────────────────────────────
  function onPointerMove(e) {
    cursorX = e.clientX;
    cursorY = e.clientY;
  }
  function onPointerLeave() {
    cursorX = -9999; cursorY = -9999;
  }

  // Click on empty space → ripple. Excluded if the click OR the
  // preceding pointerdown was on an interactive element — that way
  // pressing on the ball/letter and releasing on body doesn't trip
  // a ripple, even though the click target would be the body.
  const RIPPLE_IGNORE = [
    'a', 'button', 'input', 'textarea',
    '.letter', '.letter-chunk', '.y-dot',
    '.nav', '.footer',
    '[data-hover]',
  ].join(', ');

  function isExcluded(target) {
    return !!(target && target.closest && target.closest(RIPPLE_IGNORE));
  }

  function onPointerDown(e) {
    lastPointerDownExcluded = isExcluded(e.target);
  }

  function onClick(e) {
    if (lastPointerDownExcluded) {
      lastPointerDownExcluded = false;
      return;
    }
    if (isExcluded(e.target)) return;
    spawnRipple(e.clientX, e.clientY);
  }

  // ─── Boot ────────────────────────────────────────────────────
  function init() {
    mount();
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('click', onClick);
    requestAnimationFrame(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    setExtraPoint(x, y) { extraX = x; extraY = y; },
    clearExtraPoint()   { extraX = -9999; extraY = -9999; },
  };
})();
