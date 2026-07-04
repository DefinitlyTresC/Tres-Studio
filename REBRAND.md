# tres.studio — Brief V3: the Multiverse

## 🚀 LIVE — CUTOVER SHIPPED 2026-07-03 (Tres's explicit go: "send it")

**Production `main` fast-forwarded to `astro-migration` (0274a31) and pushed;
tres.studio now serves the SIX-universe multiverse.** Site 5 approved in the
same go ("site 5 is done everything is done"). Site 6 "the hang" shipped with
it: a gallery — 13 pigment blocks (TRES letterforms + the orange period-dot)
rehung by scroll through six compositions, chance-colored per visit (after
Kelly 1951; the wall-label no. is the visit seed), Schibsted Grotesk + Space
Mono, site-4 engine canon. Built in ISOLATION at
`E:\Site\Web\V1\tres-06-staging` (its HOOKUP.md = full QA record; 21-agent
audit, 11 confirmed findings fixed), then hooked up: registry entry, roll
COUNT=6. **roll.js upgrade:** the front door never serves the same universe
twice in a row (mv_last functional cookie, 30d). Verified LIVE: all 6
universes appear across fresh visits; 10 cookie'd reloads → zero consecutive
repeats; `?u=6` forces; /6/* deep links 200.

**Full-site sweep (2026-07-03, post-cutover, cc92c54):** every page of all
six universes + lab + privacy DOM-measured at 360/390/768/1280/1680 for
overlap/overflow/broken assets, zero console errors. Fixed: the six-dot map
was sitting on footer text in five places (ring.js metrics tightened to the
five-dot footprint; site 5 + /lab phone meta rows and sites 1/2/3/6 phone
columns now clear the bottom map strip; site 1 + /lab desktop column cap
240→320px). **Analytics restored on all 31 multiverse pages** (Umami +
host-guarded Clarity — production had recorded nothing since cutover).
Content flag for Tres: `architecture/z07/construction/05-08.jpg` + `clip.mp4`
404 on Cloudinary — the sheet lists media the folder doesn't have; z07's
gallery shows dead plates on every universe until uploaded or removed from
the sheet.

**Cutover leftovers (open):** counter reset (Netlify Blobs — untouched);
every multiverse page still `noindex` → tres.studio is now invisible to
search until the meta/OG+SEO pass (needs Tres's call); Lighthouse-vs-baseline
never run; `/resume.pdf` + `/portfolio.pdf` missing from `public/` (links 404
in prod — ASSETS-NEEDED); Cloudinary 404 on
`architecture/z07/construction/clip.mp4` (sheet content, all universes' z07
gallery); site-6 scroll-FEEL eyeball in visible Chrome still recommended
(geometry/logic verified, pacing not humanly watched); lab rebuild queued.

## ✅ SITE 5 PASS BUILT — 2026-07-03, awaiting Tres review

**The process (Tres's contract, unchanged):** one site at a time; finish →
"done" → Tres comments → fix → he says go → next. Site 1 ✅ (3375858).
Site 2 ✅ (bdd4f9e). Site 3 ✅ (a972033). Site 4 ✅ (759b8b5 + c5b152c,
approved "looks good. i loke the updates"). **Site 5 pass is built +
verified — Tres reviews now.** Then the lab rebuild.

**Tres's Site 5 feedback (his words):** review desktop AND mobile; "take
away the scroll stuff and just put an arrow pointing right"; "do some
fixes on the banner at the bottom"; "make swiping down or right take you
the correct way so its not confusing"; full bug check, "wow me".

**What shipped:**

1. **The arrow.** The "↓ scroll down to move right" hint is gone. In its
   place: one drawn blue arrow, fixed mid-right, nudging gently. It's a
   real control (44px, click = advance one panel, ArrowRight/Left keys do
   the same). Lifecycle per NN/g research: DEMOTED to 35% opacity once
   travelling (never deleted — arrows go unnoticed enough), FLIPS into a
   return arrow on the END panel. Reinforced by a 72px panel-2 PEEK on the
   name panel (the strongest "more this way" signal there is).
2. **The banner.** The marquee was 6 fixed reps (~900px) sliding -50% — on
   anything wider than ~1500px it showed a blank gap every loop. Now JS
   rebuilds it to an even segment count spanning ≥2x the viewport (re-run
   on fonts.ready + resize), pace normalized to ~90px/s on every screen
   (the fixed 26s loop ran 30px/s on phones, 200px/s on wide desktops),
   blue — separators, safe-area bottom padding, will-change on the strip.
3. **Direction mapping.** Desktop: trackpad sideways swipes now drive the
   rail (dominant-axis wheel handler, deltaMode-normalized, pinch-zoom
   exempt, overscroll-behavior-x:none so consumed deltas can't trigger
   back-swipe). Touch: the rail still swipes natively sideways, and a
   mostly-VERTICAL flick — which used to do nothing — now advances a panel
   (touch-action:pan-x hands vertical gestures to JS; Hammer-derived
   thresholds; finger-up = onward, matching scroll semantics). NOT yet
   verified on a real touch device — Tres should confirm the feel.
4. **The wow: chromatic misregistration.** While the rail travels, the
   Bungee Shade display type slips off-register — blue/red ghost plates
   offset up to 2.2px with velocity — and re-registers the instant it
   rests. Ties the whole chromatic-print identity (registration mark, blue
   accent) to motion. Gated by a .mis class so rest state costs zero;
   quantized to limit repaints; never under reduced-motion.
5. **Confirmed audit findings fixed (7, 0 real false-positives):** the
   reduced-motion desktop fallback CLIPPED everything after panel 1
   (sticky overflow:hidden + 100svh heights — nav unreachable; now a
   CSS-owned stacked layout via html.rm); keyboard Tab used to scroll the
   hidden sticky container and permanently shear the rail (now: container
   scroll zeroed + focusin seats the focused panel via the same goTo path
   — verified: two Tabs from load lands seated on WORK); the signature
   name entrance raced Bungee Shade on cold cache (worm now gated on
   fonts.load with a 700ms failsafe, head-script class contract so no-JS
   never blanks); the dot map intercepted taps on 360-390px phones
   (ring.js: row is pointer-events:none with dots auto + drops to
   lower-right below 700px — chassis fix, all sites); .reg registration
   mark under the iOS status bar (safe-area env on all five pages);
   about contact links under 44px ("ig" was 36px — inline-flex + mins).
6. **Parity set ported (site 5 was the last old-generation holdout):**
   lightbox dialog/aria-modal/Tab trap/44px/86svh/iOS body-fixed lock
   with the wasClosed step guard/image-only ordinals/PRM video guard;
   back-link touch guard + :focus-visible + reduce blocks everywhere;
   dynamic work count; Windows classic-scrollbar drift fixed
   (clientWidth, not innerWidth — the rail end was ~15px unreachable).
   Cross-site: prev/next project nav no longer self-links on singleton
   categories (the lab-index page did) — fixed on ALL FIVE sites.

**VERIFIED in real visible Chrome:** desktop top (peek + nudging arrow +
seamless full-width marquee), travel, END panel (flipped return arrow, dot
map, column), Tab-seat test (no shear), arrow states; portrait-window
layout: name fits, arrow present, END stacks single-column, marquee
seamless with blue seps. `astro build` green, 128 pages. NOT hand-verified:
real-touch vertical flick + native swipe feel (no touch device in the
loop), misregistration pacing (one-rule CSS, judge live), real-iOS.

**Open flags for Tres:** (1) the ptag "panel 01 / 07" margin annotations
are numbered — the standing no-slop rule bans numbered DECORATION; these
are a real progress sequence, so I kept them — your call. (2) The site-4
dot-map "03 vs 04" label question is still open. (3) Vertical-flick
direction on touch (finger-up = onward) follows scroll semantics — flag
if it feels backwards on your phone.

**NEXT after Tres's go: the lab rebuild** (7 experiments, still V1 —
queued in §11). Cutover checklist (meta/OG, Lighthouse vs baseline,
counter reset, redirects verify) after that.

**VERIFICATION LESSONS (this session, save yourself the hour):** an
OCCLUDED/minimized Chrome window throttles rAF to ~0 and clamps timers —
judge animation pacing only in a visible tab; the preview-tool browser
runs rAF honestly and is fine for logic checks; dev server =
.claude/launch.json "astro-dev" on :4321; canvas font measurement must
await document.fonts.ready; PowerShell 5.1 mangles quotes in `git commit
-m` — write the message to a file and `git commit -F <file>`; git's
"could not write multi-pack-index / geometric-repack" warnings on push
are harmless maintenance noise on this repo.

---

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
- **Site 2 (zero gravity) — R5 bug pass (2026-07-03, Tres: "my favorite",
  landing untouched by request):** grab/throw/collide/spring-home physics
  on EVERY page (index letters+menu, work/archive/about rows); click
  cycles letter colors, off-screen return reshuffles; menu centered.
  Fixed: touch taps on link bodies no longer eaten (pointer-aware slop —
  8px mouse / 14px touch; no-movement release = click regardless of hold
  time; grab() clears stale suppress); window-level pointerup/cancel
  failsafe (lost capture can't strand a HELD body); dragstart guarded on
  color letters; lightbox parity fixes from site 1 (dialog role, focus
  trap + visible focus ring, 44px targets, svh, iOS body-fixed lock, aria
  ordinals); about-page 44px hit areas (pad/negative-margin); back-link
  ignores touch pointermoves; reduced-motion micro-transitions closed on
  all site-1+2 sub-pages. NEW easter egg (research find, Ball Pool
  lineage): drag/shake the OS window and the letters slosh from inertia
  (windowKick in zerog.js — invisible at rest, desktop-only, clamped
  against window-snap). Deliberately NOT changed: letters/menu words keep
  touch-action:none on the landing (finger-on-letter can't scroll — that
  IS the toy; Tres tested mobile and approved the feel).
- **Site 3 (ASCII — Tres: "really nice", the quality bar) — full pass
  2026-07-03 (see the ✅ section up top):** glyph field engine, now in
  **Anybody Black wdth150** (silhouette, aspect-correct) + **JetBrains
  Mono** (atlas 700 + site body; sub-page h1s Anybody 900). Choreography:
  DWELL=0.28 plateaus + smoothstep morph + 48-tick scramble + QUIET debris
  fringe + stranded-boil rescue glide; shatter 1700/800/650 traveling wave;
  fonts.load-gated build; layout-box canvas sizing; reduce gates on
  whirl/shatter; rAF idle-skip; full sub-page parity set. Constants live at
  the top of the inline script. DON'T touch without cause.
- **Site 4 (orange 03) — full pass 2026-07-03 (see the ✅ section up top):**
  giant halftone 03, words in from LEFT, long seated dwell, then the info
  panel rises as a SHEET and flicks the words off bottom-up as it covers
  the scene (no dead gap). All scrubbed motion on one damped follower
  (k=0.14, dt-corrected, sheet lead cancelled via translateY). Print grain
  + crop marks + PROPRIETARY marginalia, block-invert hovers. Strip:
  "⚠ 03 — TRES CARTER · ARCHITECTURE / ART / CODE · 30A". Choreography
  constants live in apply() in the inline script.
- **Site 5 (sideways/Bungee Shade) — full pass 2026-07-03 (see the ✅
  section up top):** horizontal rail (SPEED 2.4, touch snap + vertical
  flick-to-advance), per-letter worm-on entrances (fonts.load-gated),
  right-arrow affordance (click/keys advance, demotes, flips at END),
  72px panel-2 peek, seamless width-adaptive marquee (~90px/s, blue
  seps), velocity-driven chromatic misregistration on the display type,
  vertical END.-spine info panel, blue registration marks. Archie image
  REMOVED by request.
- **/lab (portals):** random universe skin per load, 7 living doorways →
  labs/*.html through the curtain.
- Cross-board: short privacy page, LinkedIn everywhere, Resume/Portfolio/
  plugins-soon links, legacy-URL redirects in public/_redirects.

**AWAITING TRES:** review of the **Site 5 pass** (2026-07-03 — arrow,
banner, direction mapping, misregistration, audit fixes; he comments, we
fix, then he says go on the lab rebuild); on-device touch check of the
vertical-flick direction; the ptag numbering + 03-vs-04 dot-map label
decisions (see Open flags); files per ASSETS-NEEDED.md (resume.pdf,
portfolio.pdf → public/); his next batch of site ideas ("i will work on
more site ideas after this").

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
