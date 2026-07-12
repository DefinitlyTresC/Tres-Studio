# tres.studio — Universe 02 (Particle Field)

Experimental "alternate universe" version of the studio site. The page is
a WebGL particle field — words and marks are formed by ~80,000 particles
that respond to the cursor. Same content source as the main site
(Google Sheet → published CSV → live fetch).

---

## Files (5 total)

- `index.html` — entry point
- `landing.css` — all styling
- `landing.js` — particle system, physics, sheet data, dive transitions
- `config.js` — same sheet URLs as the main site (DO NOT edit unless main site config changes)
- `data.js` — sheet fetch + parse (same as main site)

External libraries loaded from CDN:
- Three.js 0.149 (WebGL renderer)
- Lenis 1.1 (smooth scroll)
- PapaParse 5.4 (CSV parsing)

---

## How to deploy

1. Drop this entire folder into `Tres Studio v1.2/labs/Alternate Sites/`
2. The folder should end up like: `Tres Studio v1.2/labs/Alternate Sites/index.html` etc.
3. That's it — no build step. The site fetches projects from the published
   sheet on every page load, exactly like the main site.

The escape links out of this lab were rewritten 2026-07-11 to root-absolute
clean URLs (`/`, `/architecture`, `/personal`, `/lab`, `/project/<slug>`) —
on the Astro multiverse site this folder serves from
`/labs/Alternate Sites/alternate2/`, three levels deep, where the original
relative `../../*.html` paths all 404'd. The links now work from any depth.

---

## How to test locally

Double-click `index.html`. The particle field loads, sheet data fetches.
The dive-to-main-site navigation links will 404 locally because they
expect the main site to live up two levels — that's fine for testing
the particles, just deploy the whole thing to see navigation work.

---

## Interactions

- **Move mouse** — particles get pushed gently aside, then bounce back
  like plucked strings (smooth inverse-quadratic falloff, no hard radius)
- **Hold mouse button down** — particles get smoothly attracted toward
  your cursor for as long as you hold. Release = back to default repel.
  No toggle, no sticky state.
- **Hold mouse over a wordmark band** (Architecture / Personal / Lab) for
  ~400ms — dives into that category on the main site
- **Click the explicit yellow HOLD TO ENTER button** — also dives
- **Click a project name in any list** — opens that specific project page
- **Scroll** — smooth-scroll through five scenes: HERO, Architecture,
  Personal, Lab, Contact
- **iOS / touch** — click-attract is disabled on coarse pointers so
  touch-drag scrolls cleanly. Particles still react to touch movement.

---

## Performance note

Desktop runs ~120,000 particles per frame at 60fps on modern hardware.
On touch devices (iOS), particle counts auto-scale to ~55% for smoothness.
If you want to dial it up or down, edit `SCENE_COUNTS` and
`AMBIENT_PER_SCENE` at the top of `landing.js`.
