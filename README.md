# tres.studio — the multiverse

Six complete portfolio sites ("universes") behind one front door. Every visit
to `tres.studio` rolls the dice and serves one of them; every **refresh** —
on any page — re-rolls to the same page in a *different* universe. Navigating
around (links, back/forward) keeps you in the universe you're in.

Static Astro build → Netlify. Content from a Google Sheet, images from
Cloudinary. Live on `main` since the 2026-07-03 cutover
(`main` == `astro-migration`).

**The living log is [REBRAND.md](REBRAND.md)** — newest section on top, read it
first in a new session. Design docs live in [docs/specs/](docs/specs/).

---

## The randomization contract

| You do | You get |
|---|---|
| Visit `/` | a random universe (never the last one served — `mv_last` cookie) |
| Refresh any page | the **same page** in a **different universe** |
| Click links / back / forward | the **same universe**, always |
| Click a ring dot or a `/N/` link | that universe, deliberately |
| Add `?u=N` to `/` or any universe page | pinned to universe N — refresh does NOT roll (dev/QA) |
| `/lab`, `/labs/*`, `/privacy` | shared single-version pages — never roll; `?u` is ignored here |

Two moving parts, which share the `mv_last` cookie so neither ever rolls the
universe you're already in:

1. **The front door** — `netlify/edge-functions/roll.js` rewrites `/` to a
   random `/N/` (URL stays `/`). Prod only. `src/pages/index.astro` is the
   client-side fallback with identical semantics for `astro dev` / `astro
   preview` / edge failure.
2. **The refresh-roll** — an inline head script emitted by `MV_CLIENT()` in
   `src/lib/multiverse.ts`, injected by every universe page. Detects a reload
   via the Navigation Timing API and `location.replace`s to another universe.
   Full decision table: `docs/specs/2026-07-11-refresh-roll-design.md`.

**Adding universe 7:** add the registry entry in `src/lib/multiverse.ts`,
build the pages under `src/pages/7/`, and bump `COUNT` in `roll.js`.
Everything else (ring, refresh-roll, fallback) reads the registry.

---

## Tracking (one bootstrap: `public/ts.js`)

Umami + Clarity load from `public/ts.js` on every tracked page (the
`/`-fallback and `/privacy` are tracker-free; `/me` loads ts.js for its
window.TS API but injects no trackers) — never paste the snippets inline
again. It also mints a stable pseudonymous visitor id
(`ochre-heron-42` style, `localStorage ts_vid`) and sends it to Clarity
(identify + the `visitor` custom tag — filterable in the dashboard).

**Self-exclusion:** visit **`/me`** (noindex, linked nowhere) once per
browser and hit [ exclude this browser ] — sets `localStorage ts_off`, which
kills Umami, Clarity, AND the visit counter for that browser on any network
(VPN irrelevant; that's why it's not IP-based). The optional friendly name
on `/me` is what Clarity shows on recordings.

**The visit counter** (`netlify/functions/pulse.mjs` → counter.js/ticker.js)
ignores bot/blank User-Agents, `navigator.webdriver` clients, and excluded
browsers (they still see the numbers). The total lives under Blobs key
`total-2` — **epoch 2, reset to 0 on 2026-07-11**; epoch 1 (`total`) is
frozen in the store as history. To reset again, bump the key suffix.
Design: `docs/specs/2026-07-11-tracking-cleanup-design.md`.

---

## Repo map

```
src/
├── lib/multiverse.ts       ← THE registry (sites, colors) + MV_CLIENT bootstrap
├── lib/sheet.ts            ← Google Sheet CSV → typed projects (build time)
├── lib/cloudinary.ts       ← image/video URL builders
├── content.config.ts       ← build-time sheet loader (snapshot fallback)
├── data/sheet-snapshot.csv ← committed fallback so offline builds never break
├── layouts/Base.astro      ← shared shell for the old-brand clean-URL pages
└── pages/
    ├── index.astro         ← front-door fallback roller (edge owns "/" in prod)
    ├── 1/ … 6/             ← the six universes (index, work, about, archive,
    │                          project/[slug]) — each self-contained, links
    │                          only within itself + shared /lab /privacy
    ├── lab.astro           ← the shared lab (universe 0 — never rolls)
    ├── me.astro            ← tracking control room (/me — exclude yourself)
    └── about/[cat]/project/privacy ← legacy-redirect targets (old brand)
public/
├── mv/                     ← multiverse client: ring.js (six-dot map),
│                              curtain.js (ink transition), + per-site fx
├── labs/                   ← the seven lab experiments (static HTML)
├── ts.js                   ← THE tracking bootstrap (Umami+Clarity+visitor id)
├── brand.js · counter.js   ← LIVE — loaded by Base.astro (legacy-brand pages)
├── v2-tokens.css           ← LIVE — linked by all universe-1 pages
├── style.css               ← token-source twin of v2-tokens.css (not linked)
└── _redirects              ← legacy .html?param → clean-URL 301s
netlify/
├── edge-functions/roll.js  ← the front-door dice roll
└── functions/pulse.mjs     ← visitor counter (Netlify Blobs)
docs/
├── specs/                  ← design docs, dated
└── HANDOFF.md              ← 2026-07-03 cutover handoff (historical)
_archive/                   ← retired code + the original projects.xlsx
```

The pre-Astro static site that used to live in the repo root was removed
2026-07-11 (it stopped being served at the cutover) — it's all in git history.
(The identically-named files still in `public/` — brand.js, counter.js,
style.css — are the SERVED copies, not leftovers; keep them.)

---

## Content workflow (CHANGED from v1 — builds bake the sheet)

Content is fetched from the published Google Sheet **at build time**, not in
the browser. So: edit the sheet → **trigger a redeploy** (push, or Netlify
"Trigger deploy") → change is live. A sheet edit alone no longer shows up.

1. Upload media to Cloudinary at `category/slug/NN.ext` (videos:
   mp4/webm/mov/m4v auto-route through the video CDN).
2. Add the path to the sheet row (`img_01`…`img_100`, `Hero Image`, etc.).
3. Redeploy. The loader snapshots the CSV to `src/data/sheet-snapshot.csv`
   (commit it when it changes) and falls back to it if the sheet is down.

Sheet URL: `content.config.ts` (`SHEET_CSV_URL` env var overrides).

---

## Dev

```
npm install
npm run dev       # localhost:4321 — "/" client-rolls; use ?u=N to pin while iterating
npm run build     # bakes the sheet + builds ~149 pages into dist/
npm run preview   # serve dist/ locally
```

Tip: when designing one universe, work at `/3/work?u=3` — F5 keeps you there.
Without `?u`, refresh teleports you (that's the feature).

## Deploy

Push `main` → Netlify builds (`npm run build`, publishes `dist/`). The edge
function + redirects ship from `netlify.toml` / `public/_redirects`.

Open items live in REBRAND.md's top section (SEO/noindex pass is the big one)
and ASSETS-NEEDED.md.
