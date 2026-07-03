# tres.studio — Brief V3: the Multiverse

## ⏩ HANDOFF — state as of 2026-07-03 (read this first in a new session)

**Everything lives on branch `astro-migration`** (repo
`DefinitlyTresC/Tres-Studio`, deploy preview
`deploy-preview-1--tresstudio.netlify.app`, `?u=N` forces a universe at `/`).
Production (main) is still the old V1 site — untouched. Cutover happens only
on Tres's explicit go.

**BUILT AND REVIEWED-BY-TRES (wow bar reached or close):**
- **Chassis:** build-time sheet data layer w/ snapshot fallback + sheet
  Publish button (proven end-to-end); ink-blot curtain
  (public/mv/curtain.js — WebGL metaballs + grain edge, failsafe timer so
  nav never hangs); dot-row map (public/mv/ring.js — also owns the lab-link
  curtain takeover); flip-card ticker w/ slot-machine gag
  (public/mv/ticker.js); zero-g physics engine (public/mv/zerog.js —
  data-zg/data-zg-room API); random front door (netlify/edge-functions/
  roll.js, COUNT=5); registry in src/lib/multiverse.ts.
- **Site 1 (cream/pencil) — R5 sketch engine (2026-07-03):** strokes are
  now DOCUMENT-anchored (scroll with the page; the old stuck-to-screen bug
  is dead) and persist PER PAGE ("each page is its own sheet",
  localStorage mv1-sheet:<path>). Engine lives in public/mv/sketch.js;
  _pencil.astro is markup/CSS only and is included on ALL 5 page types
  (about + project pages can draw now too). New: [ pencil options ]
  pencil-box popover (4 leads: graphite/sanguine/blueprint/umber; F/M/B
  points; pencil/ink/marker/eraser tools — cursor tip tints to the lead);
  [ save sketch ] + [ b ] toggle exports viewport as JPG (cream + page
  type re-rendered via fillText + strokes + paper grain; [ b ] = bg only);
  landing auto-draw demo (traces TRES letterforms via TextMetrics-aligned
  silhouettes, circles the period, handwrites "draw something"; rAF-clock
  replay, gated on fonts.ready + curtain reveal, skipped on
  reduced-motion/touch/marked sheets, fades on first user stroke); TRES
  letters drag as ERASERS (vector-split erase, spring home); mobile
  [ draw ] toggle top-right (touch-action lock, links inert in draw mode,
  tap=dot, second finger cancels); Ctrl/Cmd+Z undo; seeded deterministic
  grain (no shimmer); buffer-band blit on scroll (pattern pipeline never
  runs per scroll frame); RDP+chunk stroke storage; "( the tan one )"
  annotation removed. Watercolor paper, Caveat annotations, plow-out
  previews unchanged.
- **Site 2 (zero gravity):** grab/throw/collide/spring-home physics on
  EVERY page (index letters+menu, work/archive/about rows); click cycles
  letter colors, off-screen return reshuffles; menu centered.
- **Site 3 (ASCII — Tres: "really nice", the quality bar):** glyph field
  engine: scroll-scrubbed word morph w/ full-band boil + snap, Sobel edge
  contour glyphs, cursor heat wake, radial click shatter, char-arrow
  cursor, atlas renderer. DON'T touch without cause.
- **Site 4 (orange 03):** giant halftone 03, words in from LEFT then push
  UP out, print grain + crop marks + PROPRIETARY marginalia, block-invert
  hovers. Strip: "⚠ 03 — TRES CARTER · ARCHITECTURE / ART / CODE · 30A".
- **Site 5 (sideways/Bungee Shade):** horizontal rail (SPEED 2.4, touch
  snap), per-letter worm-on entrances, vertical END.-spine info panel,
  blue registration marks. Archie image REMOVED by request.
