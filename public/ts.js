/* ─────────────────────────────────────────────────────────────────────────
   Tracking bootstrap — THE one place analytics happens (design:
   docs/specs/2026-07-11-tracking-cleanup-design.md).

   Every page loads this instead of pasting Umami + Clarity snippets inline.
   It always defines window.TS (so /me and the console can drive it), then
   injects the trackers unless:
     • localStorage ts_off === '1'  — this browser opted out (set on /me);
     • navigator.webdriver          — headless/bot browsers;
     • the page is /me itself       — the control room isn't a stat.

   Visitor identity: a stable, memorable, pseudonymous id (ts_vid, e.g.
   "ochre-heron-42") is minted once per browser and sent to Clarity as both
   the custom user id (Clarity hashes it) and — unless ts_name overrides —
   the friendly name shown on recordings. Filter in Clarity by User ID or
   the "visitor" custom tag.

   Keys: localStorage ts_off / ts_vid / ts_name (+ umami.disabled, Umami's
   own standard bypass, kept in sync by exclude/include).
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var UMAMI_ID = '96e73988-106a-415e-bf80-5e10ffaec0dc';
  var CLARITY_ID = 'xang6oq7f9';

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* ── visitor id — palette word + coastal bird + 2 digits ─────────────── */
  var A = ['bone', 'ochre', 'cedar', 'slate', 'moss', 'rust', 'dune', 'ash',
    'clay', 'fog', 'palm', 'tide', 'salt', 'pine', 'shell', 'reed',
    'amber', 'coral', 'storm', 'dusk', 'linen', 'brick', 'sage', 'ink'];
  var B = ['heron', 'plover', 'tern', 'egret', 'osprey', 'ibis', 'gull',
    'sandpiper', 'pelican', 'skimmer', 'curlew', 'godwit', 'willet',
    'dunlin', 'knot', 'stilt', 'avocet', 'rail', 'bittern', 'kite',
    'shrike', 'swift', 'martin', 'wren'];
  function mintId() {
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    return pick(A) + '-' + pick(B) + '-' + String(10 + Math.floor(Math.random() * 90));
  }
  var vid = lsGet('ts_vid');
  if (!vid) { vid = mintId(); lsSet('ts_vid', vid); }

  var off = lsGet('ts_off') === '1';
  var name = lsGet('ts_name') || '';

  /* ── console/control-room API ─────────────────────────────────────────── */
  window.TS = {
    id: vid,
    name: name,
    off: off,
    exclude: function () {
      lsSet('ts_off', '1');
      lsSet('umami.disabled', '1'); /* Umami's own bypass — covers cached pages */
      window.TS.off = true;
    },
    include: function () {
      lsDel('ts_off');
      lsDel('umami.disabled');
      window.TS.off = false;
    },
    setName: function (n) {
      n = String(n || '').trim().slice(0, 40);
      if (n) lsSet('ts_name', n); else lsDel('ts_name');
      window.TS.name = n;
      /* re-identify live if Clarity is already up this page */
      if (window.clarity) window.clarity('identify', vid, null, null, n || vid);
    },
  };

  /* ── gate ─────────────────────────────────────────────────────────────── */
  if (off) return;
  if (navigator.webdriver) return;            /* headless/bot browsers      */
  /* the control room, not a stat — Netlify serves it as /me/ (trailing-slash
     301), astro dev as /me; strip only trailing slashes so /media-ish paths
     can't false-match */
  if (location.pathname.replace(/\/+$/, '') === '/me') return;

  /* ── Umami — data-domains scopes tracking to the real site so preview/
        branch URLs don't pollute stats ─────────────────────────────────── */
  var u = document.createElement('script');
  u.defer = true;
  u.src = 'https://cloud.umami.is/script.js';
  u.setAttribute('data-website-id', UMAMI_ID);
  u.setAttribute('data-domains', 'tres.studio');
  document.head.appendChild(u);

  /* ── Clarity — host-guarded to production for the same reason ─────────── */
  if (location.hostname === 'tres.studio') {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CLARITY_ID);
    /* queued until the tag loads — id is hashed by Clarity; the friendly
       name is what shows on recordings; the tag is dashboard-filterable */
    window.clarity('identify', vid, null, null, name || vid);
    window.clarity('set', 'visitor', vid);
    /* bfcache: excluding on /me then pressing Back restores THIS page with
       Clarity's recorder self-restarting (its own pageshow handler) — Umami
       re-checks umami.disabled at send time, Clarity has no such switch, so
       stop it ourselves. setTimeout(0) is load-bearing: it runs after
       Clarity's restart handler, when window.clarity is the live dispatcher. */
    window.addEventListener('pageshow', function (e) {
      if (e.persisted && lsGet('ts_off') === '1') {
        setTimeout(function () { if (window.clarity) window.clarity('stop'); }, 0);
      }
    });
  }
})();
