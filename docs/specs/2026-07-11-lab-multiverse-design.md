# The Lab, Multiverse Edition — design

_2026-07-11 · Fable, design lead. Supersedes the one-album lab family look
(docs/specs/2026-07-11-lab-rebuild-3-7-design.md) at Tres's direction:
"make the theme align with the site it is associated with … a full rewrite,
new inspiration … an experience that is unique on each one."_

## 0. The concept

The lab stops being one album and becomes **seven field trips**. Each
experiment is adopted by one universe and rebuilt ground-up in that
universe's full brand language — its paper, its ink, its display face, its
signature devices. The conceit: **each universe keeps a lab piece — it's
what that universe does after hours.**

| piece | universe | one line |
|---|---|---|
| plan. | 1 — the sketchbook | a house plan drafts itself in pencil |
| birds. | 2 — zero gravity | a murmuration you can grab and throw |
| pulse. | 3 — ascii | sounding a blank sheet in glyphs |
| field. | 4 — the print sheet | wind through a live halftone raster |
| echo. | 5 — chromatic plates | water that slips out of register |
| drift. | 6 — the hang | suminagashi, hung by chance |
| stock. | 8 — the drop | midnight in the stockroom (NEW page) |
| alternates. | the space between | the index — stays dusk-black, updated |

Names/URLs are unchanged (tracking continuity); `stock.html` is the one new
URL, for the one universe that never had a piece. `alternates.html` keeps
the old dusk-black family skin on purpose — it is the index, the space
*between* universes.

## 1. Contracts preserved (function + trackability first)

- **URLs:** `/lab` + `/labs/{birds,drift,echo,field,plan,pulse,alternates}.html`,
  plus new `/labs/stock.html`. The proto at `/labs/Alternate Sites/…` untouched.
- **Tracking:** exactly one mechanism — `<script defer src="/ts.js"></script>`
  in `<head>` with the provenance comment. Nothing else, ever.
- **Nav contract (every piece):** `.mark` "tres carter." → `/` (top-left),
  `.back` "[ ← lab ]" → `/lab` static (top-right), `.mark-bottom` = piece
  name bottom-left, `.hint` bottom-right fades on first input, `.modes`
  bracketed buttons right-center column desktop / centered bottom row
  ≤700px, 44px targets, `data-mode` + `aria-pressed`, `.sr` description,
  `<noscript>` fallback. All of it **restyled per universe** — same bones,
  native skin.
- **NEW nav element — the provenance tag:** each piece carries a small mono
  link to its universe (`from universe 01` → `/1/`), styled natively per
  universe (site 4 folds it into the warning strip, site 6 into the wall
  label, site 8 onto a shelf label…). This is the visible thread of the
  adoption concept.
- **Favicon:** drop the per-page inline SVG icon links — the site-wide
  die-3 `/favicon.ico` auto-discovers (ts.js consolidation philosophy).
- **PRM (two layers, kept):** CSS `transition:none` on chrome; JS
  `PRM` constant that *slows/holds* each sim — never blank, never paused.
- **QA hook (now universal — closes the birds/drift gap):**
  `window.__lab = { tick(n,ms), snap(w=320 → jpeg .82), info(), …per-sim }`
  gated `localhost || ?qa`. All ambient scheduling runs off the FRAME
  clock, never `performance.now()` — synthetic stepping must equal real time.
- **Sizing:** desktop + 375px both first-class; DPR capped ≤1.5–2 per piece.
- **No-slop laws:** no italic serifs, no numbered decoration (universe brand
  numerals like the 03/№ are brand, not decoration), gated hovers, named
  transitions, reduced-motion always works.

## 2. The seven pieces

### plan. → universe 1 (the sketchbook) — "the night shift"

Cream `#FFEDDB` under the watercolor-paper grain (two feTurbulence layers,
fiber 0.7/0.045 + mottle 0.045/0.03, as `_paper.astro`). Ink graphite
`#2B1F1A`; sanguine `#B4543B` red-pencil accents; umber `#BF9270` period.
Archivo chrome, **Caveat** room labels, Space Mono specs.

