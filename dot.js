// ═══════════════════════════════════════════════════════════════
// dot.js — yellow dot that detaches from TRES, floats freely,
// and waves the title when you drop it back in place.
//
// States:
//   captive   → scales in/out with scroll, sits inside .hero-name
//   free      → position:fixed, drag + fling, zero gravity, light
//                damping, bounces off viewport edges + title bboxes
//   returning → eased glide back to home; on arrival, the TRES
//                letters do a brief wave, smashed letters restore,
//                and the dot returns to captive
//
// Dragging has cursor-trail-style lag — the dot eases toward the
// pointer instead of snapping, so it feels heavy and physical. The
// release velocity is whatever lag-built momentum is in flight at
// the moment you let go.
//
// Letter collision is a 2D elastic billiards bounce: ball reverses
// ~23% of its normal velocity (the letter is "heavier"), letter
// takes ~62% of normal velocity in the ball's direction of travel.
// Tangential velocity passes through unchanged, so the ball slides
// past at angled hits.
//
// Auto-resets:
//   • 5s of low velocity while free → glides home automatically
//   • scrolling past hero            → glides home + restores letters
//
// Letter wrapping + smash physics live in letters.js — this file
// only calls Letters.findHit + Letters.smash on collision. Letters
// auto-return on their own independent idle clocks, so the ball
// returning home doesn't trigger any group reset.
// ═══════════════════════════════════════════════════════════════
(() => {
  const dot      = document.querySelector('.hero-name .y-dot');
  const heroName = document.querySelector('.hero-name');
  if (!dot || !heroName) return;

  // Reduced motion: show the dot statically and do nothing else.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    dot.classList.add('is-visible');
    return;
  }

  dot.setAttribute('data-hover', '');

  // letters.js handles letter wrapping. It also runs on its own MutationObserver,
  // so we just trust the spans are there by the time we need them.

  // ─── State ────────────────────────────────────────────────────
  let free      = false;
  let dragging  = false;
  let returning = false;
  let visible   = false;
  let obstacles = [];
  let idleStart = 0;          // timestamp when ball entered low-velocity state

  const pos  = { x: 0, y: 0 };
  const vel  = { x: 0, y: 0 };
  const drag = { offsetX: 0, offsetY: 0, targetX: 0, targetY: 0 };

  // ─── Physics constants ────────────────────────────────────────
  // Damping is intentionally light so the ball glides far after a
  // fling — the "buttery" feel. DRAG_LAG matches letters.js so the
  // ball and the letters drag with the same weight.
  const DAMPING     = 0.988;
  const RESTITUTION = 0.72;   // wall bounce
  const MAX_VEL     = 30;
  const DRAG_LAG    = 0.15;   // fraction pos eases toward cursor target per frame

  // Ball-letter elastic collision parameters.
  // E = coefficient of restitution (0.85 = mostly elastic with some loss).
  // M = letter mass / ball mass — letters are heavier so the ball
  // bounces back instead of passing through, while still imparting
  // most of its normal velocity to the letter.
  const SMASH_E = 0.85;
  const SMASH_M = 2.0;
  // Pre-computed velocity factors (cleaner than recomputing each hit).
  const BALL_FACTOR   = (1 - SMASH_E * SMASH_M) / (1 + SMASH_M); // ≈ -0.233
  const LETTER_FACTOR = (1 + SMASH_E)           / (1 + SMASH_M); // ≈ 0.617
  // Minimum normal-velocity magnitude needed to break a letter loose.
  // Below this the ball bounces off the letter rect normally.
  const SMASH_VN = 3.5;

  // Idle auto-return — once the ball settles below IDLE_VEL_THRESHOLD
  // for IDLE_RETURN_MS in a row, it glides home on its own.
  const IDLE_VEL_THRESHOLD = 0.4;
  const IDLE_RETURN_MS     = 3000;

  // Safe-area insets keep the dot out of iOS gesture zones (bottom
  // home-bar swipe-up, side back/forward swipes). Desktop = 0.
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const SAFE_BOTTOM = isTouch ? 60 : 0;
  const SAFE_SIDE   = isTouch ? 24 : 0;

  // ─── Captive scroll visibility + past-hero body flag ──────────
  // body.past-hero is the global "scrolled past hero" signal — kept
  // around as a free hook in case future CSS wants to react to it.
  // Letters and the ball stay in whatever state they're in regardless
  // of scroll — the user wants to scroll away and come back to the
  // same arrangement.
  function shouldBeVisible() {
    return window.scrollY < window.innerHeight * 0.3;
  }
  function setVisibility(v) {
    if (free || returning) return;
    if (v === visible) return;
    visible = v;
    dot.classList.toggle('is-visible', v);
  }
  function updateScrollState() {
    const inHero = shouldBeVisible();
    setVisibility(inHero);
    document.body.classList.toggle('past-hero', !inHero);
  }
  window.addEventListener('scroll', updateScrollState, { passive: true });
  setTimeout(updateScrollState, 480);

  // ─── Detach (captive → free) ──────────────────────────────────
  function freeDot() {
    if (free) return;
    free = true;
    const r = dot.getBoundingClientRect();
    pos.x = r.left;
    pos.y = r.top;
    dot.classList.add('is-visible', 'y-dot--free');
    dot.style.position = 'fixed';
    dot.style.left    = pos.x + 'px';
    dot.style.top     = pos.y + 'px';
    dot.style.right   = 'auto';
    dot.style.bottom  = 'auto';
    updateObstacles();
    idleStart = 0;
    requestAnimationFrame(tick);
  }

  function radius() { return dot.offsetWidth / 2; }

  // ─── Drag handlers ────────────────────────────────────────────
  // moveDrag only updates the target position. The actual position
  // eases toward that target inside tick(), which gives the ball its
  // weighty cursor-trail lag.
  function startDrag(e) {
    if (returning) return;
    e.preventDefault();
    e.stopPropagation();
    const p = (e.touches && e.touches[0]) || e;
    if (!free) freeDot();
    dragging = true;
    idleStart = 0;
    dot.classList.add('y-dot--grabbing');
    const r = dot.getBoundingClientRect();
    drag.offsetX = p.clientX - r.left;
    drag.offsetY = p.clientY - r.top;
    drag.targetX = pos.x;
    drag.targetY = pos.y;
    vel.x = vel.y = 0;
  }

  function moveDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    const p = (e.touches && e.touches[0]) || e;
    drag.targetX = p.clientX - drag.offsetX;
    drag.targetY = p.clientY - drag.offsetY;
  }

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    dot.classList.remove('y-dot--grabbing');
    vel.x = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel.x));
    vel.y = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel.y));
    idleStart = 0;

    // "Put it back" — check the CURSOR position (not the ball position)
    // against the TRES bounding rect. With drag lag the ball can lag
    // significantly behind the cursor, so checking the cursor matches
    // user intent: "I let go *over* the title."
    const p = (e && e.changedTouches && e.changedTouches[0]) ||
              (e && e.touches && e.touches[0]) || e;
    if (p && p.clientX != null) {
      const hr = heroName.getBoundingClientRect();
      if (p.clientX >= hr.left && p.clientX <= hr.right &&
          p.clientY >= hr.top  && p.clientY <= hr.bottom) {
        returnHome();
      }
    }
  }

  dot.addEventListener('mousedown',    startDrag);
  dot.addEventListener('touchstart',   startDrag, { passive: false });
  window.addEventListener('mousemove', moveDrag);
  window.addEventListener('touchmove', moveDrag, { passive: false });
  window.addEventListener('mouseup',   endDrag);
  window.addEventListener('touchend',  endDrag);
  window.addEventListener('touchcancel', endDrag);

  // ─── Obstacles (title bboxes the dot bounces off / smashes) ───
  // .hero-name and .cat-link .label are *smashable* — at SMASH_VN
  // of normal velocity, the ball punches a letter loose instead of
  // bouncing. Other titles (index rows, footer mark) just bounce.
  const OBSTACLE_SELECTORS = [
    '.hero-name',
    '.index-row .name',
    '.cat-link .label',
    '.footer-mark',
  ].join(', ');
  const SMASHABLE_SELECTOR = '.hero-name, .cat-link .label';

  function updateObstacles() {
    if (!free) return;
    const w = window.innerWidth, h = window.innerHeight;
    obstacles = [];
    document.querySelectorAll(OBSTACLE_SELECTORS).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right < 0 || r.left > w || r.bottom < 0 || r.top > h) return;
      obstacles.push({
        left: r.left, top: r.top, right: r.right, bottom: r.bottom,
        smashable: el.matches(SMASHABLE_SELECTOR),
      });
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

  // ─── Return to TRES ───────────────────────────────────────────
  // Reads the EXACT captive position (where CSS would put the dot)
  // by briefly cloning the dot into its captive state, measuring the
  // clone, and removing it. Math'd approximations off by a dot-width
  // were causing a visible snap at the end of the animation when CSS
  // took back over.
  function getCaptiveHome() {
    const clone = dot.cloneNode(false);
    clone.removeAttribute('style');
    clone.removeAttribute('data-hover');
    clone.className = 'y-dot is-visible';
    clone.style.visibility = 'hidden';
    heroName.appendChild(clone);
    const r = clone.getBoundingClientRect();
    clone.remove();
    return { x: r.left, y: r.top };
  }

  function returnHome() {
    if (returning) return;
    returning = true;
    const startX = pos.x;
    const startY = pos.y;
    const startTime = performance.now();
    // Slow + buttery. Independent of letters — each letter manages its
    // own return on its own 3s idle clock, so the ball returning home
    // no longer triggers a synchronized snap of everything.
    const DURATION = 2000;

    const home    = getCaptiveHome();
    const targetX = home.x;
    const targetY = home.y;

    function step(now) {
      const t = Math.min(1, (now - startTime) / DURATION);
      // easeInOutCubic — matches the letters' return curve
      const eased = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      pos.x = startX + (targetX - startX) * eased;
      pos.y = startY + (targetY - startY) * eased;
      dot.style.left = pos.x + 'px';
      dot.style.top  = pos.y + 'px';
      if (t < 1) requestAnimationFrame(step);
      else finishReturn();
    }
    requestAnimationFrame(step);
  }

  function finishReturn() {
    free = false;
    returning = false;
    dragging = false;
    vel.x = vel.y = 0;
    obstacles = [];
    idleStart = 0;
    dot.classList.remove('y-dot--free', 'y-dot--grabbing');
    dot.style.cssText = '';
    visible = false;
    setVisibility(shouldBeVisible());
    // Stop feeding the flow field — the ball isn't a reactor anymore
    if (window.FlowField) window.FlowField.clearExtraPoint();
    // Each loose letter has its own idle timer — they glide home
    // independently on their own schedule. The ball returning isn't a
    // group reset trigger anymore.
  }

  // ─── Main loop ────────────────────────────────────────────────
  function tick() {
    if (!free || returning) return;

    if (dragging) {
      // Lag-follow toward cursor target. The per-frame position delta
      // IS the velocity (no separate sampling needed) — so a fast
      // cursor produces a heavy thrown ball, a slow drag produces a
      // gentle release.
      const newX = pos.x + (drag.targetX - pos.x) * DRAG_LAG;
      const newY = pos.y + (drag.targetY - pos.y) * DRAG_LAG;
      vel.x = newX - pos.x;
      vel.y = newY - pos.y;
      pos.x = newX;
      pos.y = newY;
      idleStart = 0;
    } else {
      // ── Free physics ──────────────────────────────────────────
      vel.x *= DAMPING;
      vel.y *= DAMPING;
      pos.x += vel.x;
      pos.y += vel.y;

      const r = radius();
      let cx = pos.x + r, cy = pos.y + r;
      const w = window.innerWidth, h = window.innerHeight;

      // Viewport edges (with safe-area insets on touch devices)
      if (cx - r < SAFE_SIDE)       { cx = r + SAFE_SIDE;       vel.x = -vel.x * RESTITUTION; }
      if (cx + r > w - SAFE_SIDE)   { cx = w - r - SAFE_SIDE;   vel.x = -vel.x * RESTITUTION; }
      if (cy - r < 0)               { cy = r;                   vel.y = -vel.y * RESTITUTION; }
      if (cy + r > h - SAFE_BOTTOM) { cy = h - r - SAFE_BOTTOM; vel.y = -vel.y * RESTITUTION; }

      // Title obstacles — elastic billiards collision against
      // smashables at speed, normal wall-bounce otherwise.
      for (let i = 0; i < obstacles.length; i++) {
        const ob = obstacles[i];
        const hit = collideRect(cx, cy, r, ob);
        if (!hit) continue;

        if (ob.smashable && window.Letters) {
          // Project ball velocity onto the collision normal (n points
          // from the rect outward toward the ball). Negative v_n means
          // the ball is moving INTO the letter.
          const v_n = vel.x * hit.nx + vel.y * hit.ny;
          if (v_n < -SMASH_VN) {
            const letter = window.Letters.findHit(cx, cy);
            if (letter) {
              // Ball: normal component scales by BALL_FACTOR. Tangential
              // is untouched, so glancing blows still slide past.
              const new_vn = BALL_FACTOR * v_n;
              const dv_n   = new_vn - v_n;
              vel.x += dv_n * hit.nx;
              vel.y += dv_n * hit.ny;
              // Letter: gets the LETTER_FACTOR share of normal velocity
              // in the ball's direction of travel (-n direction since
              // v_n is negative).
              const letter_vn = LETTER_FACTOR * v_n;
              window.Letters.smash(letter, letter_vn * hit.nx, letter_vn * hit.ny);
              // Push the ball clear of the rect so it doesn't immediately
              // re-collide on the next frame.
              cx += hit.nx * (hit.overlap + 1);
              cy += hit.ny * (hit.overlap + 1);
              continue;
            }
          }
        }

        // Normal wall-style bounce (low velocity or non-smashable rect)
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

      // Idle auto-return
      const speedNow = Math.hypot(vel.x, vel.y);
      if (speedNow < IDLE_VEL_THRESHOLD) {
        if (idleStart === 0) idleStart = performance.now();
        else if (performance.now() - idleStart > IDLE_RETURN_MS) {
          returnHome();
        }
      } else {
        idleStart = 0;
      }
    }

    // Feed the flow field — fires whether dragging or in free physics
    // so the field's reaction to the ball holds the whole time it's free.
    if (window.FlowField) {
      const rr = radius();
      window.FlowField.setExtraPoint(pos.x + rr, pos.y + rr);
    }

    dot.style.left = pos.x + 'px';
    dot.style.top  = pos.y + 'px';
    requestAnimationFrame(tick);
  }
})();
