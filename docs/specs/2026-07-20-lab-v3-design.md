# Lab V3 — six floating doors (design + build contract)

_2026-07-20. Tres: "clean up the lab now that we have collapsed the site
layout… each of these smoothed out rounded boxes should be able to float
around. you should be able to drag things around… keep it clean and
sophisticated, but playful like the main portion of the site."_

Every builder reads this FIRST. It is the single source of truth for brand,
page skeleton, physics wiring, and the URL contract.

## The new lab map

`/lab` becomes SIX floating door-cards (zero-g physics, draggable):

| # | Door | Target | Icon idea | Notes |
|---|------|--------|-----------|-------|
| 1 | **Games** | `/labs/games` | a toy (spinning pinwheel) | hub holding ALL seven sims (plan, birds, pulse, field, echo, drift, stock) |
| 2 | **Plugins** | `/labs/plugins` | plug/download-into-tray | pyRevit extension downloads, listed from a folder at build time |
| 3 | **Alternates** | `/labs/alternates.html` | the orbit dots (existing) | museum of every site this site has been, incl. the dot proto |
| 4 | **Satisfactory** | `/labs/satisfactory` | conveyor + parcel | stub page — another chat wires up the real visualizer later |
| 5 | **Roadmap** | `/labs/roadmap` | branching path + nodes | flowing branching timeline of the site's history, data-driven |
| 6 | **WIP** | none (NOT a link) | diagonal stripes | draggable square, `data-zg-color` so a click cycles its color |

Deeper URLs:
- The 7 sims stay at `/labs/<name>.html`; their `[ ← lab ]` back link is
  patched to `/labs/games` (label `[ ← games ]`) and their "from universe
  0N" provenance links are patched to `/alternates/N/`.
- Universe exhibits (restored landings): `/alternates/1/ … /alternates/6/`
  and `/alternates/8/` (Astro pages `src/pages/alternates/N/index.astro`).
- The dot proto (three.js particle field): static files restored to
  `public/alternates/dot/` → served at `/alternates/dot/`.
- Sub-page back links: games/plugins/satisfactory/roadmap → `/lab`;
  alternates.html back → `/lab`; exhibits carry a museum chip →
  `/labs/alternates.html`.

## Brand (the site's own — the old multiverse skin 02)

- paper `#FAFAF7` · ink `#101010` · accent (quiet) `#9A9A9A`
- soft text `rgba(16,16,16,0.5)` · hairline `rgba(16,16,16,0.16)` /
  borders `rgba(0,0,0,0.14)`
- display: `'Hanken Grotesk', system-ui, sans-serif` (wght 800 for marks,
  700 mid) · mono: `'Space Mono', ui-monospace, monospace`
- Google Fonts: `Hanken+Grotesk:wght@400;700;800` + `Space+Mono:wght@400;700`
- door shape: tall doorway, `aspect-ratio: 10/17`, border
  `1px solid var(--ink)`, radius `999px 999px 0 0` (the arch), bg paper
- `::selection { background:#101010; color:#FAFAF7 }`
- zerog color palette (for reference): `#FF4D00 #2431FF #00934D #E62E8A
  #7A1FE0 #F0A400`
