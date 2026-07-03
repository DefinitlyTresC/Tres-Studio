/* ─────────────────────────────────────────────────────────────────────────
   The ticker — flat flip-card visit counter, fixed bottom-right on every
   site. The multiverse's other constant (with the dot-ring).

   One shared count for the whole multiverse (the pulse function's Blobs
   store is domain-wide). Flat monochrome cards; ones place leads; the V1
   slot-machine cadence on click (never pays the 1st pull, always the 3rd)
   with palette-paper confetti on jackpot. Hides silently if the function is
   unreachable.

   Per-site skin via CSS custom props on :root (all optional):
     --mvt-card (card bg)  --mvt-ink (digit)  --mvt-line (border)
     --mvt-label (label color)  --mvt-confetti (comma-sep colors)
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  var ENDPOINT = '/.netlify/functions/pulse';
  var PAD = 5;
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var css = getComputedStyle(document.documentElement);
  function prop(n, d) { var v = css.getPropertyValue(n).trim(); return v || d; }
  var CARD = prop('--mvt-card', '#ffffff');
  var INK = prop('--mvt-ink', '#111111');
  var LINE = prop('--mvt-line', 'rgba(0,0,0,0.28)');
  var LABEL = prop('--mvt-label', 'rgba(0,0,0,0.55)');
  var CONF = prop('--mvt-confetti', '#EDCDBB,#E3B7A0,#BF9270,#2B1F1A,#ffffff').split(',');
  var ACCENT = prop('--mvt-accent', '#BF9270');

  var sid;
  try {
    sid = sessionStorage.getItem('ts_sid');
    if (!sid) {
      sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem('ts_sid', sid);
    }
  } catch (e) { sid = String(Math.random()).slice(2); }

  /* widget DOM — mounts inline into #mv-ticker-slot in the info footer
     (falls back to fixed bottom-right only if no slot exists) */
  var slot = document.getElementById('mv-ticker-slot');
  var tick = document.createElement('div');
  tick.style.cssText = (slot
    ? 'display:inline-flex;'
    : 'position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));display:flex;z-index:70;') +
    'align-items:center;gap:12px;opacity:0;translate:0 6px;' +
    'transition:opacity 300ms cubic-bezier(.23,1,.32,1),translate 300ms cubic-bezier(.23,1,.32,1)';

  /* live: "● n online" */
  var live = document.createElement('span');
  live.style.cssText = 'display:inline-flex;align-items:center;gap:7px;font:10px/1 "Space Mono",ui-monospace,monospace;' +
    'letter-spacing:.1em;text-transform:uppercase;color:' + LABEL;
  var liveDot = document.createElement('span');
  liveDot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:' + ACCENT;
  var liveNum = document.createElement('span');
  liveNum.textContent = '1';
  live.appendChild(liveDot); live.appendChild(liveNum);
  live.appendChild(document.createTextNode(' online'));
  tick.appendChild(live);
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Total site visits — spin');
  btn.style.cssText = 'display:inline-flex;gap:3px;background:none;border:none;padding:0;cursor:pointer;position:relative;' +
    'transition:transform 140ms cubic-bezier(.23,1,.32,1)';
  btn.addEventListener('pointerdown', function () { btn.style.transform = 'scale(.96)'; });
  ['pointerup', 'pointerleave'].forEach(function (ev) {
    btn.addEventListener(ev, function () { btn.style.transform = ''; });
  });
  var hit = document.createElement('span'); /* 44px hit area */
  hit.style.cssText = 'position:absolute;inset:-14px';
  btn.appendChild(hit);
  var lbl = document.createElement('span');
  lbl.textContent = 'visits';
  lbl.style.cssText = 'font:10px/1 "Space Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:' + LABEL;
  tick.appendChild(btn); tick.appendChild(lbl);
  var cvf = document.createElement('canvas');
  cvf.style.cssText = 'position:fixed;inset:0;z-index:75;pointer-events:none';
  cvf.setAttribute('aria-hidden', 'true');

  function boot() { (slot || document.body).appendChild(tick); document.body.appendChild(cvf); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  function makeCell() {
    var c = document.createElement('span');
    c.style.cssText = 'position:relative;width:1.35ch;padding:5px 3px;text-align:center;' +
      'font:700 15px/1 "Space Mono",ui-monospace,monospace;font-variant-numeric:tabular-nums;' +
      'background:' + CARD + ';color:' + INK + ';border:1px solid ' + LINE + ';border-radius:3px;' +
      'transition:transform 90ms cubic-bezier(.77,0,.175,1)';
    c.textContent = '0';
    var seam = document.createElement('i');
    seam.style.cssText = 'position:absolute;left:0;right:0;top:50%;border-top:1px solid ' + LINE.replace(/[\d.]+\)$/, '0.14)');
    c.appendChild(seam);
    return c;
  }
  function ensureCells(n) {
    while (btn.children.length - 1 < n) btn.insertBefore(makeCell(), btn.children[1] || null);
  }
  function cells() { return Array.prototype.slice.call(btn.children, 1); }

  function flipCell(cell, digit) {
    if (reduce) { cell.firstChild ? cell.childNodes[0].nodeValue = digit : cell.textContent = digit; return; }
    if (cell._t) clearTimeout(cell._t);
    cell.style.transform = 'scaleY(0.06)';
    cell._t = setTimeout(function () {
      cell.childNodes[0].nodeValue = digit;
      cell.style.transform = '';
      cell._t = null;
    }, 95);
  }
  function digitOf(cell) { return cell.childNodes[0].nodeValue; }

  function show(total) {
    var str = String(Math.max(0, Math.floor(total)));
    if (str.length < PAD) str = ('00000' + str).slice(-Math.max(PAD, str.length));
    ensureCells(str.length);
    var cs = cells(), delay = 0;
    for (var i = str.length - 1; i >= 0; i--) {
      (function (cell, digit, d) {
        if (digitOf(cell) === digit) return;
        if (reduce || d === 0) flipCell(cell, digit);
        else setTimeout(function () { flipCell(cell, digit); }, d);
      })(cs[i], str[i], delay);
      if (digitOf(cs[i]) !== str[i]) delay += 40;
    }
  }

  function rollTo(target) {
    var from = 0;
    try { from = parseInt(localStorage.getItem('ts_v2_ticker') || '0', 10) || 0; } catch (e) {}
    if (from > target) from = 0;
    try { localStorage.setItem('ts_v2_ticker', String(target)); } catch (e) {}
    if (reduce || target - from < 2) { show(target); return; }
    var steps = Math.min(9, target - from), i = 0;
    (function next() {
      i++;
      var p = i / steps, eased = 1 - Math.pow(1 - p, 3);
      show(Math.round(from + (target - from) * eased));
      if (i < steps) setTimeout(next, 110 + 90 * p);
    })();
  }

  var real = 0;
  function reveal() { tick.style.opacity = '1'; tick.style.translate = '0 0'; }
  fetch(ENDPOINT + '?sid=' + encodeURIComponent(sid), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || typeof data.total !== 'number') return;
      real = data.total;
      if (typeof data.live === 'number') liveNum.textContent = String(Math.max(1, data.live));
      reveal(); rollTo(real);
      btn.setAttribute('aria-label', 'Total site visits: ' + real + ' — spin');
    })
    .catch(function () { /* silent */ });

  /* slot machine — V1 cadence */
  var SILLY = ['00777', '13337', '00420', '12345', '99999', '00007', '55555', '01010'];
  var pulls = 0, spinning = false;
  function wantsJackpot() {
    pulls++;
    if (pulls === 1) return false;
    if (pulls === 2) return Math.random() < 0.5;
    if (pulls === 3) return true;
    return Math.random() < 0.38;
  }
  btn.addEventListener('click', function () {
    if (spinning || reduce || !cells().length) return;
    spinning = true;
    var jackpot = wantsJackpot();
    var cs = cells(), spins = 0, maxSpins = jackpot ? 22 : 14;
    var iv = setInterval(function () {
      for (var i = 0; i < cs.length; i++) cs[i].childNodes[0].nodeValue = Math.floor(Math.random() * 10);
      if (++spins < maxSpins) return;
      clearInterval(iv);
      if (jackpot) {
        show(parseInt(SILLY[Math.floor(Math.random() * SILLY.length)], 10));
        burst();
        setTimeout(function () { show(real); spinning = false; }, 1800);
      } else { show(real); spinning = false; }
    }, 62);
  });

  /* palette-paper confetti */
  var ctx = cvf.getContext('2d');
  var dprC = Math.min(2, devicePixelRatio || 1);
  var bits = [], craf = null;
  function burst() {
    cvf.width = innerWidth * dprC; cvf.height = innerHeight * dprC;
    var r = tick.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top;
    for (var i = 0; i < 64; i++) {
      bits.push({
        x: ox + (Math.random() - .5) * 24, y: oy,
        vx: (Math.random() - .5) * 6.5, vy: -(3.5 + Math.random() * 5),
        w: 3 + Math.random() * 4, h: 5 + Math.random() * 4,
        rot: Math.random() * 6.2832, vr: (Math.random() - .5) * .3,
        age: 0, life: 1100 + Math.random() * 500,
        c: CONF[Math.floor(Math.random() * CONF.length)].trim(),
      });
    }
    if (!craf) craf = requestAnimationFrame(fall);
  }
  function fall() {
    ctx.clearRect(0, 0, cvf.width, cvf.height);
    for (var i = bits.length - 1; i >= 0; i--) {
      var b = bits[i];
      b.age += 16;
      if (b.age > b.life) { bits.splice(i, 1); continue; }
      b.vy += .22; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
      var a = b.age > b.life * .7 ? 1 - (b.age - b.life * .7) / (b.life * .3) : 1;
      ctx.save();
      ctx.translate(b.x * dprC, b.y * dprC);
      ctx.rotate(b.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = b.c;
      ctx.fillRect(-b.w / 2 * dprC, -b.h / 2 * dprC, b.w * dprC, b.h * dprC);
      ctx.restore();
    }
    craf = bits.length ? requestAnimationFrame(fall) : null;
    if (!bits.length) ctx.clearRect(0, 0, cvf.width, cvf.height);
  }
})();
