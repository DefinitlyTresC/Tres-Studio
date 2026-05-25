// ═══════════════════════════════════════════════════════════════
// hammer.js — minimalist grabbable hammer + smashable letters
//
// Pairs with the homepage. On load:
//   • Wraps every character of .hero-name and .cat-link .label in
//     a <span class="letter"> so individual letters can be targeted.
//   • Drops a small SVG hammer in the lower-right of the viewport.
//
// Interaction:
//   • Mousedown / touch on the hammer → it lifts and follows the
//     pointer. While moving, the head rotates toward the direction
//     of travel so it visually "swings."
//   • The hammer head's bounding rect is checked against each
//     wrapped letter on every frame. First overlap with sufficient
//     swing velocity smashes that letter:
//       – Original span gets visibility:hidden (layout stays put).
//       – A position:fixed clone takes its place, inherits the same
//         computed font styles, then falls under gravity with a
//         random spin. Bounces once at the viewport floor and
//         settles into a pile.
//   • Each letter only smashes once per "session." Hitting an
//     already-smashed letter is a no-op.
//
// Reset:
//   • A small "RESET" button fades in after the first smash.
//   • Click it: every cloned chunk is removed and every original
//     letter goes back to visibility:visible. Counter resets.
//
// Scope note: this is per-letter destruction, not 3D voronoi
// fracture. Each letter falls as a single rigid chunk. Spirit of
// the request without the 3D rendering complexity — extending to
// chunk-per-letter is feasible later.
// ═══════════════════════════════════════════════════════════════
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // ─── Smashable letter wrapping ────────────────────────────────
  const SMASH_SELECTORS = ['.hero-name', '.cat-link .label'];

  function wrapLetters(el) {
    if (el.dataset.lettersWrapped) return;
    // Collect text nodes only (skip the .y-dot child inside .hero-name)
    const textNodes = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) textNodes.push(n);
    });
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const frag = document.createDocumentFragment();
      for (const ch of text) {
        if (ch === ' ') {
          // Keep spaces as-is — wrapping them would create unsmashable gaps
          frag.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.className = 'letter';
          span.textContent = ch;
          frag.appendChild(span);
        }
      }
      textNode.replaceWith(frag);
    });
    el.dataset.lettersWrapped = '1';
  }

  function wrapAll() {
    SMASH_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(wrapLetters);
    });
  }

  // Initial wrap, then re-wrap whenever new smashables show up
  // (category labels are rendered dynamically by index.html's IIFE).
  wrapAll();
  new MutationObserver(wrapAll).observe(document.body, {
    childList: true, subtree: true,
  });

  // ─── Hammer element ───────────────────────────────────────────
  const hammer = document.createElement('div');
  hammer.className = 'hammer';
  hammer.innerHTML = `
    <svg viewBox="0 0 60 80" class="hammer-svg" aria-hidden="true">
      <!-- Two outlined rectangles forming a T. No fills, no shadow,
           no detail — reads as a hammer purely from silhouette. -->
      <rect x="28" y="22" width="4" height="54" fill="none"
            stroke="#0A0A0A" stroke-width="1.8"/>
      <rect x="9"  y="9"  width="42" height="14" fill="none"
            stroke="#0A0A0A" stroke-width="1.8"/>
    </svg>
  `;
  document.body.appendChild(hammer);
  hammer.setAttribute('data-hover', '');

  // Reset button — created up front, only shown after first smash
  const reset = document.createElement('button');
  reset.className = 'hammer-reset';
  reset.type = 'button';
  reset.textContent = 'Reset';
  reset.setAttribute('data-hover', '');
  document.body.appendChild(reset);

  // ─── State ────────────────────────────────────────────────────
  let dragging = false;
  let posX = 0, posY = 0;          // hammer center (viewport coords)
  let lastX = 0, lastY = 0;        // previous frame, for swing velocity
  let velX = 0, velY = 0;
  let angle = 0;                   // current handle rotation (radians)
  let dragOffsetX = 0, dragOffsetY = 0;
  let restPosX = 0, restPosY = 0;  // resting corner
  const chunks = [];               // active falling letter clones

  function placeAtRest() {
    restPosX = window.innerWidth - 70;
    restPosY = window.innerHeight - 90;
    posX = restPosX;
    posY = restPosY;
    angle = 0.18;   // small lean for a leaning-against-the-wall look
    paint();
  }

  function paint() {
    hammer.style.transform =
      `translate(${posX - 30}px, ${posY - 40}px) rotate(${angle}rad)`;
  }

  placeAtRest();
  window.addEventListener('resize', () => {
    if (!dragging) placeAtRest();
  });

  // ─── Drag handlers ────────────────────────────────────────────
  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    const p = (e.touches && e.touches[0]) || e;
    dragging = true;
    hammer.classList.add('hammer--grabbing');
    dragOffsetX = p.clientX - posX;
    dragOffsetY = p.clientY - posY;
    lastX = posX; lastY = posY;
    velX = 0; velY = 0;
  }

  function moveDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    const p = (e.touches && e.touches[0]) || e;
    posX = p.clientX - dragOffsetX;
    posY = p.clientY - dragOffsetY;
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    hammer.classList.remove('hammer--grabbing');
    // Snap back to rest. CSS transition handles the easing.
    hammer.classList.add('hammer--resting');
    posX = restPosX;
    posY = restPosY;
    angle = 0.18;
    paint();
    setTimeout(() => hammer.classList.remove('hammer--resting'), 600);
  }

  hammer.addEventListener('mousedown',   startDrag);
  hammer.addEventListener('touchstart',  startDrag, { passive: false });
  window.addEventListener('mousemove',  moveDrag);
  window.addEventListener('touchmove',  moveDrag, { passive: false });
  window.addEventListener('mouseup',    endDrag);
  window.addEventListener('touchend',   endDrag);
  window.addEventListener('touchcancel', endDrag);

  // ─── Hammer head position (where the smash happens) ───────────
  // SVG viewBox 60×80, head center sits around (30, 20). With the
  // hammer rotated by `angle` around its center (30, 40), the head's
  // world position is offset from posX/posY by (0, -20) rotated.
  function headPosition() {
    const dx = 0, dy = -20;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return {
      x: posX + dx * cos - dy * sin,
      y: posY + dx * sin + dy * cos,
    };
  }

  // ─── Per-frame: update velocity, rotate hammer, check smashes ─
  function frame() {
    if (dragging) {
      velX = posX - lastX;
      velY = posY - lastY;
      lastX = posX;
      lastY = posY;
      // Rotate so the head leads in the direction of motion. Use
      // velocity vector if moving, otherwise drift toward resting tilt.
      const speed = Math.hypot(velX, velY);
      if (speed > 1) {
        // Movement vector points where the head should go (= up after rotation)
        // So angle = atan2(vx, -vy)  (head's "up" is (0,-1) in local space)
        const targetAngle = Math.atan2(velX, -velY);
        // Smoothly approach the target angle, choosing the short way around
        let diff = targetAngle - angle;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        angle += diff * 0.35;
      }
      paint();

      // Detect smash on swing — speed gate prevents accidental
      // smashes from slow drags. Tunable; ~6 felt right in testing.
      if (speed > 6) tryHit();
    }
    updateChunks();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ─── Smash logic ──────────────────────────────────────────────
  function tryHit() {
    const head = headPosition();
    const letters = document.querySelectorAll(
      '.hero-name .letter:not(.smashed), .cat-link .label .letter:not(.smashed)'
    );
    for (const letter of letters) {
      const r = letter.getBoundingClientRect();
      // Generous hit-zone: the head needs to overlap the letter, but a
      // few px slack helps the swing feel responsive vs. needing pixel
      // accuracy on a moving target.
      if (head.x > r.left - 6 && head.x < r.right + 6 &&
          head.y > r.top  - 6 && head.y < r.bottom + 6) {
        smash(letter);
        // One smash per swing — break out so a single swing doesn't
        // demolish three letters at once.
        return;
      }
    }
  }

  function smash(letter) {
    letter.classList.add('smashed');
    const r = letter.getBoundingClientRect();
    const cs = window.getComputedStyle(letter);

    // Create the falling clone
    const chunk = document.createElement('span');
    chunk.className = 'letter-chunk';
    chunk.textContent = letter.textContent;
    chunk.style.left   = r.left + 'px';
    chunk.style.top    = r.top  + 'px';
    chunk.style.width  = r.width + 'px';
    chunk.style.height = r.height + 'px';
    chunk.style.fontFamily   = cs.fontFamily;
    chunk.style.fontSize     = cs.fontSize;
    chunk.style.fontWeight   = cs.fontWeight;
    chunk.style.letterSpacing = cs.letterSpacing;
    chunk.style.lineHeight   = cs.lineHeight;
    chunk.style.color        = cs.color;
    chunk.style.textTransform = cs.textTransform;
    document.body.appendChild(chunk);

    // Physics state for this chunk. Initial velocity inherits a bit
    // of the hammer's swing, plus a small randomized scatter so two
    // letters from the same swing don't fly in lockstep.
    chunks.push({
      el: chunk,
      x: r.left, y: r.top,
      vx: velX * 0.7 + (Math.random() - 0.5) * 4,
      vy: velY * 0.7 - (3 + Math.random() * 3),
      angle: 0,
      angularVel: (Math.random() - 0.5) * 0.35,
      width: r.width, height: r.height,
      resting: false,
    });

    if (!reset.classList.contains('visible')) {
      reset.classList.add('visible');
    }
  }

  // ─── Per-frame chunk physics ──────────────────────────────────
  // Custom (not Matter.js) because we only need 1-axis floor bounces
  // and individual chunks don't collide with each other. Cheap and
  // deterministic. Each chunk integrates position + rotation, bounces
  // once at the floor, then settles.
  const GRAVITY = 0.55;
  const AIR_DRAG = 0.992;
  const FLOOR_BOUNCE = 0.42;
  const FLOOR_FRICTION = 0.75;

  function updateChunks() {
    const h = window.innerHeight;
    for (const c of chunks) {
      if (c.resting) continue;
      c.vy += GRAVITY;
      c.vx *= AIR_DRAG;
      c.vy *= AIR_DRAG;
      c.x += c.vx;
      c.y += c.vy;
      c.angle += c.angularVel;
      c.angularVel *= 0.985;

      // Floor (bottom of viewport)
      const floor = h - c.height;
      if (c.y > floor) {
        c.y = floor;
        if (Math.abs(c.vy) < 1.5) {
          // Settled: stop integrating
          c.vy = 0; c.vx *= FLOOR_FRICTION; c.angularVel *= 0.6;
          if (Math.abs(c.vx) < 0.3 && Math.abs(c.angularVel) < 0.01) {
            c.resting = true;
          }
        } else {
          c.vy = -c.vy * FLOOR_BOUNCE;
          c.vx *= FLOOR_FRICTION;
        }
      }

      // Side walls — bounce inside the viewport
      if (c.x < 0) { c.x = 0; c.vx = -c.vx * 0.5; }
      if (c.x + c.width > window.innerWidth) {
        c.x = window.innerWidth - c.width; c.vx = -c.vx * 0.5;
      }

      c.el.style.transform =
        `translate(${c.x - parseFloat(c.el.style.left)}px, ` +
        `${c.y - parseFloat(c.el.style.top)}px) rotate(${c.angle}rad)`;
    }
  }

  // ─── Reset ────────────────────────────────────────────────────
  reset.addEventListener('click', () => {
    // Restore all hidden letters
    document.querySelectorAll('.letter.smashed').forEach(el => {
      el.classList.remove('smashed');
    });
    // Remove falling clones
    chunks.forEach(c => c.el.remove());
    chunks.length = 0;
    reset.classList.remove('visible');
  });
})();
