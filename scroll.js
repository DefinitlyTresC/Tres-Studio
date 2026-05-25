// ════════════════════════════════════════════════════════════════
// scroll.js — Lenis + cursor + reveals + transitions + gallery
//
// Each section is wrapped in try/catch so one failure doesn't kill
// the others. Sections, in order:
//   1. Page transition (soft horizontal swipe)
//   2. Lenis smooth scroll
//   3. Custom liquid cursor
//   4. Reveal-on-scroll observer
//   5. Index hover-preview tracker
//   6. Subtle scroll-tilt on project tiles
//   7. Gallery jello-zoom + lightbox
// ════════════════════════════════════════════════════════════════


// ── 1. Page transition ─────────────────────────────────────────
// Soft off-white panel slides in from the left to cover the page,
// then on the next page it slides off to the right.
(function initPageTransition() {
  try {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    document.body.appendChild(overlay);

    // Entering a page after a click → snap covered, then slide off right
    if (sessionStorage.getItem('pt')) {
      sessionStorage.removeItem('pt');
      overlay.style.transition = 'none';
      overlay.style.transform = 'translateX(0%)';
      overlay.offsetHeight;                                // force reflow
      overlay.style.transition = '';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.classList.add('revealing');
          overlay.style.transform = 'translateX(100%)';
        });
      });
      setTimeout(() => {
        overlay.classList.remove('revealing');
        overlay.style.transition = 'none';
        overlay.style.transform = 'translateX(-100%)';
        overlay.offsetHeight;
        overlay.style.transition = '';
      }, 900);
    }

    // Clicking an internal link → slide overlay in, then navigate
    let inTransition = false;
    document.addEventListener('click', (e) => {
      if (inTransition) { e.preventDefault(); return; }
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href ||
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          href.startsWith('#') ||
          link.target === '_blank' ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      e.preventDefault();
      inTransition = true;

      // Freeze Lenis so its momentum doesn't fight the overlay animation.
      // This is the single biggest factor in making the transition feel as
      // smooth on content pages as it does on the lab page.
      if (typeof lenis !== 'undefined' && lenis) lenis.stop();

      const target = e.target.closest(
        '.proj-item, .cat-link, .index-row, .nav-links a, .mark, .detail-back, .footer a, .about-actions a'
      );
      if (target) target.classList.add('pt-pressed');

      sessionStorage.setItem('pt', '1');

      overlay.style.transition = 'none';
      overlay.style.transform = 'translateX(-100%)';
      overlay.offsetHeight;
      overlay.style.transition = '';

      overlay.classList.add('covering');
      document.body.classList.add('pt-locking');
      requestAnimationFrame(() => {
        overlay.style.transform = 'translateX(0%)';
      });

      setTimeout(() => { window.location.href = href; }, 580);
    }, true);

    // Back/forward via bfcache → reset overlay AND closure state
    // On iOS, the page is restored with `inTransition=true` and Lenis stopped,
    // which leaves the page unclickable + unscrollable until refresh. Reset both.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        overlay.classList.remove('covering', 'revealing');
        overlay.style.transition = 'none';
        overlay.style.transform = 'translateX(-100%)';
        overlay.offsetHeight;
        overlay.style.transition = '';
        document.body.classList.remove('pt-locking');
        document.querySelectorAll('.pt-pressed').forEach(el => el.classList.remove('pt-pressed'));
        sessionStorage.removeItem('pt');
        inTransition = false;
        if (typeof lenis !== 'undefined' && lenis) lenis.start();
      }
    });
  } catch (err) {
    console.error('Page transition init failed:', err);
  }
})();


// ── 2. Lenis smooth scroll ─────────────────────────────────────
let lenis = null;
try {
  if (typeof Lenis !== 'undefined') {
    const isTouch = !window.matchMedia('(hover: hover)').matches;
    lenis = new Lenis({
      duration: 1.3,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !isTouch,
      smoothTouch: false,
      syncTouch: false,
      lerp: isTouch ? 0.1 : 0.085,
    });
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })();

    // Anchor links → smooth-scroll via Lenis
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.5 });
      }
    });
  }
} catch (e) { console.error('Lenis init failed:', e); }


