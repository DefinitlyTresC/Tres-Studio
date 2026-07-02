// ═══════════════════════════════════════════════════════════════
// letters.js — interactive letter playground
//
// TRES letters drift around in 2D like the yellow dot — zero
// gravity, light damping, bouncing off the four viewport walls.
// Each letter has its own state machine and its own idle clock,
// so individual letters tidy themselves up without any reset
// button. Cat-link labels are smashable by the ball but aren't
// individually draggable (clicks still bubble to the parent <a>
// for navigation).
//
// Per-letter state machine:
//   captive    visible inside the word, grabbable (cursor: grab)
//   dragging   chunk follows pointer with cursor-trail lag
//   free       chunk has 2D drift physics — damping + wall bounces
//   paused     speed dropped below threshold for IDLE_TO_PAUSE_MS,
//               vel forced to zero so you SEE it stop before glide
//   returning  eased glide back to original slot, no collisions
//
// Triggers for the return path:
//   • per-letter idle timer (3s low speed → pause → glide)
//   • Letters.returnAllHome()  — called by dot.js when ball returns
//   • Letters.restoreAll()     — instant restore (past-hero cleanup)
//
// Public API (window.Letters):
//   wrap(el, opts)          wrap an element's text into .letter spans
//                           (opts.draggable enables per-letter grab)
//   wrapAll()               wrap every known smashable on the page
//   findHit(x, y)           return intact .letter at (x,y) or null
//                           (used by dot.js for ball-letter collision)
//   smash(letter, vx, vy)   kick a letter loose with initial velocity
//   returnAllHome()         start glide-home on every free/paused chunk
//   restoreAll()            instant restore + clear all chunks
//   isAnySmashed()          boolean
// ═══════════════════════════════════════════════════════════════
window.Letters = (() => {
  // ─── Tuning ──────────────────────────────────────────────────
  // Zero gravity — letters drift instead of fall. Damping pulls
  // them to rest eventually. Wall bounces lose some energy too so
  // a fast-flung letter doesn't bounce forever.
  const AIR_DRAG       = 0.988;     // velocity *= this each frame
  const ANGULAR_DRAG   = 0.985;
  const WALL_BOUNCE    = 0.65;
  const DRAG_LAG       = 0.15;      // lower = laggier follow
  const MAX_VEL        = 30;

  // Auto-return timing.
  // free → paused: speed must stay below LOW_SPEED for IDLE_TO_PAUSE_MS
  // paused → returning: brief visible stillness, then start gliding
  // returning → captive: eased glide over RETURN_MS
  const LOW_SPEED          = 0.5;
  const IDLE_TO_PAUSE_MS   = 3000;
  const PAUSE_HOLD_MS      = 400;
  const RETURN_MS          = 1800;

  const CLICK_MOVE         = 5;     // pointer moved < this = click, not drag

  // ─── Letter wrapping ─────────────────────────────────────────
  function wrap(el, opts) {
    if (!el || el.dataset.lettersWrapped) return;
    opts = opts || {};
    const draggable = !!opts.draggable;
    const textNodes = [];
    el.childNodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) textNodes.push(n);
    });
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const frag = document.createDocumentFragment();
      for (const ch of text) {
        if (ch === ' ') {
          frag.appendChild(document.createTextNode(' '));
        } else {
          const span = document.createElement('span');
          span.className = 'letter';
          span.textContent = ch;
          if (draggable) attachLetterGrab(span);
          frag.appendChild(span);
        }
      }
      textNode.replaceWith(frag);
    });
    el.dataset.lettersWrapped = '1';
  }

  function wrapAll() {
    document.querySelectorAll('.hero-name').forEach(el => wrap(el, { draggable: true }));
    document.querySelectorAll('.cat-link .label').forEach(el => wrap(el, { draggable: false }));
  }
  // Category tiles render after a Sheet fetch — re-wrap when they appear.
  // Uses the shared DOM mutation batcher in scroll.js (fires once per rAF
  // across all subscribers, instead of every module opening its own observer).
  if (window.DOMBatch) {
    DOMBatch.onMutate(wrapAll);
  } else {
    wrapAll();
  }

  // ─── Hit testing (used by dot.js for ball-letter collision) ──
  function findHit(x, y) {
    const letters = document.querySelectorAll(
      '.hero-name .letter:not(.smashed), .cat-link .label .letter:not(.smashed)'
    );
    for (const letter of letters) {
      const r = letter.getBoundingClientRect();
      if (x >= r.left - 6 && x <= r.right + 6 &&
          y >= r.top  - 6 && y <= r.bottom + 6) {
        return letter;
      }
    }
    return null;
  }

  // ─── Chunks (one per smashed letter) ─────────────────────────
  const chunks = [];
  let running = false;

  function startLoop() {
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  }

  // ─── Smash: clone letter into a chunk, hide original, push state
  function smash(letter, vx, vy) {
    if (!letter || letter.classList.contains('smashed')) return null;
    letter.classList.add('smashed');
    const r  = letter.getBoundingClientRect();
    const cs = window.getComputedStyle(letter);

    const chunk = document.createElement('span');
    chunk.className = 'letter-chunk';
    chunk.textContent = letter.textContent;
    chunk.style.left          = r.left + 'px';
    chunk.style.top           = r.top  + 'px';
    chunk.style.width         = r.width + 'px';
    chunk.style.height        = r.height + 'px';
    chunk.style.fontFamily    = cs.fontFamily;
    chunk.style.fontSize      = cs.fontSize;
    chunk.style.fontWeight    = cs.fontWeight;
    chunk.style.letterSpacing = cs.letterSpacing;
    chunk.style.lineHeight    = cs.lineHeight;
    chunk.style.color         = cs.color;
    chunk.style.textTransform = cs.textTransform;
    document.body.appendChild(chunk);

    const c = {
      el: chunk,
      origLetter: letter,
      origLeft: r.left, origTop: r.top,
      x: r.left, y: r.top,
      // Tiny scatter so multiple letters from one impact don't lockstep
      vx: (vx || 0) + (Math.random() - 0.5) * 1.0,
      vy: (vy || 0) + (Math.random() - 0.5) * 1.0,
      angle: 0,
      angularVel: (Math.random() - 0.5) * 0.12,
      width: r.width, height: r.height,
      state: 'free',
      lowSpeedStart: 0,
      pauseStart: 0,
      drag: null,
      returnStart: 0, returnFromX: 0, returnFromY: 0, returnFromAngle: 0,
      returnToX: 0, returnToY: 0,
    };
    chunks.push(c);

    attachChunkGrab(c);
    startLoop();
    return c;
  }

  // ─── Grab handlers ───────────────────────────────────────────
  function attachLetterGrab(letter) {
    letter.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const c = smash(letter, 0, 0);
      if (c) startChunkDrag(c, e.clientX, e.clientY, e.pointerId);
    });
  }
  function attachChunkGrab(c) {
    c.el.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      startChunkDrag(c, e.clientX, e.clientY, e.pointerId);
    });
  }
  function startChunkDrag(c, clientX, clientY, pointerId) {
    c.state = 'dragging';
    c.lowSpeedStart = 0;
    c.pauseStart = 0;
    c.el.classList.add('dragging');
    c.drag = {
      pointerId: pointerId,
      offsetX: clientX - c.x,
      offsetY: clientY - c.y,
      targetX: c.x,
      targetY: c.y,
      grabbedAtX: clientX,
      grabbedAtY: clientY,
    };
    startLoop();
  }

  // ─── Window-level pointer tracking ───────────────────────────
  // Drag survives the pointer leaving the chunk's bounding box.
  // Multi-touch supported via pointerId match.
  window.addEventListener('pointermove', (e) => {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      if (c.state === 'dragging' && c.drag && c.drag.pointerId === e.pointerId) {
        c.drag.targetX = e.clientX - c.drag.offsetX;
        c.drag.targetY = e.clientY - c.drag.offsetY;
      }
    }
  });
  function releaseDrag(e) {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      if (c.state !== 'dragging') continue;
      if (!c.drag || c.drag.pointerId !== e.pointerId) continue;
      const movedPx = Math.hypot(e.clientX - c.drag.grabbedAtX, e.clientY - c.drag.grabbedAtY);
      if (movedPx < CLICK_MOVE) {
        // Click — restore the letter so accidental clicks don't leave
        // half-detached chunks behind.
        c.origLetter.classList.remove('smashed');
        c.el.remove();
        chunks.splice(i, 1);
        i--;
        continue;
      }
      // Drag release — velocity is whatever the lag-follow built up
      c.state = 'free';
      c.el.classList.remove('dragging');
      c.vx = Math.max(-MAX_VEL, Math.min(MAX_VEL, c.vx));
      c.vy = Math.max(-MAX_VEL, Math.min(MAX_VEL, c.vy));
      c.drag = null;
    }
  }
  window.addEventListener('pointerup',     releaseDrag);
  window.addEventListener('pointercancel', releaseDrag);

  // ─── Per-chunk return-home ───────────────────────────────────
  function startReturn(c) {
    c.state            = 'returning';
    c.returnStart      = performance.now();
    c.returnFromX      = c.x;
    c.returnFromY      = c.y;
    c.returnFromAngle  = c.angle;
    // Read live so a window resize between smash + return sends the
    // chunk to the right slot.
    const r = c.origLetter.getBoundingClientRect();
    c.returnToX = r.left;
    c.returnToY = r.top;
  }
  function finishReturn(c) {
    c.origLetter.classList.remove('smashed');
    c.el.remove();
    const i = chunks.indexOf(c);
    if (i >= 0) chunks.splice(i, 1);
  }

  function applyTransform(c) {
    c.el.style.transform =
      `translate(${c.x - c.origLeft}px, ${c.y - c.origTop}px) rotate(${c.angle}rad)`;
  }

  // ─── Main loop ───────────────────────────────────────────────
  function loop() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = performance.now();
    let alive = 0;

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];

      // ── Dragging — cursor-trail lag follow
      if (c.state === 'dragging') {
        alive++;
        const newX = c.x + (c.drag.targetX - c.x) * DRAG_LAG;
        const newY = c.y + (c.drag.targetY - c.y) * DRAG_LAG;
        c.vx = newX - c.x;
        c.vy = newY - c.y;
        c.x = newX;
        c.y = newY;
        applyTransform(c);
        continue;
      }

      // ── Paused — visible stillness before the return
      if (c.state === 'paused') {
        alive++;
        // Don't redraw — position frozen. After PAUSE_HOLD_MS, glide.
        if (now - c.pauseStart > PAUSE_HOLD_MS) {
          startReturn(c);
        }
        continue;
      }

      // ── Returning — eased glide back to original slot
      if (c.state === 'returning') {
        alive++;
        const t = Math.min(1, (now - c.returnStart) / RETURN_MS);
        // easeInOutCubic — gentle release, smooth middle, soft landing
        const eased = t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
        c.x     = c.returnFromX     + (c.returnToX - c.returnFromX) * eased;
        c.y     = c.returnFromY     + (c.returnToY - c.returnFromY) * eased;
        c.angle = c.returnFromAngle * (1 - eased);
        applyTransform(c);
        if (t >= 1) {
          finishReturn(c);
          i--;
        }
        continue;
      }

      // ── Free — 2D drift, no gravity
      alive++;
      c.vx *= AIR_DRAG;
      c.vy *= AIR_DRAG;
      c.x  += c.vx;
      c.y  += c.vy;
      c.angle      += c.angularVel;
      c.angularVel *= ANGULAR_DRAG;

      // All four viewport walls
      if (c.x < 0)              { c.x = 0;            c.vx = -c.vx * WALL_BOUNCE; }
      if (c.x + c.width > w)    { c.x = w - c.width;  c.vx = -c.vx * WALL_BOUNCE; }
      if (c.y < 0)              { c.y = 0;            c.vy = -c.vy * WALL_BOUNCE; }
      if (c.y + c.height > h)   { c.y = h - c.height; c.vy = -c.vy * WALL_BOUNCE; }

      // Idle clock — sustained low speed transitions to 'paused'
      const speed = Math.hypot(c.vx, c.vy);
      if (speed < LOW_SPEED) {
        if (c.lowSpeedStart === 0) c.lowSpeedStart = now;
        else if (now - c.lowSpeedStart > IDLE_TO_PAUSE_MS) {
          c.state = 'paused';
          c.pauseStart = now;
          c.vx = 0; c.vy = 0;
          c.angularVel = 0;
        }
      } else {
        c.lowSpeedStart = 0;
      }

      applyTransform(c);
    }

    // ── Chunk-chunk collision (free state only) ──
    // Letters bump into each other while floating, but pass through
    // each other in any other state — dragging, returning, paused all
    // skip collision so the user-controlled / cinematic motion stays
    // smooth. Circular approximation per chunk (radius = (w+h)/4).
    for (let i = 0; i < chunks.length; i++) {
      const a = chunks[i];
      if (a.state !== 'free') continue;
      const aR  = (a.width + a.height) * 0.25;
      const acx = a.x + a.width  * 0.5;
      const acy = a.y + a.height * 0.5;
      for (let j = i + 1; j < chunks.length; j++) {
        const b = chunks[j];
        if (b.state !== 'free') continue;
        const bR  = (b.width + b.height) * 0.25;
        const bcx = b.x + b.width  * 0.5;
        const bcy = b.y + b.height * 0.5;
        const dx = bcx - acx;
        const dy = bcy - acy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = aR + bR;
        if (dist < minDist && dist > 0.0001) {
          const nx = dx / dist, ny = dy / dist;
          const overlap = minDist - dist;
          const half = overlap * 0.5;
          a.x -= nx * half; a.y -= ny * half;
          b.x += nx * half; b.y += ny * half;
          // Equal-mass elastic impulse along the collision normal
          const va_n = a.vx * nx + a.vy * ny;
          const vb_n = b.vx * nx + b.vy * ny;
          const approach = va_n - vb_n;
          if (approach > 0) {
            const E = 0.85; // restitution
            const impulse = -(1 + E) * 0.5 * approach;
            a.vx += impulse * nx; a.vy += impulse * ny;
            b.vx -= impulse * nx; b.vy -= impulse * ny;
          }
          applyTransform(a);
          applyTransform(b);
        }
      }
    }

    if (alive > 0) {
      requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }

  // ─── Cinematic group return (ball-triggered) ─────────────────
  // dot.js calls this when the ball glides home — every loose chunk
  // starts its own return glide at the same time.
  function returnAllHome() {
    chunks.forEach(c => {
      if (c.state === 'dragging' || c.state === 'returning') return;
      startReturn(c);
    });
  }

  // ─── Instant restore (past-hero scroll cleanup) ──────────────
  // Used only when we need every chunk gone immediately — e.g. the
  // user has scrolled past the hero so animating the cleanup would
  // just float chunks across the viewport during the scroll.
  function restoreAll() {
    chunks.forEach(c => {
      c.origLetter.classList.remove('smashed');
      c.el.remove();
    });
    chunks.length = 0;
  }

  function isAnySmashed() { return chunks.length > 0; }

  return { wrap, wrapAll, findHit, smash, returnAllHome, restoreAll, isAnySmashed };
})();
