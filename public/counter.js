/* ─────────────────────────────────────────────────────────────────────────
   Visitor counter — live "now" + total visits, with a slot-machine flourish.

   Talks to the Netlify function at /.netlify/functions/pulse, which returns
   { total, live }. Fully self-contained and DEGRADES GRACEFULLY: if the
   endpoint is missing or errors, the widget simply never appears and the rest
   of the site is completely unaffected. Injects itself into .footer-base so no
   page markup is required.
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var ENDPOINT     = '/.netlify/functions/pulse';
  var HEARTBEAT_MS = 20000;   // keep this tab counted as "live"
  var PAD          = 5;       // 00001 style
  var REDUCE = false;
  try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Stable per-tab session id: total counts once per visit; presence tracks
  // this specific tab.
  var sid;
  try {
    sid = sessionStorage.getItem('ts_sid');
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('ts_sid', sid);
    }
  } catch (e) {
    sid = String(Math.random()).slice(2);
  }

  // Self-exclusion (/me sets ts_off) + headless bots: still SHOW the widget,
  // never count this browser — pulse skips all writes when x=1. Re-read the
  // flag on every heartbeat: a tab that was open when Tres flipped the
  // switch on /me must stop counting too, not just freshly-loaded ones.
  var WEBDRIVER = !!navigator.webdriver; /* can't change after load */
  function isOff() {
    if (WEBDRIVER) return true;
    try { return localStorage.getItem('ts_off') === '1'; } catch (e) { return false; }
  }

  var els       = null;   // { root, liveNum, totalNum, totalBtn }
  var realTotal = 0;      // last known true total
  var clickCount = 0;
  var scrambling = false;

  function pad(n) {
    var s = String(Math.max(0, Math.floor(n)));
    while (s.length < PAD) s = '0' + s;
    return s;
  }

  function build() {
    var footer = document.querySelector('.footer-base');
    if (!footer) return null;

    var root = document.createElement('span');
    root.className = 'visit-counter';

    var live = document.createElement('span');
    live.className = 'vc-live';
    var dot = document.createElement('span'); dot.className = 'vc-dot';
    var liveNum = document.createElement('span'); liveNum.className = 'vc-live-num'; liveNum.textContent = '0';
    live.appendChild(dot);
    live.appendChild(liveNum);
    live.appendChild(document.createTextNode(' online'));

    var totalBtn = document.createElement('button');
    totalBtn.type = 'button';
    totalBtn.className = 'vc-total';
    totalBtn.setAttribute('aria-label', 'Total site visits — click to spin');
    var totalNum = document.createElement('span'); totalNum.className = 'vc-total-num'; totalNum.textContent = pad(0);
    totalBtn.appendChild(totalNum);
    totalBtn.appendChild(document.createTextNode(' visits'));

    root.appendChild(live);
    root.appendChild(totalBtn);

    // Sit between "© 2026 Tres Carter" and "Built in Florida".
    if (footer.children.length >= 1) {
      footer.insertBefore(root, footer.children[footer.children.length - 1]);
    } else {
      footer.appendChild(root);
    }

    return { root: root, liveNum: liveNum, totalNum: totalNum, totalBtn: totalBtn };
  }

  function tweenTotal(to) {
    if (!els) return;
    if (REDUCE) { els.totalNum.textContent = pad(to); return; }
    var from = parseInt(els.totalNum.textContent, 10);
    if (isNaN(from)) from = 0;
    if (from === to) { els.totalNum.textContent = pad(to); return; }
    var start = null, dur = 700;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      els.totalNum.textContent = pad(Math.round(from + (to - from) * eased));
      if (p < 1) requestAnimationFrame(step);
      else els.totalNum.textContent = pad(to);
    }
    requestAnimationFrame(step);
  }

  function reveal() { if (els && els.root) els.root.classList.add('vc-in'); }

  function apply(data) {
    if (!data) return;
    if (!els) {
      els = build();
      if (!els) return;
      bindClick();
    }
    reveal();
    if (typeof data.total === 'number') {
      if (!scrambling) tweenTotal(data.total);
      realTotal = data.total;
    }
    if (typeof data.live === 'number') {
      els.liveNum.textContent = String(Math.max(1, data.live));
    }
  }

  function pulse() {
    fetch(ENDPOINT + '?sid=' + encodeURIComponent(sid) + (isOff() ? '&x=1' : ''), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(apply)
      .catch(function () { /* silent — widget just won't show / update */ });
  }

  /* ── slot-machine click ──────────────────────────────────────────────── */
  var SILLY = ['00777', '13337', '08008', '00420', '12345', '99999', '00007', '55555', '80085', '01010'];

  // Never on click 1; maybe on 2; guaranteed on 3; random-but-often after.
  function wantsJackpot() {
    clickCount++;
    if (clickCount === 1) return false;
    if (clickCount === 2) return Math.random() < 0.5;
    if (clickCount === 3) return true;
    return Math.random() < 0.38;
  }

  function bindClick() {
    if (!els || !els.totalBtn) return;
    els.totalBtn.addEventListener('click', function () {
      if (scrambling) return;
      runScramble(wantsJackpot());
    });
  }

  function runScramble(jackpot) {
    if (!els) return;
    scrambling = true;
    var spins = 0;
    var maxSpins = jackpot ? 28 : 16;
    var tick = jackpot ? 55 : 45;
    var iv = setInterval(function () {
      var s = '';
      for (var i = 0; i < PAD; i++) s += Math.floor(Math.random() * 10);
      els.totalNum.textContent = s;
      if (++spins >= maxSpins) {
        clearInterval(iv);
        if (jackpot) {
          els.totalNum.textContent = SILLY[Math.floor(Math.random() * SILLY.length)];
          els.root.classList.add('vc-jackpot');
          setTimeout(function () {
            els.root.classList.remove('vc-jackpot');
            scrambling = false;
            tweenTotal(realTotal);   // settle back to the truth
          }, 1500);
        } else {
          scrambling = false;
          els.totalNum.textContent = pad(realTotal);
        }
      }
    }, tick);
  }

  /* ── boot ────────────────────────────────────────────────────────────── */
  function start() {
    pulse();
    setInterval(pulse, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') pulse();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
