# Updating pictures without breaking paths

_Written 2026-07-20 for the V3.0 site. Everything here is verified against
the actual code (`src/lib/cloudinary.ts`, `src/lib/sheet.ts`,
`src/content.config.ts`)._

## The one-paragraph version

Yes, we're still on Cloudinary (cloud `dodk1b5l7`). The Google Sheet holds
**raw paths** like `architecture/z07/03.jpg`; the site turns them into CDN
URLs at build time. So a picture only "breaks" if the sheet path and the
Cloudinary path stop matching. Add or replace images in Cloudinary, make the
sheet cells match, then **trigger a redeploy** — the sheet is baked at build
time, so a sheet edit alone changes nothing until the next deploy.

## How a picture gets to the screen

1. **Cloudinary** stores the file at a path you choose, e.g.
   `architecture/z07/03.jpg` (convention: `category/slug/NN.ext`).
2. **The sheet** row for that project holds that raw path in `Hero Image`
   or an `img_01`…`img_100` column. No URLs, no transforms — just the path.
3. **The build** turns the path into
   `https://res.cloudinary.com/dodk1b5l7/image/upload/f_auto,q_auto/w_900/architecture/z07/03.jpg`
   (the site picks the width: `w_900` grid tiles, `w_1800` lightbox,
   `w_2400` hero). Videos (`.mp4/.webm/.mov/.m4v`) automatically route
   through `/video/upload` instead.

## The rules that keep paths safe

- **Never rename or move existing Cloudinary folders/files** unless you
  update every sheet cell that mentions them in the same sitting.
- **Never put transforms or full URLs in the sheet** — raw path only. The
  code adds `f_auto,q_auto` + widths itself.
- **Adding new files is always safe.** Nothing references them until you
  put the path in the sheet.
- **Match case and extension exactly.** `03.JPG` ≠ `03.jpg` in a URL.

## Recipe A — add new pictures to a project (safest, do this by default)

1. In Cloudinary's Media Library, go to the project folder
   (`category/slug/`) and upload with the next numbers: `07.jpg`, `08.jpg`…
2. In the sheet, put `category/slug/07.jpg` in the next empty `img_NN`
   column of that project's row.
3. Redeploy (push anything, or Netlify → Deploys → **Trigger deploy**).

## Recipe B — replace a picture with a better version

**Preferred: give it a new name.** Upload `03b.jpg` (or the next free
number), change the sheet cell from `…/03.jpg` to `…/03b.jpg`, redeploy,
optionally delete the old file later. Zero cache ambiguity — the new URL has
never been seen by the CDN, so the new image shows up instantly everywhere.

**In-place swap (same name):** Media Library → the asset → **Replace**.
The path (and every sheet cell) stays valid — nothing to edit, no redeploy
even needed. Caveat: the CDN has cached copies of the derived sizes, so give
it a few minutes and hard-refresh before concluding it didn't work. If an
old version stubbornly lingers, fall back to the new-name recipe.

## Recipe C — reorder a project's gallery

Order = column order (`img_01` first). Shuffle the paths between the
`img_NN` cells in the sheet; no Cloudinary changes at all. Redeploy.

## Recipe D — change a hero

Put the (new or existing) path in the `Hero Image` cell. Heroes render big
(`w_2400`), so upload heroes at 2400px+ on the long side when you can.

## After any sheet edit

**Redeploy, always.** The build fetches the published sheet CSV and bakes
it in; the browser never reads the sheet. The build also refreshes
`src/data/sheet-snapshot.csv` (the offline fallback) — commit it when it
changes next time you're in the repo, but don't sweat it: Netlify builds
fetch the live sheet regardless.

## Quick sanity check when something doesn't show

1. Open the image URL directly:
   `https://res.cloudinary.com/dodk1b5l7/image/upload/f_auto,q_auto/<the-sheet-path>`
   - 404 → the sheet path and the Cloudinary path disagree (typo, case,
     wrong folder, wrong extension).
   - Shows the OLD image → CDN cache; wait a few minutes or use a new name.
2. If the URL is fine but the site is stale → you didn't redeploy.
