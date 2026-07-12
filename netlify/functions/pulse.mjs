/* ─────────────────────────────────────────────────────────────────────────
   Visitor counter backend  →  served at /.netlify/functions/pulse

   Returns JSON { total, live }:
     • total — persistent lifetime visit count (incremented ONCE per session)
     • live  — sessions that have pinged within the last 45s ("online now")

   Uses Netlify Blobs (zero-config inside a Function — no credentials needed).
   Blobs has no atomic increment, so the total uses an ETag-guarded
   read-modify-write retry loop (optimistic concurrency). On any failure the
   function returns 500 so the front-end silently leaves the widget hidden.

   NOT COUNTED (still get {total, live} back so their widget renders):
     • ?x=1 — self-excluded browsers (localStorage ts_off, set on /me) and
       navigator.webdriver clients; the flag is set by counter.js/ticker.js
     • bot User-Agents (or no UA at all) — server-side, so crawlers that
       execute JS still can't inflate the number
   ──────────────────────────────────────────────────────────────────────── */
import { getStore } from "@netlify/blobs";

const WINDOW_MS = 45_000;   // a session counts as "live" if seen within 45s
const MAX_TRIES = 5;        // ETag retry attempts for the total increment

// EPOCH 2 — total reset to 0 on 2026-07-11 per Tres (epoch 1 had bots and
// his own visits baked in). The old "total" key stays in the store untouched
// as the historical record; bump the suffix to reset again.
const TOTAL_KEY = "total-2";

// Server-side bot filter. Real browser UAs (Chrome/Safari/Firefox/Edge,
// desktop + mobile + in-app webviews) match none of these — battered against
// 35 real UA strings. The (?<!cu) guard exempts CUBOT-brand Android phones,
// the one real-device family whose model name ends in "bot".
const BOT_RE =
  /(?<!cu)bot|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|preview|scrape|python-requests|python-httpx|httpclient|axios|node-fetch|go-http-client|curl\/|wget\//i;

export default async (req) => {
  try {
    const url = new URL(req.url);
    const sid =
      url.searchParams.get("sid") ||
      "anon-" + Math.random().toString(36).slice(2);
    const now = Date.now();

    const stats    = getStore("ts-stats");      // { [TOTAL_KEY]: number }
    const presence = getStore("ts-presence");   // { <sid>: { ts } }  live now
    const seen     = getStore("ts-seen");        // { <sid>: { ts } }  dedupe total

    // ── who never counts: excluded browsers (?x=1) + bot/blank UAs ─────────
    const ua = req.headers.get("user-agent") || "";
    const noCount = url.searchParams.get("x") === "1" || !ua || BOT_RE.test(ua);

    // ── total: increment only the first time we ever see this sid ──────────
    let isNew = false;
    if (!noCount) {
      try {
        const r = await seen.setJSON(sid, { ts: now }, { onlyIfNew: true });
        isNew = !!(r && r.modified);
      } catch { /* if this races, just don't increment — safe */ }
    }

    let total = 0;
    if (isNew) {
      for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        const cur = await stats.getWithMetadata(TOTAL_KEY, {
          type: "json",
          consistency: "strong",
        });
        const prev = typeof cur?.data === "number" ? cur.data : 0;
        total = prev + 1;
        const opts = cur?.etag ? { onlyIfMatch: cur.etag } : { onlyIfNew: true };
        const res = await stats.setJSON(TOTAL_KEY, total, opts);
        if (res && res.modified) break;   // committed
      }
    } else {
      const cur = await stats.get(TOTAL_KEY, { type: "json", consistency: "strong" });
      total = typeof cur === "number" ? cur : 0;
    }

    // ── live presence: heartbeat upsert (not for the uncounted), then count
    //    fresh sessions ────────────────────────────────────────────────────
    if (!noCount) await presence.setJSON(sid, { ts: now });

    let live = 0;
    const { blobs } = await presence.list();
    await Promise.all(
      blobs.map(async ({ key }) => {
        const rec = await presence.get(key, { type: "json" });
        if (rec && now - rec.ts <= WINDOW_MS) live++;
        else { try { await presence.delete(key); } catch { /* ignore */ } }
      })
    );

    return new Response(
      JSON.stringify({ total, live: Math.max(live, 1) }),
      { headers: { "content-type": "application/json", "cache-control": "no-store" } }
    );
  } catch (err) {
    // Front-end treats a non-200 as "no data" and leaves the widget hidden.
    return new Response(JSON.stringify({ error: "counter unavailable" }), {
      status: 500,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }
};
