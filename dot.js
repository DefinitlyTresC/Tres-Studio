// ═══════════════════════════════════════════════════════════════
// dot.js — yellow dot easter egg + basketball hoop mini-game
//
// The dot is the ball. It lives captive inside the TRES hero name,
// scaling in/out as you scroll. First grab "frees" it into physics
// mode — at the same moment a basketball hoop slides in from the
// left edge of the viewport. Toss the dot through the rim from
// above and the MADE counter ticks up.
//
// State machine:
//   captive  → scale-in/out tied to scroll (no physics)
//   free     → position:fixed, drag + fling, gravity, edge bounces,
//              collisions with major title bboxes
//   scoring  → ball through rim from above with downward velocity →
//              particle burst + counter punch → respawn at TRES
//
// The hoop persists once spawned; the ball respawns at TRES after
// each score. Counter resets only on page reload.
// ═══════════════════════════════════════════════════════════════
(() => {
  const dot = document.querySelector('.hero-name .y-dot');
  if (!dot) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dot.classList.add('is-visible');
    return;
  }

  dot.setAttribute('data-hover', '');

  // ─── State ────────────────────────────────────────────────────
  let free     = false;
  let dragging = false;
  let scored   = false;
  let visible  = false;
  let hoopEl   = null;
  let counterEl = null;
  let scoreCount = 0;
  let obstacles = [];

  const pos = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  const drag = { offsetX: 0, offsetY: 0, lastTime: 0, sampleX: 0, sampleY: 0 };

  // ─── Physics constants ────────────────────────────────────────
  const GRAVITY     = 0.42;
  const DAMPING     = 0.992;
  const RESTITUTION = 0.72;
  const MAX_VEL     = 32;

  // Safe-area insets keep the ball out of OS gesture zones at the
  // screen edges. iOS Safari intercepts touches in the bottom ~34px
  // (home-bar swipe-up) and along the side edges (browser back/forward
  // gestures) before our JS can preventDefault — so if the ball drifts
  // into those zones the player can't grab it without flinging
  // themselves out of the page. Desktop has no such zones; inset = 0.
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const SAFE_BOTTOM = isTouch ? 60 : 0;
  const SAFE_SIDE   = isTouch ? 24 : 0;

  // ─── Scroll-based visibility (captive state) ──────────────────
  function shouldBeVisible() {
    return window.scrollY < window.innerHeight * 0.3;
  }
  function setVisibility(v) {
    if (free) return;
    if (v === visible) return;
    visible = v;
    dot.classList.toggle('is-visible', v);
  }
  window.addEventListener('scroll', () => setVisibility(shouldBeVisible()), { passive: true });
  setTimeout(() => setVisibility(shouldBeVisible()), 480);

  // ─── First interaction promotes captive dot to free ───────────
  function freeDot() {
    if (free) return;
    free = true;
    const r = dot.getBoundingClientRect();
    pos.x = r.left;
    pos.y = r.top;
    dot.classList.add('is-visible');
    dot.style.position = 'fixed';
    dot.style.left  = pos.x + 'px';
    dot.style.top   = pos.y + 'px';
    dot.style.right = 'auto';
    dot.style.bottom = 'auto';
    dot.classList.add('y-dot--free');
    showHoop();
    updateObstacles();
    requestAnimationFrame(tick);
  }

  function radius() { return dot.offsetWidth / 2; }

  // ─── Drag handlers ────────────────────────────────────────────
  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    const p = (e.touches && e.touches[0]) || e;
    if (!free) freeDot();
    dragging = true;
    dot.classList.add('y-dot--grabbing');
    const r = dot.getBoundingClientRect();
    drag.offsetX = p.clientX - r.left;
    drag.offsetY = p.clientY - r.top;
    drag.sampleX = p.clientX;
    drag.sampleY = p.clientY;
    drag.lastTime = performance.now();
    vel.x = vel.y = 0;
  }

  function moveDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    const p = (e.touches && e.touches[0]) || e;
    pos.x = p.clientX - drag.offsetX;
    pos.y = p.clientY - drag.offsetY;
    const now = performance.now();
    if (now - drag.lastTime > 30) {
      const dt = Math.max(1, now - drag.lastTime);
      vel.x = (p.clientX - drag.sampleX) / dt * 16;
      vel.y = (p.clientY - drag.sampleY) / dt * 16;
      drag.sampleX = p.clientX;
      drag.sampleY = p.clientY;
      drag.lastTime = now;
    }
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    dot.classList.remove('y-dot--grabbing');
    vel.x = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel.x));
    vel.y = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel.y));
  }

  dot.addEventListener('mousedown',   startDrag);
  dot.addEventListener('touchstart',  startDrag, { passive: false });
  window.addEventListener('mousemove',  moveDrag);
  window.addEventListener('touchmove',  moveDrag, { passive: false });
  window.addEventListener('mouseup',    endDrag);
  window.addEventListener('touchend',   endDrag);
  window.addEventListener('touchcancel', endDrag);

  // ─── Obstacles (title bboxes the ball bounces off) ────────────
  const OBSTACLE_SELECTORS = [
    '.hero-name',
    '.index-row .name',
    '.cat-link .label',
    '.footer-mark',
  ].join(', ');

  function updateObstacles() {
    if (!free) return;
    const w = window.innerWidth, h = window.innerHeight;
    obstacles = [];
    document.querySelectorAll(OBSTACLE_SELECTORS).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right < 0 || r.left > w || r.bottom < 0 || r.top > h) return;
      obstacles.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    });
  }

  let obstacleScheduled = false;
  function scheduleObstacleUpdate() {
    if (obstacleScheduled) return;
    obstacleScheduled = true;
    requestAnimationFrame(() => {
      obstacleScheduled = false;
      updateObstacles();
    });
  }
  window.addEventListener('scroll', scheduleObstacleUpdate, { passive: true });
  window.addEventListener('resize', scheduleObstacleUpdate);

  function collideRect(cx, cy, r, rect) {
    const px = Math.max(rect.left, Math.min(cx, rect.right));
    const py = Math.max(rect.top,  Math.min(cy, rect.bottom));
    const dx = cx - px, dy = cy - py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist >= r) return null;
    const overlap = r - dist;
    let nx, ny;
    if (dist === 0) {
      const exits = [cx - rect.left, rect.right - cx, cy - rect.top, rect.bottom - cy];
      const min = Math.min(...exits);
      if      (min === exits[0]) { nx = -1; ny = 0; }
      else if (min === exits[1]) { nx =  1; ny = 0; }
      else if (min === exits[2]) { nx = 0;  ny = -1; }
      else                       { nx = 0;  ny = 1; }
    } else {
      nx = dx / dist; ny = dy / dist;
    }
    return { nx, ny, overlap };
  }

  // ─── Minimalist circle target ─────────────────────────────────
  // Two concentric dashed/solid rings. Slides in from off-screen left
  // when the ball is first freed and stays put for the rest of the
  // session. Score detection is a simple distance-from-center check
  // (see checkScore) — direction-agnostic and very forgiving.
  function showHoop() {
    if (!hoopEl) {
      hoopEl = document.createElement('div');
      hoopEl.className = 'hoop';
      hoopEl.innerHTML = `
        <div class="hoop-target" aria-hidden="true"></div>
        <div class="hoop-counter">
          <span class="hoop-counter-label">— Made</span>
          <span class="hoop-counter-value">0</span>
        </div>
      `;
      document.body.appendChild(hoopEl);
      counterEl = hoopEl.querySelector('.hoop-counter-value');
    }
    requestAnimationFrame(() => hoopEl.classList.add('visible'));
  }

  function getTargetBounds() {
    if (!hoopEl) return null;
    const target = hoopEl.querySelector('.hoop-target');
    if (!target) return null;
    const r = target.getBoundingClientRect();
    return {
      cx: r.left + r.width / 2,
      cy: r.top  + r.height / 2,
      radius: r.width / 2,
    };
  }

  // Forgiving score: ball center within 95% of the visible target
  // radius counts, regardless of direction. No "must cross from above"
  // rule — the player should land hits even on weird arcing tosses.
  const SCORE_RADIUS = 0.95;
  function checkScore(ballCx, ballCy) {
    if (!hoopEl || scored) return false;
    const t = getTargetBounds();
    if (!t) return false;
    return Math.hypot(ballCx - t.cx, ballCy - t.cy) < t.radius * SCORE_RADIUS;
  }

  // ─── Particle burst on score ──────────────────────────────────
  function burst(cx, cy) {
    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 5 + Math.random() * 7;
      spawnParticle(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed - 2);
    }
  }
  function spawnParticle(x, y, ivx, ivy) {
    const p = document.createElement('div');
    p.className = 'dot-particle';
    const size = 5 + Math.random() * 9;
    p.style.width = p.style.height = size + 'px';
    p.style.left = (x - size / 2) + 'px';
    p.style.top  = (y - size / 2) + 'px';
    document.body.appendChild(p);
    let px = 0, py = 0, pvx = ivx, pvy = ivy, life = 1;
    function step() {
      pvy += 0.32; pvx *= 0.99; pvy *= 0.99;
      px += pvx; py += pvy;
      life -= 0.016;
      if (life <= 0) { p.remove(); return; }
      p.style.transform = `translate(${px}px, ${py}px)`;
      p.style.opacity = life;
      requestAnimationFrame(step);
    }
    step();
  }

  // ─── Counter ──────────────────────────────────────────────────
  function bumpCounter() {
    scoreCount++;
    counterEl.textContent = scoreCount;
    counterEl.classList.remove('punch');
    void counterEl.offsetWidth;     // restart the animation
    counterEl.classList.add('punch');
  }

  // ─── Score sequence ───────────────────────────────────────────
  function score() {
    if (scored) return;
    scored = true;
    const r = radius();
    burst(pos.x + r, pos.y + r);
    bumpCounter();
    dot.style.transition = 'transform 0.32s cubic-bezier(0.4, 0, 0.6, 1), opacity 0.32s ease';
    dot.style.transform = 'scale(0)';
    dot.style.opacity = '0';
    if (hoopEl) {
      hoopEl.classList.add('flash');
      setTimeout(() => hoopEl && hoopEl.classList.remove('flash'), 500);
    }
    setTimeout(respawn, 1200);
  }

  function respawn() {
    // Ball resets to captive in TRES. Hoop and counter persist so the
    // game continues — grab the dot again, take the next shot.
    free = dragging = scored = false;
    vel.x = vel.y = 0;
    obstacles = [];
    dot.classList.remove('y-dot--free', 'y-dot--grabbing', 'is-visible');
    dot.style.cssText = '';
    visible = false;
    setTimeout(() => setVisibility(shouldBeVisible()), 200);
  }

  // ─── Main loop ────────────────────────────────────────────────
  function tick() {
    if (!free) return;
    if (!dragging && !scored) {
      vel.y += GRAVITY;
      vel.x *= DAMPING;
      vel.y *= DAMPING;
      pos.x += vel.x;
      pos.y += vel.y;

      const r = radius();
      let cx = pos.x + r, cy = pos.y + r;
      const w = window.innerWidth, h = window.innerHeight;

      // Viewport edges (with safe-area insets on touch devices)
      if (cx - r < SAFE_SIDE)     { cx = r + SAFE_SIDE;     vel.x = -vel.x * RESTITUTION; }
      if (cx + r > w - SAFE_SIDE) { cx = w - r - SAFE_SIDE; vel.x = -vel.x * RESTITUTION; }
      if (cy - r < 0)             { cy = r;                 vel.y = -vel.y * RESTITUTION; }
      if (cy + r > h - SAFE_BOTTOM) { cy = h - r - SAFE_BOTTOM; vel.y = -vel.y * RESTITUTION; }

      // Title obstacles
      for (let i = 0; i < obstacles.length; i++) {
        const hit = collideRect(cx, cy, r, obstacles[i]);
        if (!hit) continue;
        cx += hit.nx * hit.overlap;
        cy += hit.ny * hit.overlap;
        const vn = vel.x * hit.nx + vel.y * hit.ny;
        if (vn < 0) {
          vel.x -= 2 * vn * hit.nx * RESTITUTION;
          vel.y -= 2 * vn * hit.ny * RESTITUTION;
        }
      }

      pos.x = cx - r;
      pos.y = cy - r;

      if (checkScore(cx, cy)) score();
    }

    dot.style.left = pos.x + 'px';
    dot.style.top  = pos.y + 'px';
    requestAnimationFrame(tick);
  }
})();