// ── 3. Liquid cursor with context labels (desktop only) ────────
// On hover the cursor expands to a yellow circle. For the major
// interactive surfaces (galleries, project rows, category tiles,
// draggables, back links, external links) the expanded cursor also
// gets a short label inside — "View", "Open", "Enter", "Grab", etc.
// Labels are chosen via LABEL_MAP, walking entries in order and
// stopping at the first match so more-specific selectors can be
// listed before generic ones.
try {
  if (window.matchMedia('(hover: hover)').matches) {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    const cursorLabel = document.createElement('span');
    cursorLabel.className = 'cursor-label';
    cursor.appendChild(cursorLabel);
    document.body.appendChild(cursor);

    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    document.body.appendChild(trail);

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let tx = mx, ty = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    (function trailLoop() {
      tx += (mx - tx) * 0.16;
      ty += (my - ty) * 0.16;
      trail.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
      requestAnimationFrame(trailLoop);
    })();

    // Order matters — first match wins. Put specific selectors first.
    const LABEL_MAP = [
      { selector: '.gallery-item',                            label: 'View' },
      { selector: '.proj-item, .index-row',                   label: 'Open' },
      { selector: '.cat-link',                                label: 'Enter' },
      { selector: '.ios-icon',                                label: 'Open' },
      { selector: '.lab-index-card--alt',                     label: 'Step' },
      { selector: '.lab-index-card',                          label: 'Enter' },
      { selector: '.hero-name .letter, .letter-chunk',        label: 'Grab' },
      { selector: '.hero-name .y-dot, .y-dot--free',          label: 'Grab' },
      { selector: '.detail-back, .back-link',                 label: 'Back' },
      { selector: 'a[target="_blank"]',                       label: '↗' },
      { selector: 'a[href^="mailto:"]',                       label: 'Email' },
    ];
    function labelFor(el) {
      for (let i = 0; i < LABEL_MAP.length; i++) {
        if (el.matches(LABEL_MAP[i].selector)) return LABEL_MAP[i].label;
      }
      return '';
    }

    const HOVERABLE = 'a, button, .index-row, .proj-item, .cat-link, .ios-icon, .hero-name .letter, .letter-chunk, [data-hover]';
    function bindHoverables() {
      document.querySelectorAll(HOVERABLE).forEach(el => {
        if (el._cb) return;
        el._cb = true;
        el.addEventListener('mouseenter', () => {
          cursor.classList.add('hover');
          trail.classList.add('hide');
          const text = labelFor(el);
          cursorLabel.textContent = text;
          cursor.classList.toggle('has-label', !!text);
        });
        el.addEventListener('mouseleave', () => {
          cursor.classList.remove('hover', 'has-label');
          trail.classList.remove('hide');
          // Defer clearing the text until the fade-out has settled, so
          // the label doesn't pop blank during the shrink animation.
          setTimeout(() => {
            if (!cursor.classList.contains('hover')) cursorLabel.textContent = '';
          }, 250);
        });
      });
    }
    bindHoverables();
    new MutationObserver(bindHoverables).observe(document.body, { childList: true, subtree: true });
  }
} catch (e) { console.error('Cursor init failed:', e); }


// ── 4. Reveal-on-scroll observer ───────────────────────────────
try {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  // Footer mark gets its OWN observer that toggles .in based on visibility,
  // so the slide-in animation re-plays every time you scroll back to the bottom
  // (instead of firing once and staying put like every other .reveal).
  const footerObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      e.target.classList.toggle('in', e.isIntersecting);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.footer-mark').forEach(el => {
    el.classList.add('reveal');
    footerObs.observe(el);
  });

  function bindReveals() {
    // Exclude .footer-mark — its own observer above handles it on a loop
    document.querySelectorAll('.reveal:not(.in):not(.footer-mark)').forEach(el => obs.observe(el));
  }
  bindReveals();
  new MutationObserver(bindReveals).observe(document.body, { childList: true, subtree: true });
} catch (e) { console.error('Reveal observer failed:', e); }


// ── 5. Index hover-preview tracking ────────────────────────────
try {
  document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.index-row:hover .preview').forEach(p => {
      p.style.left = (e.clientX + 30) + 'px';
      p.style.top = (e.clientY - 90) + 'px';
    });
  });
} catch (e) { console.error('Preview track failed:', e); }