- Voice: lowercase-leaning mono labels, playful specs ("eight doors, one
  quiet room" cadence). Clean and sophisticated, never cluttered.

## Page skeleton conventions (Astro pages)

Self-contained `.astro` files, no layouts, no external CSS:
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`
- `<meta name="robots" content="noindex" />` (site-wide posture, SEO pass pending)
- `<meta name="theme-color" content="#FAFAF7" />`
- fonts preconnect + the Google Fonts link above
- tracking, verbatim comment + tag:
  `<!-- tracking: one bootstrap for the whole site (Umami + Clarity + visitor id + self-exclusion) - public/ts.js -->`
  `<script is:inline defer src="/ts.js"></script>`
- curtain reveal on every page:
  `<script is:inline type="module">import { autoReveal } from '/mv/curtain.js'; autoReveal();</script>`
- the back link rides the cursor (the site-wide pattern — copy verbatim from
  `src/pages/work.astro`: fixed left, `--y` follow, touch guard, PRM off)
- styles in `<style is:inline>`; scripts `is:inline`; 44px hit targets
  (pad out / margin back in); `:focus-visible { outline: 2px solid #101010; outline-offset: 3px; }`
- `@media (prefers-reduced-motion: reduce)`: kill transitions/animations,
  pages must read perfectly at rest

## Zero-G wiring (floating door-cards)

Engine: `/mv/zerog.js` (do NOT modify it). Recipe:

1. The room: `<nav class="hall" data-zg-room>` — `position:relative` is
   applied by the engine; give it an explicit height (see layouts below)
   and `width:100%; max-width:1240px; margin:0 auto`.
2. Each door: `<a class="door" data-zg data-zg-slim data-home-x="…"
   data-home-y="…" data-home-xn="…" data-home-yn="…"
   style="--hx:…; --hy:…; --hxn:…; --hyn:…">` — slim is REQUIRED (it keeps
   `touch-action: pan-y`, so phones can still scroll the page over the
   doors).
3. Parking CSS (engine hands over via `.sim`):
   ```css
   .door { position:absolute; left:calc(var(--hx)*1%); top:calc(var(--hy)*1%);
           translate:-50% -50%; width:<door width clamp>; aspect-ratio:10/17; }
   @media (max-width:640px){ .door { left:calc(var(--hxn)*1%); top:calc(var(--hyn)*1%); } }
   .sim .door { left:0; top:0; translate:none; will-change:transform; }
   ```
4. **The engine owns the outer element's `transform` (inline, every
   frame).** ALL cosmetic transforms — entrance rise animation, hover
   scale, `:active` press — go on an INNER wrapper (`.din`, fills 100%),
   never on the `[data-zg]` element itself. The border/arch/background
   live on `.din` too.
5. Collision math (bodies are circles): `r = (w + h)/4 ≈ 0.675 × door-width`
   (10/17 aspect). Neighboring percent homes must sit ≥ `2r = 1.35 ×
   door-width` apart in px at every viewport their layout serves — this is
   why the layouts below are prescribed. Wander adds ±~28px on top; the
   engine clamps bodies inside the room.
6. Cursor affordance: `.sim .door { cursor: grab; } .sim .door:active { cursor: grabbing; }`
   under `(hover:hover) and (pointer:fine)`.

### /lab layout (6 doors)

Door width `clamp(150px, 21vw, 230px)`.
- Wide (>640px): hall height `max(960px, 96svh)` (floor amended post-review:
  the 29/71 middle column must clear a full parked door height, 391px, on
  short laptops). Homes (x,y in %):
  Games (18,25) · Plugins (50,29) · Alternates (82,24) ·
  Satisfactory (18,75) · Roadmap (50,71) · WIP (82,76).
- Narrow (≤640px): hall height `1700px`. Single column, xn=50 for all;
  yn = 9, 25, 41, 57, 73, 89 (same door order).

### /labs/games layout (7 doors)

Door width `clamp(150px, 21vw, 230px)`.
- Wide: hall height `max(1310px, 118svh)` (floor amended post-review: the
  closest row pair, 30% apart, must clear a full parked door height). The
  hall also needs `position: relative` in page CSS — the engine only applies
  it after boot, and reduced-motion visitors see the parked layout. Rows 3/2/2:
  Plan (18,17) · Birds (50,20) · Pulse (82,16) ·
  Field (32,50) · Echo (68,50) ·
  Drift (32,84) · Stock (68,82).
- Narrow: hall height `1950px`. xn=50; yn = 8, 22, 36, 50, 64, 78, 92
  (order: plan, birds, pulse, field, echo, drift, stock).

## Curtain (door-open ritual)

Doors open through the ink: intercept clicks at the DOCUMENT level (the
engine's own element-level click listener must run first so its drag
suppression is respected):

```js
import { autoReveal, cover } from '/mv/curtain.js';
autoReveal();
let reduce = false;
try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
let leaving = false;
addEventListener('pageshow', (e) => { if (e.persisted) leaving = false; });
document.addEventListener('click', async (e) => {
  const a = e.target.closest && e.target.closest('a.door');
  if (!a) return;
  if (e.defaultPrevented) return;               // zerog suppressed a drag-click
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
  if (reduce) return;                            // plain navigation
  if (leaving) { e.preventDefault(); return; }
  e.preventDefault();
  leaving = true;
  const r = a.getBoundingClientRect();
  await cover({ x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2, color: '#101010' });
  // Destinations WITHOUT autoReveal (the 7 static sims, /alternates/dot/)
  // must clear the flag so the next site page doesn't peel a ghost:
  //   try { sessionStorage.removeItem('mv:covered'); } catch (err) {}
  // Destinations WITH autoReveal (all Astro pages, alternates.html after its
  // update, the universe exhibits) keep the flag and peel it themselves.
  location.href = a.getAttribute('href');
});
```

/lab's six destinations all autoReveal → never clear the flag there.
/labs/games' seven sims do NOT autoReveal → always clear it there.
alternates.html: exhibits autoReveal (keep flag); the dot proto does not
(clear flag for that link only).

## Universe exhibits (the museum)

Source of truth: `git show 1bff1ef:src/pages/<N>/index.astro` (the last
multiverse commit). Port to `src/pages/alternates/<N>/index.astro` with
ONLY these edits — stay byte-faithful otherwise:
1. Drop `import { MV_CLIENT } …` and its `<script is:inline set:html={MV_CLIENT(N)} />`.
2. Drop `import('/mv/ring.js');` (keep `autoReveal()`).
3. Drop `<script is:inline defer src="/mv/ticker.js"></script>` and, if the
   footer has it, the `<span id="mv-ticker-slot"></span>` (the counter
   belongs to the living site, not the museum).
4. Retarget nav: `/N/work` → `/work`, `/N/archive` → `/archive`,
   `/N/about` → `/about`; `/lab`, `/privacy`, `/resume.pdf`,
   `/portfolio.pdf`, mailto/socials stay.
5. Fix relative import depths (`../../lib/…` → `../../../lib/…` etc. — the
   page moved one level deeper). Site 1's `_paper.astro` / `_pencil.astro`
   come along into `src/pages/alternates/1/` (underscore = non-route).
6. Add the museum chip, immediately after `<body>` opens:
   ```html
   <a class="alt-chip" href="/labs/alternates.html">alt 0N · all alternates</a>
   ```
   ```css
   .alt-chip { position: fixed; top: 14px; right: 14px; z-index: 300;
     font-family: 'Space Mono', ui-monospace, monospace; font-size: 10px;
     letter-spacing: 0.12em; text-transform: uppercase; text-decoration: none;
     padding: 10px 12px; border: 1px solid currentColor; border-radius: 999px;
     opacity: 0.75; background: transparent; }
   .alt-chip:hover, .alt-chip:focus-visible { opacity: 1; }
   ```
   Color: the site's own ink (match the page's text color; on dark-paper
   sites use its light ink). Site 4 has a fixed warning strip across the
   top — set its chip `top: 58px`.
7. Per-site fx assets are restored separately (sketch.js → `public/mv/`,
   grav.js → `public/mv8/`) — keep referencing them at their old URLs.

Do NOT run `npm run build` (parallel builders share the checkout); the
orchestrator builds once after integration.

## Voice cheatsheet for new pages

- lab spec line: "six doors, one quiet room"
- games: mark `GAMES.`, spec "seven toys, one shelf"
- plugins: mark `PLUGINS.`, spec "revit, sharpened — pyrevit extensions"
- satisfactory: mark `SATISFACTORY.`, spec "the factory, visualized — docking soon"
- roadmap: mark `ROADMAP.`, spec "where this has been · where it's going"
