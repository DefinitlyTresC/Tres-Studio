# tres.studio — V3.0

One site: **the floating one**. Zero gravity — every letter and menu word is
a physics body (grab, throw, jello home), letters cycle color on click and
reshuffle on scroll re-entry, the ink-blot curtain swallows the screen into
the lab, and the flip-card ticker counts visits.

Static Astro build → Netlify. Content from a Google Sheet, images from
Cloudinary. The **multiverse era** (2026-07-03 → 2026-07-20: seven complete
sites behind one randomizing front door) was collapsed into this one site in
V3.0 — it lives on in git history, in REBRAND.md, and in the lab, where each
experiment still wears its adopted universe's brand.

**The living log is [REBRAND.md](REBRAND.md)** — newest section on top, read
it first in a new session. Design docs live in [docs/specs/](docs/specs/).

---

## The map

| URL | What |
|---|---|
| `/` | the letter field (T R E S .) + the floating menu + info footer |
| `/work` | the five curated projects |
| `/archive` | everything else |
| `/about` | name, lede, contacts — all throwable |
| `/project/<slug>` | project page (hero, essay, gallery + lightbox) |
| `/lab` | the experiments hall — eight doors, site-branded |
| `/labs/*.html` | the experiments (static, self-contained, universe-branded) |
| `/me` | tracking control room (noindex, linked nowhere — exclude yourself) |
| `/privacy` | the short privacy note |

Old URLs never die: `public/_redirects` 301s both past eras — the pre-Astro
`.html` links AND every `/1/../8/` multiverse door — to the pages above.

---

## Tracking (one bootstrap: `public/ts.js`)

Umami + Clarity load from `public/ts.js` on every tracked page (`/privacy`
is tracker-free; `/me` loads ts.js for its window.TS API but injects no
trackers) — never paste the snippets inline again. It also mints a stable
pseudonymous visitor id (`ochre-heron-42` style, `localStorage ts_vid`) and
sends it to Clarity (identify + the `visitor` custom tag).

**Self-exclusion:** visit **`/me`** (noindex, linked nowhere) once per
browser and hit [ exclude this browser ] — sets `localStorage ts_off`, which
kills Umami, Clarity, AND the visit counter for that browser on any network
(VPN irrelevant; that's why it's not IP-based).

**The visit counter** (`netlify/functions/pulse.mjs` → ticker.js) ignores
bot/blank User-Agents, `navigator.webdriver` clients, and excluded browsers
(they still see the numbers). The total lives under Blobs key `total-2` —
epoch 2, reset to 0 on 2026-07-11; epoch 1 (`total`) is frozen in the store
as history. To reset again, bump the key suffix.
Design: `docs/specs/2026-07-11-tracking-cleanup-design.md`.

---

## Repo map

```
src/
├── lib/sheet.ts            ← Google Sheet CSV → typed projects (build time)
├── lib/cloudinary.ts       ← image/video URL builders
├── content.config.ts       ← build-time sheet loader (snapshot fallback)
├── data/sheet-snapshot.csv ← committed fallback so offline builds never break
└── pages/
    ├── index.astro         ← the letter field + menu + footer
    ├── work.astro · archive.astro · about.astro · project/[slug].astro
    ├── lab.astro           ← the experiments hall (site brand, pinned)
    ├── me.astro            ← tracking control room
    └── privacy.astro
public/
├── mv/                     ← client scripts (folder name is a multiverse
│   ├── zerog.js               relic; the paths are cached — leave it):
│   ├── curtain.js             zero-g physics engine · ink-blot curtain ·
│   ├── ticker.js              flip-card visit counter ·
│   └── lab-takeover.js        /lab links get swallowed by the curtain
├── labs/                   ← the eight lab experiments (static HTML)
├── ts.js                   ← THE tracking bootstrap (Umami+Clarity+visitor id)
└── _redirects              ← both eras of legacy URLs → clean 301s
netlify/
└── functions/pulse.mjs     ← visitor counter (Netlify Blobs)
docs/
├── specs/                  ← design docs, dated
├── UPDATING-IMAGES.md      ← how to add/replace pictures without breaking paths
└── HANDOFF.md              ← 2026-07-03 cutover handoff (historical)
_archive/                   ← retired code + the original projects.xlsx
```

---

## Content workflow (builds bake the sheet)

Content is fetched from the published Google Sheet **at build time**, not in
the browser. So: edit the sheet → **trigger a redeploy** (push, or Netlify
"Trigger deploy") → change is live. A sheet edit alone does not show up.

1. Upload media to Cloudinary at `category/slug/NN.ext` (videos:
   mp4/webm/mov/m4v auto-route through the video CDN).
2. Add the path to the sheet row (`img_01`…`img_100`, `Hero Image`, etc.).
3. Redeploy. The loader snapshots the CSV to `src/data/sheet-snapshot.csv`
   (commit it when it changes) and falls back to it if the sheet is down.

Sheet URL: `content.config.ts` (`SHEET_CSV_URL` env var overrides).
**Full picture how-to: [docs/UPDATING-IMAGES.md](docs/UPDATING-IMAGES.md).**

---

## Dev

```
npm install
npm run dev       # localhost:4321
npm run build     # bakes the sheet + builds ~24 pages into dist/
npm run preview   # serve dist/ locally
```

## Deploy

Push `main` → Netlify builds (`npm run build`, publishes `dist/`). Redirects
ship from `netlify.toml` / `public/_redirects`.

Open items live in REBRAND.md's top section (SEO/noindex pass is the big
one) and ASSETS-NEEDED.md.