// ── 6. Subtle scroll-tilt (project tiles only) ─────────────────
// Tiles get a gentle rotate/scale/fade as they cross the viewport.
// Text rows (.index-row) are NOT included — text tilted looks awkward.
// Values are intentionally light: this is atmosphere, not a feature.
try {
  const isLowPower = !window.matchMedia('(hover: hover)').matches || window.innerWidth < 768;

  const ROT_MAX = isLowPower ? 1.0  : 2.2;     // degrees
  const SCL_AMT = isLowPower ? 0.03 : 0.06;    // scale-down at edges
  const TY_AMT  = isLowPower ? 6    : 12;      // pixels translateY
  const OP_AMT  = isLowPower ? 0.08 : 0.18;    // opacity drop at edges

  const visible = new Set();

  const visObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        visible.add(e.target);
      } else {
        visible.delete(e.target);
        e.target.style.transform = '';
        e.target.style.opacity = '';
      }
    });
  }, { rootMargin: '40% 0px 40% 0px' });

  function bindTiles() {
    document.querySelectorAll('.proj-item').forEach(el => visObs.observe(el));
  }
  bindTiles();
  new MutationObserver(bindTiles).observe(document.body, { childList: true, subtree: true });

  let scheduled = false;
  function updateTilt() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const vh = window.innerHeight;
      const vMid = vh / 2;
      const denom = vh * 0.7;
      for (const el of visible) {
        const r = el.getBoundingClientRect();
        const elMid = r.top + r.height / 2;
        let d = (elMid - vMid) / denom;
        if (d < -1) d = -1; else if (d > 1) d = 1;
        const abs = d < 0 ? -d : d;
        el.style.transform =
          `translate3d(0, ${d * TY_AMT}px, 0) ` +
          `scale(${1 - abs * SCL_AMT}) ` +
          `rotate(${d * ROT_MAX}deg)`;
        el.style.opacity = 1 - abs * OP_AMT;
      }
    });
  }

  if (lenis) lenis.on('scroll', updateTilt);
  else window.addEventListener('scroll', updateTilt, { passive: true });
  window.addEventListener('resize', updateTilt);
  updateTilt();
} catch (e) { console.error('Scroll tilt failed:', e); }


