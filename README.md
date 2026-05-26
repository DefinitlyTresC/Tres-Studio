# tres.studio

Personal portfolio site. Reads from a Google Sheet, pulls images from Cloudinary, deploys to Netlify.

---

## Workflow (the magic)

1. **Upload an image to Cloudinary** at the right path (e.g. `architecture/tucker/05.png`)
2. **Add the path to the Google Sheet** in the next empty image column for that project
3. **Refresh the live site** — image appears

No code changes. No redeploys. The site fetches the sheet on every page load.

---

## One-time setup

### 1. Upload all site files to Netlify

Drag this whole folder into Netlify (or push to GitHub and connect). Set your domain to `tres.studio`.

### 2. Publish your Google Sheet as CSV

In Google Sheets with your sitemap open:

- **File → Share → Publish to web**
- **Link** tab
- Choose **Entire document** in the first dropdown
- Choose **Comma-separated values (.csv)** in the second
- Click **Publish**
- Copy the URL it gives you — looks like:
  `https://docs.google.com/spreadsheets/d/e/2PACX-1vXXXXXXXXXXX/pub?output=csv`

### 3. Update `config.js`

Open `config.js` and paste your URL into `PROJECTS_CSV_URL`. If you have multiple tabs in the workbook and want to lock to one, append `&gid=NNN&single=true` (where NNN is the tab's gid — visible as `#gid=NNN` in the editor URL when that tab is selected).

### 4. Verify Cloudinary line

`CLOUDINARY_BASE` should already be set to:
```
https://res.cloudinary.com/dodk1b5l7/image/upload/f_auto,q_auto
```
If your cloud name changes, edit it here.

### 5. Deploy

Save `config.js`, push/upload to Netlify. Done.

---

## How adding a new project works

1. Upload images to Cloudinary at `category/slug/hero.png`, `01.png`, `02.png`, etc.
2. Open the Google Sheet → Projects tab
3. Add a new row: fill in Display Name, Slug, Category, Subcategory, Location, Year, Status (Live/WIP/Planned/Hidden), Order, Description
4. In the Hero Image column, paste: `category/slug/hero.png`
5. In `img_01` through `img_100`, paste image (or video) paths in display order
6. Save sheet → refresh site → it's live

`.mp4`/`.webm`/`.mov`/`.m4v` paths are auto-routed through Cloudinary's video CDN and rendered as autoplay-muted-loop clips in the gallery.

## How adding a new image to existing project works

1. Upload image to Cloudinary at the right path (e.g. `architecture/tucker/46.png`)
2. Open sheet, find Tucker row
3. Find the next empty `img_NN` cell and paste `architecture/tucker/46.png`
4. Save → refresh → image appears in gallery

## How removing an image works

1. Open sheet, find the cell with that image path
2. Delete the cell content
3. Save → refresh → image is gone from site (file still in Cloudinary — clean up later if you want)

---

## File structure

```
tres-studio/
├── index.html        ← homepage — TRES hero, selected work, categories
├── category.html     ← Architecture / Personal listing (?cat=architecture)
├── project.html      ← single project page (?id=tucker) with prev/next nav
├── about.html        ← about page (typewriter intro)
├── lab.html          ← Lab index — links to four experiments + alternates
├── style.css         ← all main-site styles
├── config.js         ← EDIT ME — sheet URL + Cloudinary base
├── data.js           ← reads + parses the sheet
├── scroll.js         ← Lenis, cursor, reveals, transitions, gallery
├── flow-field.js     ← reactive background canvas (cursor, ball, ripples)
├── letters.js        ← draggable / smashable TRES + cat-link letters
├── dot.js            ← physics for the yellow . that detaches from TRES
├── hero-fx.js        ← homepage-only boids + constellation overlay
├── labs/
│   ├── drift.html    ← fluid sim, six lenses
│   ├── plan.html     ← Langton's ant with constraint variations
│   ├── birds.html    ← boids with rogues
│   ├── field.html    ← vector flow + released disturbances
│   ├── alternates.html  ← directory of alternate-universe sites
│   └── Alternate Sites/alternate2/   ← Three.js particle landing
└── README.md         ← this file
```

---

## Homepage playground (no code needed to use, this is just for reference)

Three layered systems share the same canvas-and-physics playground on the hero:

1. **The yellow dot** — click and drag the `.` to detach it from TRES. Zero-gravity physics, wall bounces. Releases with momentum based on drag speed. Dropping it over TRES glides it back home.
2. **Smash the letters** — grab a TRES letter (or category label letter) directly to detach it, or hit one with a flung yellow dot at speed. Each chunk drifts on its own and tidies itself after 3s of stillness.
3. **Boids + constellation** — five chevrons drift over the hero (one yellow rogue), avoiding any loose letter chunk or the free dot. Throw a letter and they scatter. With 2+ loose pieces, faint dashed yellow lines connect them like a constellation.

Click empty space anywhere on the hero to spawn a flow-field ripple. All of it auto-tidies when you scroll past the hero.

---

## Troubleshooting

**"Loading…" never goes away**
→ Sheet URL probably wrong, or sheet not published. Check `config.js` and your publish status. Open browser console (F12) to see actual error.

**Images don't show but everything else looks right**
→ Cloudinary path mismatch. Check that the path in the sheet exactly matches the public ID in Cloudinary (lowercase, `.png` vs `.jpg`, folder structure).

**A few images are missing but rest works**
→ Those specific images weren't uploaded to Cloudinary yet, or paths don't match. Spot-check by opening the URL directly: `https://res.cloudinary.com/dodk1b5l7/image/upload/architecture/tucker/15.png`

**Site shows old content after I updated the sheet**
→ Google Sheets caches published CSVs for ~5 minutes. Wait a bit, then hard refresh (Cmd+Shift+R / Ctrl+Shift+R).

**Want to test locally before deploying**
→ Don't open the HTML files directly (file://) — browsers block `fetch()` that way. Use a quick local server: in Terminal/Command Prompt, `cd` into the site folder and run `python3 -m http.server 8000`, then visit `http://localhost:8000`.
