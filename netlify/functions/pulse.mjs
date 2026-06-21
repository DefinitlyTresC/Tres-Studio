/* ─────────────────────────────────────────────────────────────────────────
   Visitor counter backend  →  served at /.netlify/functions/pulse

   Returns JSON { total, live }:
     • total — persistent lifetime visit count (incremented ONCE per session)
     • live  — sessions that have pinged within the last 45s ("online now")

   Uses Netlify Blobs (zero-config inside a Function — no credentials needed).
   Blobs has no atomic increment, so the total uses an ETag-guarded
   read-modify-write retry loop (optimistic concurrency). On any failure the
   function returns 500 so the front-end silently leaves the widget hidden.
   ──────────────────────────────────────────────────────────────────────── */
import { getStore } from "@netlify/blobs";

const WINDOW_MS = 45_000;   // a session counts as "live" if seen within 45s
const MAX_TRIES = 5;        // ETag retry attempts for the total increment

export default async (req) => {
  try {
    const url = new URL(req.url);
    const sid =
      url.searchParams.get("sid") ||
      "anon-" + Math.random().toString(36).slice(2);
    const now = Date.now();

    const stats    = getStore("ts-stats");      // { total: number }
    const presence = getStore("ts-presence");   // { <sid>: { ts } }  live now
    const seen     = getStore("ts-seen");        // { <sid>: { ts } }  dedupe total

    // ── total: increment only the first time we ever see this sid ──────────
    let isNew = false;
    try {
      const r = await seen.setJSON(sid, { ts: now }, { onlyIfNew: true });
      isNew = !!(r && r.modified);
    } catch { /* if this races, just don't increment — safe */ }

    let total = 0;
    if (isNew) {
      for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
        const cur = await stats.getWithMetadata("total", {
          type: "json",
          consistency: "strong",
        });
        const prev = typeof cur?.data === "number" ? cur.data : 0;
        total = prev + 1;
        const opts = cur?.etag ? { onlyIfMatch: cur.etag } : { onlyIfNew: true };
        const res = await stats.setJSON("total", total, opts);
        if (res && res.modified) break;   // committed
      }
    } else {
      const cur = await stats.get("total", { type: "json", consistency: "strong" });
      total = typeof cur === "number" ? cur : 0;
    }

    // ── live presence: heartbeat upsert, then count fresh sessions ─────────
    await presence.setJSON(sid, { ts: now });

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