// ── 7. Gallery jello-zoom + lightbox ───────────────────────────
try {
  const HAS_HOVER = window.matchMedia('(hover: hover)').matches;

  // Lightbox navigation arrows — injected lazily on first open so we don't
  // edit every HTML page that contains a gallery.
  let arrowsEl = null;
  function ensureArrows() {
    if (arrowsEl) return arrowsEl;
    arrowsEl = document.createElement('div');
    arrowsEl.className = 'lightbox-arrows';
    arrowsEl.innerHTML = `
      <button class="lightbox-arrow lightbox-arrow--prev" aria-label="Previous image" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button class="lightbox-arrow lightbox-arrow--next" aria-label="Next image" type="button">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    `;
    document.body.appendChild(arrowsEl);
    arrowsEl.querySelector('.lightbox-arrow--prev').addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(-1);
    });
    arrowsEl.querySelector('.lightbox-arrow--next').addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(1);
    });
    return arrowsEl;
  }

  function refreshArrowsVisibility() {
    const expanded = document.querySelector('.gallery-item.expanded');
    if (!expanded) {
      if (arrowsEl) arrowsEl.classList.remove('visible');
      return;
    }
    const gallery = expanded.closest('.gallery');
    if (!gallery) return;
    const itemCount = gallery.querySelectorAll('.gallery-item').length;
    // Only show arrows when there's more than one image to navigate to
    if (itemCount > 1) {
      ensureArrows().classList.add('visible');
    } else if (arrowsEl) {
      arrowsEl.classList.remove('visible');
    }
  }

  function navigateLightbox(delta) {
    const current = document.querySelector('.gallery-item.expanded');
    if (!current) return;
    const gallery = current.closest('.gallery');
    if (!gallery) return;
    const items = Array.from(gallery.querySelectorAll('.gallery-item'));
    if (items.length <= 1) return;
    const idx = items.indexOf(current);
    const nextIdx = (idx + delta + items.length) % items.length;
    current.classList.remove('expanded');
    items[nextIdx].classList.add('expanded');
  }

  // Always-available click-to-lightbox (mobile + desktop)
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (item) {
      e.preventDefault();
      if (item.classList.contains('expanded')) {
        closeLightbox();
      } else {
        document.querySelectorAll('.gallery-item.expanded').forEach(el => el.classList.remove('expanded'));
        document.querySelectorAll('.gallery').forEach(g => resetGallery(g));
        item.classList.add('expanded');
        document.body.classList.add('lightbox-open');
        document.body.style.overflow = 'hidden';
        refreshArrowsVisibility();
      }
    } else if (document.querySelector('.gallery-item.expanded')) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (!document.body.classList.contains('lightbox-open')) return;
    if (e.key === 'ArrowRight') navigateLightbox(1);
    else if (e.key === 'ArrowLeft') navigateLightbox(-1);
  });

  function closeLightbox() {
    document.querySelectorAll('.gallery-item.expanded').forEach(el => el.classList.remove('expanded'));
    document.body.classList.remove('lightbox-open');
    document.body.style.overflow = '';
    if (arrowsEl) arrowsEl.classList.remove('visible');
  }

  function resetGallery(gallery) {
    if (!gallery) return;
    gallery.classList.remove('has-zoom');
    gallery.querySelectorAll('.gallery-item').forEach(t => {
      t.classList.remove('zoomed', 'pushed');
      t.style.transform = '';
    });
  }

  // Hover-intent jello-zoom (desktop only)
  if (HAS_HOVER) {
    const HOVER_DELAY_MS  = 1000;   // ms of dwell before zoom triggers
    const PUSH_FACTOR     = 0.9;    // how far siblings push (× tile size)
    const FALLOFF_RADIUS  = 5;      // siblings within N tile-widths get pushed
    const UNZOOM_GRACE_MS = 90;     // small grace after mouseleave

    let hoverTimer = null;
    let unzoomTimer = null;
    let activeTile = null;
    let activeGallery = null;

    function zoomTile(gallery, tile) {
      // If a lightbox is open, never trigger the jello-zoom — a stale hover
      // timer from before the click would otherwise add .zoomed on top of
      // the expanded tile and visibly fight the lightbox view.
      if (document.body.classList.contains('lightbox-open')) return;
      if (activeTile === tile) return;
      if (activeGallery && activeGallery !== gallery) resetGallery(activeGallery);

      activeGallery = gallery;
      activeTile = tile;
      gallery.classList.add('has-zoom');

      const hCx = tile.offsetLeft + tile.offsetWidth / 2;
      const hCy = tile.offsetTop + tile.offsetHeight / 2;
      const tileW = tile.offsetWidth;
      const tileH = tile.offsetHeight;
      const tileDiag = Math.hypot(tileW, tileH);

      gallery.querySelectorAll('.gallery-item').forEach(sibling => {
        if (sibling === tile) {
          sibling.classList.add('zoomed');
          return;
        }
        const cx = sibling.offsetLeft + sibling.offsetWidth / 2;
        const cy = sibling.offsetTop + sibling.offsetHeight / 2;
        const dx = cx - hCx;
        const dy = cy - hCy;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) return;

        const distInTiles = dist / tileDiag;
        const falloff = Math.max(0, 1 - distInTiles / FALLOFF_RADIUS);
        const push = falloff * Math.max(tileW, tileH) * PUSH_FACTOR;

        sibling.classList.add('pushed');
        sibling.style.transform = `translate(${(dx / dist) * push}px, ${(dy / dist) * push}px)`;
      });
    }

    function bindGalleries() {
      document.querySelectorAll('.gallery').forEach(gallery => {
        if (gallery._jelloBound) return;
        gallery._jelloBound = true;

        // Skip hover-intent zoom on long galleries (project.html flips
        // .gallery--long when media count > 50). Two reasons: the zoom
        // trigger reads layout from every sibling — at 73 tiles that's a
        // lot of forced reflow — and the visual cascade gets noisy at
        // that scale. Click-to-lightbox is delegated through document and
        // still works for these galleries.
        if (gallery.classList.contains('gallery--long')) return;

        gallery.querySelectorAll('.gallery-item').forEach(tile => {
          tile.addEventListener('mouseenter', () => {
            clearTimeout(unzoomTimer);
            clearTimeout(hoverTimer);

            if (activeTile && activeTile !== tile) {
              resetGallery(activeGallery);
              activeTile = null;
              activeGallery = null;
            }
            if (activeTile === tile) return;

            hoverTimer = setTimeout(() => zoomTile(gallery, tile), HOVER_DELAY_MS);
          });

          tile.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimer);
            if (activeTile === tile) {
              unzoomTimer = setTimeout(() => {
                if (activeTile === tile) {
                  resetGallery(gallery);
                  activeTile = null;
                  activeGallery = null;
                }
              }, UNZOOM_GRACE_MS);
            }
          });
        });

        // Leaving the gallery entirely → reset
        gallery.addEventListener('mouseleave', () => {
          clearTimeout(hoverTimer);
          clearTimeout(unzoomTimer);
          unzoomTimer = setTimeout(() => {
            resetGallery(gallery);
            activeTile = null;
            activeGallery = null;
          }, UNZOOM_GRACE_MS);
        });
      });
    }

    bindGalleries();
    new MutationObserver(bindGalleries).observe(document.body, { childList: true, subtree: true });
  }
} catch (e) { console.error('Gallery init failed:', e); }