**The piece:** an unattended draftsman drafts a small house, stroke by
stroke, in pencil — for real this time (the old piece was the metaphor;
this is the drawing). Pipeline per commission: exterior envelope → BSP room
split (aspect-guarded) → wall poché (double-line, exterior heavier) → door
openings + swing arcs → window ticks on exterior walls → dimension lines
with 45° slash ticks → Caveat room labels ("bed.", "kitchen.", "porch.") →
north arrow → signs "tres." and rests. Strokes have pencil life: slight
jitter, width/pressure variance, visible traveling pencil point. Then the
sheet slides away and the next commission begins.

**You share the sheet:** your pointer is a graphite pencil — draw freehand
over the plan while it drafts (site 1's identity). Tap = also draws (a dot);
[ next ] = new commission now. Modes = typologies: **[ cottage ]**
(compact), **[ courtyard ]** (rooms wrap a void), **[ longhouse ]**
(linear) + **[ next ]**. Hint: `watch it draft · draw with it`.
PRM: steady calm drafting rate, no time-lapse ramp.
`info(): {rooms, strokes, stage, mode}`.

### birds. → universe 2 (zero gravity) — "a murmuration in the void"

Paper `#FAFAF7`, ink `#101010`. Hanken Grotesk chrome, Space Mono labels.
No moon, no wire, no dusk — a white void where the flock is the only mass.

**The piece:** black bird-marks in weightless drift (boids, no gravity, no
ground). Site-2 physics grammar everywhere: **grab a bird and throw it**
(spring-drag, release flings; neighbors flinch); **click a bird → its color
cycles** the zerog palette `#FF4D00 #2431FF #00934D #E62E8A #7A1FE0
#F0A400` (colored birds stay colored — collect them); tap empty space =
soft scatter puff; hold = gather to the hand. **The identity moment:** now
and then the flock condenses into the drifting TRES letterforms (targets
sampled offscreen from Hanken Grotesk 800), holds a breathing beat — the
period formed by whichever birds you've colored, if any — then lets go.
Modes: **[ drift ]** (rare letters) **[ spell ]** (letters often)
**[ frenzy ]** (fast, jittery, never spells). Hint:
`throw a bird · click one for color`. PRM: slower flock, letters form by
fade-drift. `info(): {birds, colored, forming, mode}`.

### pulse. → universe 3 (ascii) — "sounding the blank sheet"

White `#FFFFFF`, ink `#141414` — the dark inverts: pings print ink onto
blank paper. JetBrains Mono glyph atlas (700), Anybody Black wordmark,
site-3's character-arrow cursor. Footer hairlines dashed, site-3 style.

**The piece:** a hidden terrain under a blank sheet. Tap = ping — a ring of
boiling scramble-glyphs expands; where it crosses terrain, cells resolve
through the density ramp `' .:-=+*#%@'` (fbm heightfield → ramp; Sobel
edges print as `| \ - /`), then decay back toward sparse `·` dust. The
highest ground answers ~0.5s later as **inverted cells** (ink block, paper
glyph) — site-3's block-invert. Hold = ping train. Move = faint glyph heat
wake. Worlds: **[ ridge ]** **[ atoll ]** **[ blocks ]** (reseeds). Glyph
atlas (offscreen, ~10× fillText); only non-blank cells draw. Hint:
`tap to sound the sheet`. PRM: slower rings, gentler boil.
`info(): {cols, rows, rings, mode}` + `ping(x,y)`.

### field. → universe 4 (the print sheet) — "the living raster"

Orange `#EC5B13` stock, ink `#141210` dots, beige `#E8DCC6` second plate.
Inter Tight 900 chrome, Space Mono marginalia. Film grain overlay
(fractalNoise 0.8/3 @ 0.11 soft-light), crop marks, vertical `FIG. 04`,
`PROPRIETARY`, and the warning strip carrying the provenance tag:
`⚠ FIELD — LIVE RASTER · FROM UNIVERSE 04`.

**The piece:** the halftone raster is the grass. A wind field (advected
value-noise + traveling gust fronts — the old field's soul) modulates dot
radius across a 45°-screened grid: `r = Rmax·sqrt(darkness)`, Rmax ≈
0.65·cell, dot-gain curve `d^0.85`, static seeded jitter (±0.1·cell pos,
±7% r) so it reads as print, not grid. Wind = waves of tone rolling through
the sheet. Move = dot-gain lens under the cursor; drag = drag a gust;
tap = ink drop blooming outward; hold = burnish (local darkening, slow
relax). **[ coarse ]** (~14px cell) **[ fine ]** (~9px) **[ overprint ]**
adds the beige plate at 75° (darkest-at-45° riso convention), plates
multiply-composited at α≈0.85 with per-print misregistration (1–3px,
≤0.5°) — the wind beats the two screens into **live moiré**. One path per
plate per frame (batched arcs — 10–20k dots comfortable). Hint:
`drag the wind · hold to burnish`. PRM: lull-speed wind only.
`info(): {cells, plates, mode}`.

### echo. → universe 5 (chromatic plates) — "the registration pool"

White paper, near-black linework that is secretly **two plates** — blue
`#2431FF` and red `#E82929` — multiply-composited so overlap goes ink-dark.
Bungee Shade wordmark, Space Mono chrome, the blue registration-mark
crosshair fixed top-right (site 5's device).

**The piece:** the Hugo-Elias wave pool stays as the engine; the rendering
is reborn as print: the height field is drawn as contour line art (marching
squares, 3–4 iso levels) — and every segment is stroked twice, once per
plate, offset by **local water velocity × gain** in opposite directions
(clamped ~6px / ≤0.4°-equivalent — print slip, never glitch). A still pool
is one crisp near-black drawing in perfect register; a drop tears the
wavefronts into blue/red ghosts that chase the ripple outward and
re-register as the water calms. The registration crosshair top-right
**trembles with global misregistration** — the piece's dial. Drag = wake,
tap = drop, hold = rain. Modes: **[ still ]** **[ drizzle ]**
**[ deluge ]**. Hint: `drop a stone · watch it slip register`.
PRM: slower waves, offsets halved. `info(): {GW, GH, drops, mode}` +
`drop(x,y)`.

### drift. → universe 6 (the hang) — "suminagashi, hung by chance"

Gallery white `#FAF8F3`, ink `#141310`, quiet `#6B665A`. Schibsted Grotesk
chrome, Space Mono catalog tags. Bottom-left is a **museum wall label**:
`drift — ink on water · no. NNN — chance operations` (NNN = the visit seed,
site 6's device; links `/6/` as the provenance tag). If you don't touch for
a while: `( you may touch this one )`.

**The piece:** mathematical marbling (Jaffer's closed-form ops — exact
equations from the research notes). Ink drops are polygons (adaptive
vertices); a new drop displaces every older vertex by the drop-injection
map; dragging is a **tine stylus** (exponential-falloff line deformation).
Flat hard-edge pigment fills only — the hang's flatness — chance-colored
per visit from the exhibition palette `#E8442E #C7356B #6B4C9A #2E5EA8
#1F8A70 #E3B71F #141414` (+ `#FF5A1F` rationed like the period-dot: rare,
loudest). Ambient: the surface lays its own chance-timed drops. Tap = drop;
drag = comb; hold = **suminagashi rings** (alternating ink/paper circles).
Modes: **[ stone ]** (chance drops) **[ rings ]** (ambient goes concentric)
**[ combed ]** (periodic auto-tine passes) + **[ rehang ]** (fresh sheet,
new chance palette, new no.) + **[ save ]** (PNG — marbled paper to keep).
Vertex budget: drops ~96–192 verts, adaptive subdivide on stretch, global
cap; ops are event-driven (render is just polygon fills). Hint:
`drop ink · drag to comb`. PRM: ambient drops only, no auto-combing.
`info(): {drops, verts, seed, mode}`.

### stock. → universe 8 (the drop) — "midnight in the stockroom" (NEW)

Warm white `#F6F4EE`, ink `#141310`, stamp red `#D8341F`, stock green
`#00934D`. Hepta Slab chrome (900 wordmark), Space Mono shelf labels.
Drawn shelf rules with bracket-tick ends: `shelf a — inbound`,
`shelf b — oversize`, `floor — mind the stock`; a shelf label carries the
provenance tag → `/8/`.

**The piece:** the stockroom at night, receiving. Parcels (rounded-rect
bodies, kraft-toned with Space Mono stock codes, some stamped green `08`)
drop in from above — G=2600 canon, squash on thud, AABB stacking, contact
shadows, sleep. Grab/throw anything; a **true click stamps it** (red
two-arc stamp thunks on) and drops it a level — site-8's canon gesture.
Strays on the floor get reshelved by the invisible stockkeeper, one at a
time, unhurried (1.4s gap). Ambient: a new parcel arrives every so often;
past ~26 bodies the oldest quietly ships out. Modes: **[ receiving ]**
(steady arrivals) **[ inventory ]** (the stockkeeper re-sorts everything
by size, neatly) **[ rush ]** (arrival rate up; the stockroom struggles).
Fresh small canvas engine in-page (grav.js constants as canon; grav.js
itself stays DOM-bound to its universe). Hint: `throw the stock · click to
stamp`. PRM: parcels fade-place instead of dropping.
`info(): {bodies, asleep, mode}`.

### alternates. — the index (content pass only)

Keeps the dusk-black family skin (it is the space between universes). Each
universe door gains its adopted piece: `one — pencil on cream · keeps
plan.` etc. Copy notes the adoption conceit in one line. Door seven still
reads as the open door. Proto row unchanged.

## 3. The portal — lab.astro (moderate pass)

- Door plates gain the universe thread: swatch dot (registry color) +
  `№ 01` mono tag per door; doors ordered by universe (plan 01 → stock 08,
  alternates last).
- Tag lines updated: plan "a plan drafts itself", birds "a murmuration,
  loose in the void", pulse "sounding the blank sheet", field "wind through
  the raster", echo "water, out of register", drift "ink on water, hung by
  chance", stock "midnight in the stockroom", alternates "seven doors, one
  front door".
- SKINS extended 1–5 → +6 (Schibsted Grotesk) +8 (Hepta Slab); reroll copy
  and anti-repeat pool become registry-length-driven (`skin 0X/07`).
- Everything else (MV_CLIENT(0), curtain doors, mv:covered clear, back-link
  referrer→mv:u logic, ring/ticker) unchanged.

## 4. Performance budget

≤3ms/frame desktop per piece (measured via QA hook timing), no long tasks
at boot beyond font+atlas bake, DPR-capped, mobile-tested at 375px. Batched
paths everywhere (one fill/stroke per plate/layer per frame where possible).

## 5. Verification plan

1. `astro build` green.
2. Dev server + browser pass per piece: all modes, all gestures, desktop +
   375px, zero console errors.
3. QA-hook synchronous stepping + snaps for visual judgment (occluded-window
   rAF starvation canon); frame-clock ambience means synthetic time is
   truthful.
4. Tracking: `window.TS` boots on every page; no second tracker anywhere.
5. Adversarial multi-agent review round; confirmed findings fixed before
   commit.
6. Commit on `astro-migration`; **no push without Tres's explicit go.**

## 6. Open flags for Tres

- Motion pacing everywhere (constants at the top of each inline script).
- stock. is a NEW page/URL — blessing the name is yours.
- alternates. stays dusk-black by design — flag if you want it re-skinned.
- The portal doors now wear universe swatches — the strongest visual change
  on /lab itself.