- **/lab (portals):** random universe skin per load, 7 living doorways →
  labs/*.html through the curtain.
- Cross-board: short privacy page, LinkedIn everywhere, Resume/Portfolio/
  plugins-soon links, legacy-URL redirects in public/_redirects.

**AWAITING TRES:** review of the Site 1 R5 sketch-engine pass (2026-07-03,
one-site-at-a-time focus run — he comments, we fix, then he says go on
site 2); files per ASSETS-NEEDED.md (resume.pdf, portfolio.pdf →
public/); his next batch of site ideas ("i will work on more site ideas
after this").

**R5 side-fixes (same pass, cross-cutting):** ticker.js confetti canvas
now lazy (no full-viewport z:75 layer at rest, never under reduce) +
3.5s stalled-fetch fallback reveal; ring.js dot clicks share the
double-cover guard; site-1 project lightbox: role=dialog, focus trap,
44px targets, 86svh, iOS body-fixed scroll lock, aria image ordinals
match counter; hybrid-touch sticky-hover neutralized via body.sk-touch;
tracking back-links ignore touch pointermoves; safe-area insets on the
sketch UI. Verification note: occluded/minimized Chrome windows throttle
rAF+timers to ~0 — demo pacing must be judged in a VISIBLE tab.

**KNOWN OPEN / NEXT:**
- More universes (6+) as Tres supplies concepts; bump roll.js COUNT +
  registry when each completes.
- Sheet v2 content model (5 mains + gallery; waits on his Cloudinary reorg).
- Project pages inside each universe are functional reskins — could be made
  more per-universe-unique later. Site-2 project pages have no physics.
- Lab experiments themselves still V1 (rebuild queued); STL/3D ideas parked.
- Cutover checklist (§11) untouched: meta/OG, Lighthouse vs baseline,
  counter reset, redirects verify.

**WORKING RULES (from memory, binding):** Fable = design lead; Fable agents
may build from detailed specs (Tres authorized 2026-07-03); no-slop laws
(no italic serifs — Newsreader banned; no numbered decoration; named
transitions; gated hovers; reduced-motion always works); VERIFY EVERY
SCROLL/INTERACTION IN REAL CHROME (claude-in-chrome MCP → localhost:4321)
before pushing — the headless preview starves rAF and lies; overflow-x
hidden on html/body kills position:sticky (twice-learned).

**Reset 2026-07-02 by Tres.** This supersedes the single-site rebrand plan.
The migration plumbing (Astro, build-time sheet, Publish button, clean URLs,
redirects — branch `astro-migration`) is done, tested, and carries over
unchanged. Everything visual builds on top of it.

**Builder: Fable, main thread, by hand. No delegated design work.**

---

## 1. The concept

**5–10 fully distinct sites** — each a complete, ground-up brand and design
language presenting the same work — all reading from the same data layer and
the same Cloudinary folder structure. Visiting **tres.studio serves one at
random**; every fresh load of `/` can land somewhere else. Navigation inside
a site is deterministic — random happens only at the front door and at the
switcher.

**Landing rule (Tres, 2026-07-02): landings are pure identity experiences —
no project imagery on any landing.** All work lives in a **Work tab** using
the dense-index row format (Tres: "Love the everything else format btw
really nice"). Each landing gets its own feel per the roster below.

**The roster** (refs saved 2026-07-02; general bar: say.social/en/projects):
1. **Built** — cream `#FFEDDB` / espresso / Archivo drawing-set.
2. **Floating letters** — T R E S . scattered in white space, drifting,
   depth parallax (ref: the O+ scattered-letters shot). Replaces the dead
   Anton/stripes stub ("its bad") — and must NOT mirror the live V1 site.
3. **ASCII whirlwind** — heavily animated ASCII art; letters whirl and
   settle (ref: Bon Iver ASCII poster). Cool and fun.
4. **Black grid + rotating TRESCARTER** — dark grid field, a 3D-rotating
   name ribbon (ref: the HELLO FROM grid shot).
5. **Funky** — Fable's creative call (ref energy: LONGSHOT b/w editorial,
   horizontal scroll, wild display type).
Full effort each; no palette-swap filler. Sites register on the map and
enter the random roll only when complete.

## 1b. R4 REVISION QUEUE (Tres review, 2026-07-02 — work through in order)

**Cross-board (DONE this round):** map redesigned from cluster → simple
row of monochrome dots, titles beneath, current highlighted, grow on hover;
curtain slower both directions; ALL lab links curtain-take-over the screen
(lab itself = ONE shared portals section, brand-randomized — build after
site revisions); privacy page rewritten mad short, one page for all; LinkedIn
(linkedin.com/in/tres-carter) in every contact list; Resume + Portfolio
links beside every "Plugins — soon" (files: /resume.pdf, /portfolio.pdf —
see ASSETS-NEEDED); plugins-soon present on all sites.

**Site 1 (tan) — pending:** work list hover = hero image "plows out" from
the side (per sketch); same preview-on-hover on landing menu; mouse = a
PENCIL that draws on screen anywhere (persist via localStorage if easy);
slight watercolor-paper texture on the background; nudge type toward
handwritten accents (keep Archivo for display).

**Site 2 (floating) — pending:** spread letters wider/composition per
screen size (fix index overlap); EVERYTHING click-draggable and throwable —
letters, menu, buttons — with collisions, jello glide, brief rest then
return home; "the zero gravity of everything"; menu centered; clicking a
TRES letter cycles its color (click ≠ drag), letters start black, and
re-entering the viewport after scrolling away randomizes their colors.

**Site 3 (ASCII) — pending:** EVERYTHING becomes ASCII (buttons included);
click anywhere = scramble all letters; cursor = a cluster of ASCII chars
forming an arrow, chars changing often; landing is scroll-pinned: scroll
progress SCRAMBLES the big word TRES → WORK → ARCHIVE → LAB → ABOUT with
snap-to-word (morph tied to scroll, not constant); the word you're on =
where enter/click goes; lists inside pages all-ASCII, bolder small glyphs
for legibility.

**Site 4 — REPLACE (grid/plank rejected: "super glitchy"):** new concept
from the orange reference ("You've been warned" / big 63): ORANGE theme,
giant "03" as the landing background (no TRES on landing), scroll brings
menu items in from the right like a menu popping up; scroll harder →
everything swipes left and you land on the info screen. Fully unique — no
repeats from other sites.

**Site 5 (sideways) — pending:** kill the vertical feel — travel reads
purely sideways; font goes LONGSHOT-bold ("bold as fuck TRESCARTER" —
ultra condensed/heavy, slashed energy); add a big cutout PNG (likely
Archie) — placeholder until Tres supplies (see ASSETS-NEEDED).

## 2. Fixed anchors — the contract every site implements

1. **A "Tres" identity moment** at the top, in whatever form fits that site.
2. **A scrolling journey through the work** — horizontal, vertical, inward;
   the site's own idea of travel.
3. **Landing is always followed by** work, archive, lab, plugins — reachable
   in whatever way that site presents them.
4. **An information tab (about/contact) wherever the scroll ends** — always
   present somewhere.
5. **The dot-ring map** (§3) lives at the info area of every site.
6. **Working infrastructure everywhere:** visitor counter, Umami + Clarity,
   sheet-driven content.

## 3. The dot-ring map (the switcher)

A **ring of dots, cut in half by the screen edge**, at the info area of every
site — the map of the multiverse. Reference: the attached circle-of-dots
image (dots of varying sizes forming a ring).

- One dot per site; each dot carries that site's color/pattern. Minimal.
- **Slow constant spin; jello reaction** to mouse/touch.
- **Desktop:** click a dot → switch to that site (via the curtain, §4).
- **Mobile:** tap → the ring grows, background blurs; then pick.
- Like the ticker, it is **identical in behavior across every site** — the
  one constant in the multiverse (the ticker is the other).

## 4. The ink-blot curtain (the signature transition)

Reference video: `C:\Users\TresCarter\Videos\Screen Recordings\Screen
Recording 2026-07-02 191552.mp4` (frames studied 2026-07-02) + the black
ink-blot image. What the video shows: a solid organic blot on the page; the
destination is visible **through it** like a window; on commit it floods
outward — soft feathered lobes, **grainy spray-dissolve edges** — until it
swallows the viewport; it peels open from the other side on arrival.

- A **full-screen curtain, not a layout mask.** Transition device only.
- Used for: entering a site, page-to-page moves where it earns its keep, and
  **always** for universe switching from the dot-ring.
- Implementation direction: WebGL fullscreen shader (SDF metaballs + noise
  threshold for the grain edge, progress-driven), canvas 2D fallback,
  instant cut under reduced-motion. No libraries.
- The bar: the video's cleanliness. Ship-or-kill per piece.

## 5. Typography + copy corrections (2026-07-02)

- **Newsreader is dead everywhere. No italic serifs anywhere, ever** — reads
  as cursive/AI to Tres. This is a standing no-slop rule.
- Keep: **Archivo** (display) + **Space Mono** (spec/labels) for Site #1.
- Body role: proposal — **no third face**; Archivo regular weights carry the
  little body text that remains. Other sites define their own systems.
- **Copy minimization is policy:** titles speak for themselves; stop
  explaining every element. Cut helper sentences ruthlessly.

## 6. Randomness, URLs, analytics — the mechanics (proposed, pending Tres OK)

- Every site lives at a deterministic path: `/1/…`, `/2/…` (all statically
  built — one Astro build outputs the whole multiverse).
- **`/` is the dice roll:** a Netlify Edge Function rewrites `/` to a random
  site's landing. URL stays `tres.studio` — no flash, no redirect. Refreshing
  `/` re-rolls; refreshing any inner page stays put. One small versioned
  file, free tier, nothing to babysit. (Fallback if edge functions misbehave:
  instant client-side pick at `/`.)
- Deep links people share are the deterministic paths — stable forever.
- **Analytics count as ONE site automatically** (same domain). Per-site
  breakdown comes free from the path (`/3/…`). One pulse counter store
  shared by all sites — the ticker shows the same number everywhere. Reset
  at launch.

## 7. Content model (unchanged)

Sheet v2 when Tres's Cloudinary reorg is ready: books = The Pointe + Thesis;
every other project 5 main images + "view gallery" (25–30, possibly listed
straight from the Cloudinary folder at build). Work five: z07, ee13,
flatwood, tucker, thesis. Archive = the rest. One data layer feeds every
site.

## 8. Assets-from-Tres workflow

STLs, videos, model exports come later. Build with placeholders, and for
each site maintain an entry in an **assets Word doc** (`ASSETS-NEEDED.docx`)
telling Tres exactly what to produce, at what size/format, and where it
lands. He fills folders; builds pick them up.

## 9. Dead ideas (do not resurrect)

- Blob-mask-in-a-scrolling-list layout (R1) — rejected as a whole.
- Cursor particle-dot edge effect — rejected even if functional.
- Newsreader / any italic serif. Pill-shaped buttons. 3D odometer wheels.
- Numbered-marker decoration, rings/glows, explainer copy under every title.

## 10. Quality bar

[recent.design/websites](https://recent.design/websites) is the standard;
the reference video is the cleanliness bar. **If a piece doesn't hit it, it
doesn't ship.** Sites ship one at a time, each complete.

## 11. Sequencing

1. **Chassis** — curtain shader, dot-ring component, random-entry edge
   function, the anchors contract as shared scaffolding, ticker as shared
   component. Prove on a two-stub multiverse.
2. **Site #1 complete** (cream/espresso direction) — every anchor, every
   page, judged as a whole against the bar.
3. **Sites #2…N** — one at a time, each its own ground-up design.
4. **Cutover** to production on Tres's explicit go once enough sites exist
   (launch threshold = open decision), with legacy redirects, meta/OG, image
   tiers, counter reset, privacy rewrite (bare, plain; one honest Clarity
   cookie sentence), Lighthouse vs. baseline.
5. Lab rebuild + STL experiences fold into the sites as they're built.

## 12. Carry-over guardrails

Tres edits content in the sheet, never code. $24/yr domain, $0/month. No
DNS changes. Branch + previews; production only on explicit go. Plain,
specific copy — and as little of it as possible.
