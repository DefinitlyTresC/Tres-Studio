/* ──────────────────────────────────────────────────────────────────────
   brand.js — shared front-end for the v2 "drawing set" brand.
   Replaces the old scroll.js on inner pages. No dependencies.

     • marks <html class="js"> so CSS can stage entrance animations
     • live clock        →  any .clk element  (HH:MM:SS, 24h)
     • scramble text     →  .scram (on reveal) · .hovscram (on hover)
     • reveal on scroll  →  .reveal gets .in when it enters the viewport
     • lab card tilt     →  .lab-index-card preview eases toward the cursor
     • lightbox          →  click any .gallery-item image to view fullscreen

   Async pages (project / category) render their DOM after fetch, then call
   window.TRES.scan(scope) to wire reveals + scrambles in the new markup.
   The lightbox is delegated on document, so it needs no per-render wiring.
   ────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');
  var REDUCE = false;
  try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ── live clock ──────────────────────────────────────────────────── */
  function tick() {
    var els = document.querySelectorAll('.clk');
    if (!els.length) return;
    var t = new Date().toLocaleTimeString('en-US', { hour12: false });
    for (var i = 0; i < els.length; i++) els[i].textContent = t;
  }
  tick();
  setInterval(tick, 1000);

  /* ── scramble ────────────────────────────────────────────────────── */
  var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/—';
  function scramble(el, dur) {
    if (REDUCE) { el.textContent = el.dataset.text != null ? el.dataset.text : el.textContent; return; }
    var text = el.dataset.text != null ? el.dataset.text : el.textContent;
    el.dataset.text = text;
    if (el._raf) cancelAnimationFrame(el._raf);
    var t0 = performance.now(); dur = dur || 1200;
    function f(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3),
          lock = Math.floor(e * text.length), o = '';
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        o += (c === ' ') ? ' ' : (i < lock ? c : CH[(Math.random() * CH.length) | 0]);
      }
      el.textContent = o;
      if (p < 1) { el._raf = requestAnimationFrame(f); }
      else { el.textContent = text; el._raf = null; }
    }
    el._raf = requestAnimationFrame(f);
  }

  /* ── reveal-on-scroll ────────────────────────────────────────────── */
  var io = null;
  if ('IntersectionObserver' in window && !REDUCE) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add('in');
        if (el.classList.contains('scram')) scramble(el, 1200);
        var inner = el.querySelectorAll ? el.querySelectorAll('.scram') : [];
        for (var i = 0; i < inner.length; i++) scramble(inner[i], 1200);
        io.unobserve(el);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  }

  function scan(scope) {
    scope = scope || document;
    var reveals = scope.querySelectorAll('.reveal');
    var i;
    if (io) {
      for (i = 0; i < reveals.length; i++) io.observe(reveals[i]);
    } else {
      for (i = 0; i < reveals.length; i++) {
        reveals[i].classList.add('in');
        if (reveals[i].classList.contains('scram')) reveals[i].textContent = reveals[i].dataset.text || reveals[i].textContent;
      }
    }
    // hover-scramble bindings (idempotent — guard with a flag)
    var hov = scope.querySelectorAll('.hovscram');
    for (i = 0; i < hov.length; i++) {
      if (hov[i]._hs) continue;
      hov[i]._hs = true;
      (function (el) { el.addEventListener('mouseenter', function () { scramble(el, 640); }); })(hov[i]);
    }
  }

  /* ── lab card magnetic-tilt ──────────────────────────────────────── */
  function bindTilt(scope) {
    if (REDUCE) return;
    var cards = (scope || document).querySelectorAll('.lab-index-card');
    cards.forEach(function (card) {
      var preview = card.querySelector('.preview');
      if (!preview || card._tilt) return;
      card._tilt = true;
      var rect = null;
      card.addEventListener('mouseenter', function () { rect = card.getBoundingClientRect(); });
      card.addEventListener('mousemove', function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
        var dy = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
        preview.style.transform = 'translate(' + (dx * -8) + 'px,' + (dy * -4) + 'px)';
      });
      card.addEventListener('mouseleave', function () { preview.style.transform = ''; rect = null; });
    });
  }

  /* ── lightbox (delegated) ────────────────────────────────────────── */
  var lb = null, lbImgs = [], lbIndex = 0;
  function ensureLb() {
    if (lb) return lb;
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML =
      '<button class="lb-close" aria-label="Close">✕</button>' +
      '<button class="lb-btn lb-prev" aria-label="Previous">‹</button>' +
      '<img alt="">' +
      '<button class="lb-btn lb-next" aria-label="Next">›</button>' +
      '<div class="lb-count"></div>';
    document.body.appendChild(lb);
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    return lb;
  }
  function showLb() {
    var img = lb.querySelector('img');
    img.src = lbImgs[lbIndex];
    lb.querySelector('.lb-count').textContent =
      String(lbIndex + 1).padStart(2, '0') + ' / ' + String(lbImgs.length).padStart(2, '0');
    var multi = lbImgs.length > 1;
    lb.querySelector('.lb-prev').style.display = multi ? '' : 'none';
    lb.querySelector('.lb-next').style.display = multi ? '' : 'none';
  }
  function step(d) { lbIndex = (lbIndex + d + lbImgs.length) % lbImgs.length; showLb(); }
  function openLb(imgs, i) {
    ensureLb(); lbImgs = imgs; lbIndex = i; showLb();
    document.body.classList.add('lb-open'); requestAnimationFrame(function () { lb.classList.add('on'); });
  }
  function closeLb() { if (!lb) return; lb.classList.remove('on'); document.body.classList.remove('lb-open'); }

  document.addEventListener('click', function (e) {
    var item = e.target.closest && e.target.closest('.gallery-item');
    if (!item) return;
    var img = item.querySelector('img');
    if (!img) return;                       // skip video tiles
    var gallery = item.closest('.gallery');
    if (!gallery) return;
    var nodes = gallery.querySelectorAll('.gallery-item img');
    var imgs = [], idx = 0;
    for (var i = 0; i < nodes.length; i++) {
      imgs.push(nodes[i].currentSrc || nodes[i].src);
      if (nodes[i] === img) idx = i;
    }
    openLb(imgs, idx);
  });

  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('on')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });

  /* ── boot ────────────────────────────────────────────────────────── */
  function init() { scan(document); bindTilt(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.TRES = {
    scramble: scramble,
    scan: function (scope) { scan(scope); bindTilt(scope); }
  };
})();
