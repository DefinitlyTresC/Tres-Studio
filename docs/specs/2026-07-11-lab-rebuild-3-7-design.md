# Lab rebuild 3–7: echo, field, plan, pulse, alternates

2026-07-11 · Fable · continues the 2026-07-04 rebuild (birds, drift).
Standing authorization: Tres, "go off / redo in totality" (REBRAND.md §top).

## The family contract (established by birds + drift — binding)

- Dusk-black paper `#07080B` (baked layer: gradient + seeded grain, rebuilt
  on resize only), Space Mono 400/700 the only face, lowercase everywhere.
- One yellow accent `#F5CB5C` per piece, spent deliberately.
- Chrome: `tres carter.` top-left → `/`, `[ ← lab ]` top-right → `/lab`,
  bracketed `[ mode ]` buttons right-center column (bottom row ≤700px,
  44px targets), wordmark bottom-left (`name.`), hint bottom-right that
  fades on first input. `.sr` description, noscript fallback,
  focus-visible yellow outline. Umami + host-guarded Clarity.
- The scene is alive on its own (drift's breath events, birds' gusts) —
  never blank waiting for input.
- Reduced motion always works: sim calms, never breaks. No numbered
  decoration. Gated hovers. Same URLs.
- Idioms: IIFE `'use strict'`, DPR capped at 2, mode = complete param
  object, keys mirror buttons, two-finger gestures never fight the page.

## The series reading

birds = the sky at dusk. drift = the air. The five continue the field-study
album: echo = the water, field = the grass, plan = the drafting table,
pulse = the dark underneath, alternates = the index of the whole multiverse.

## echo. — rain on a still pool  (was: timed ring-crossing arcade game)

Score/timer/lives chrome dies. A pond at dusk; the same moon as birds,
reflected — the family's two pages share one sky.

- **Core:** Hugo Elias two-buffer wave field (u' = neighbor-avg·2 − u_prev,
  damped ~0.985) at reduced grid (~viewport/4, clamped), rendered by
  ImageData: height → shade, gradient → moon-reflection refraction (offset
  lookup into a baked moon-column mask). Real interference for free.
- **Interactions:** move/drag = wake (small continuous disturbance),
  tap = a drop (clean ring), hold = rain gathers where you hold.
- **Alive:** sparse ambient drips; occasionally a single yellow leaf
  (the accent) falls, lands with a ring, and drifts on the wave gradient.
- **Modes:** `[ still ]` `[ drizzle ]` `[ deluge ]` — drip rate/energy;
  deluge adds wind-slanted micro-drops. Keys 1/2/3.
- **PRM:** ambient rain off, damping higher, taps still ring (slower).
  Grid solver runs regardless — it's ambient, not vestibular; motion is
  gentle by construction. No leaf under PRM.

## field. — wind through tall grass  (was: flow-field particle streams)

The vector field made visible as a meadow. Research: blade = quadratic
curve bent at tip by wind; dual-frequency sway; local gust pockets.

- **Core:** 3 depth layers of blades (~2.5–5k total by viewport; far =
  short/dim, near = tall/bright). Wind = advected value noise (the field)
  + discrete gust fronts that sweep visibly across (drift's breath analog).
  Blade physics: tip displacement spring-returns; flutter grows toward tip.
- **Accent:** ~7 fireflies wandering above the grass — hold gathers them
  to the hand (birds' gather echo), tap startles them apart.
- **Interactions:** move = part the grass, hold = press a circle down +
  gather fireflies, tap = radial shock through blades.
- **Modes:** `[ lull ]` `[ breeze ]` `[ squall ]`. Keys 1/2/3.
- **PRM:** gust fronts off, sway amplitude floor, fireflies drift slow &
  never dart; interactions still bend blades (slowly).

## plan. — the unattended draftsman  (was: Langton's ant + rule-deck tool UI)

Langton's ant kept — it IS the piece (and the architecture pun). The
engineering UI (rule deck, slider, readouts) dies; watching replaces
configuring.

- **Core:** multi-state Langton on an offscreen cell grid blitted to
  screen; graph-paper hairlines on the paper bake. Trails = white-alpha
  ink ramp per state; the ant = one yellow cell (the accent). Speed ramps
  itself: first turns readable, then accelerates smoothly to thousands of
  steps/frame — a plan drafting itself in time-lapse.
- **Rules as modes (curated, verified):** `[ highway ]` RL (classic),
  `[ bloom ]` LLRR (symmetric organism), `[ estate ]` LRRRRRLLR (grows a
  walled square filled with bouncing corridors). Mode switch = fresh sheet.
- **Interactions:** tap = seed another ant (≤5); `[ again ]` = fresh
  sheet. Keys 1/2/3, r.
- **PRM:** no auto-ramp — a fixed contemplative rate.

## pulse. — sounding the dark  (was: orbit-dodge game with lives/combo)

Expanding rings kept, arcade dies. Sonar: the page is pitch dark; pings
reveal a hidden terrain.

- **Core:** hidden heightmap (value noise → contour polylines, extracted
  once per world on a worker-free grid — marching squares at build).
  A ping = expanding wavefront; contour segments within the front's band
  light up then phosphor-decay. High summits answer: a faint yellow
  return blink (the accent) after the front passes.
- **Alive:** a distant beacon pings ambiently every ~9s from a fixed
  point, so the dark always breathes.
- **Interactions:** tap = ping, hold = ping train, move = faint local
  shimmer (a hand across the chart).
- **Modes = worlds:** `[ ridge ]` (mountain contours) `[ atoll ]`
  (islands) `[ blocks ]` (rectilinear city — the architect's world).
  Keys 1/2/3.
- **PRM:** fronts expand slower, no ambient beacon, decay lengthened
  (no flicker).

## alternates. — the index of the multiverse  (was: Oswald "SOON" stub)

The multiverse shipped 2026-07-03 — six universes are real now. This page
stops apologizing and becomes the honest map: the only place all six are
listed. This one scrolls (it's an index, not a sim).

- Six doors — swatch dot (from the registry colors), name (one / two /…),
  one-line character (`pencil on cream`, `zero gravity`, `ascii`,
  `the orange 03`, `sideways`, `the hang`), deep link `/1/`…`/6/`.
- `[ roll the dice ]` → `/` (the front door re-rolls; mv_last cookie
  guarantees somewhere new).
- The old Three.js particle experiment stays at the bottom as
  `proto — an abandoned universe` → `Alternate Sites/alternate2/`.
- Small header canvas: six swatch motes drifting slowly (PRM: static).
- Registry duplicated as a literal (static HTML can't import
  multiverse.ts); comment cross-references src/lib/multiverse.ts.

## Cross-cutting

- Portal tags in `src/pages/lab.astro`: echo → "rain on a still pool",
  field → "wind through tall grass", plan → "the unattended draftsman",
  pulse → "sounding the dark", alternates → "six doors, one front door".
- Door SVGs unchanged (still true to each concept).
- Order of work: echo → field → plan → pulse → alternates, verified in
  the preview browser (desktop + 375px, console clean) piece by piece;
  commit per piece, push at the end; REBRAND.md updated last.
- V1 originals live on in git history; `labs/` at repo root is the old
  V1 site's copy and is not touched (production serves `public/labs/`).

## Not doing

Sound (labs are silent), localStorage bests (games died), library
dependencies (family rule: none), touching the lab.html V1 page at root.
