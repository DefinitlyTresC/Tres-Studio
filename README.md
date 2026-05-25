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

### 3. Get the gid for each sheet

Open the sheet, click the **Projects** tab. Look at your browser URL bar. You'll see `#gid=0` or `#gid=12345` at the end. That number is the gid. Note it down. Do the same for the **Lab** tab.

### 4. Update `config.js`

Open `config.js` and paste your URLs. The format is:

```js
PROJECTS_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pub?gid=0&single=true&output=csv',
LAB_CSV_URL:      'https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pub?gid=12345&single=true&output=csv',
```

Replace the `gid=` value with what you found above. Keep `&single=true&output=csv` on the end.

### 5. Verify Cloudinary line

`CLOUDINARY_BASE` should already be set to:
```
https://res.cloudinary.com/dodk1b5l7/image/upload/f_auto,q_auto
```
If your cloud name changes, edit it here.

### 6. Deploy

Save `config.js`, push/upload to Netlify. Done.

---

## How adding a new project works

1. Upload images to Cloudinary at `category/slug/hero.png`, `01.png`, `02.png`, etc.
2. Open the Google Sheet → Projects tab
3. Add a new row: fill in Display Name, Slug, Category, Subcategory, Location, Year, Status (Live/WIP/Planned), Order, Description
4. In the Hero Image column, paste: `category/slug/hero.png`
5. In img_01 through img_50, paste the image paths in display order
6. Save sheet → refresh site → it's live

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
├── index.html      ← homepage with name hero + 3 category tiles
├── category.html   ← Architecture or Personal listing (?cat=architecture)
├── project.html    ← single project page (?id=tucker)
├── about.html      ← about page
├── lab.html        ← Lab page (interactive iOS icons with physics)
├── style.css       ← all styles
├── config.js       ← EDIT ME: sheet URLs and Cloudinary base
├── data.js         ← reads + parses the sheet
└── README.md       ← this file
```

---

## Troubleshooting

**"Loading…" never goes away**
→ Sheet URL probably wrong, or sheet not published. Check `config.js` and your publish status. Open browser console (F12) to see actual error.

**Images don't show but everything else looks right**
→ Cloudinary path mismatch. Check that the path in the sheet exactly matches the public ID in Cloudinary (lowercase, .png vs .jpg, folder structure).

**A few images are missing but rest works**
→ Those specific images weren't uploaded to Cloudinary yet, or paths don't match. Spot-check by opening the URL directly: `https://res.cloudinary.com/dodk1b5l7/image/upload/architecture/tucker/15.png`

**Site shows old content after I updated the sheet**
→ Google Sheets caches published CSVs for ~5 minutes. Wait a bit, then hard refresh (Cmd+Shift+R / Ctrl+Shift+R).

**Want to test locally before deploying**
→ Don't open the HTML files directly (file://) — browsers block fetch() that way. Use a quick local server: in Terminal/Command Prompt, `cd` into the site folder and run `python3 -m http.server 8000`, then visit `http://localhost:8000`.
