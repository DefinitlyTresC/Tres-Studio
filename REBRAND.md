# tres.studio — the living log

## 🔶 V3.0 — THE COLLAPSE: one site, the floating one — 2026-07-20 (Tres: "collapse it all into just the floaty site… keep all the nice quirks… keep the lab ready, keep all tracking functioning, just eliminate the randomness and extra site variants")

**The multiverse is over. The floating one (zero gravity) is THE site,
served at root URLs.** Committed on `astro-migration`; **NOT PUSHED — deploy
needs Tres's explicit go (push = live).**

- **NAMING, FOR THE RECORD:** Tres asked for "site 03, the floaty one." The
  registry's floaty one was **universe 2** ("the floating one", zero-g
  letters, color cycle on click, color reshuffle on scroll re-entry);
  universe 3 was the ascii/terminal one (monochrome, no floating letters).
  Every descriptor — floaty, letters floating up top, scrolling color
  change — matched 2 and only 2, and the brand itself is 03 (Tres = three),
  so "site 03" read as brand slang, not the registry id. Collapsed to
  universe 2. If that call was wrong, `git revert` this and say the word.
- **Promoted to root:** `/2/` → `/`, `/2/work` → `/work`, `/2/archive` →
  `/archive`, `/2/about` → `/about`, `/2/project/*` → `/project/*`. Pages
  are byte-faithful ports minus the multiverse bootstrap (no MV_CLIENT, no
  refresh-roll, no dot map).
- **The letters read TRES now:** the landing letter homes were re-organized
  left-to-right on a gently bouncing baseline — T(15,30) R(35,24) E(55,32)
  S(74,26) ·(87,38), narrow homes to match — instead of the old full
  scatter (E below T, S mid-screen). Still floaty: same physics, same
  sizes, same grab/throw/jello, color cycle + scroll-re-entry reshuffle
  untouched (zerog.js unchanged).
- **Randomness eliminated:** deleted the edge dice roll
  (`netlify/edge-functions/roll.js` + its netlify.toml block), the
  refresh-roll / MV_CLIENT (`src/lib/multiverse.ts`), the front-door
  fallback roller, the dot map (`public/mv/ring.js`), and the lab's
  per-load skin roll. `mv_last` / `mv:u` cookies+storage are simply unread
  now (they expire on their own).
- **Universes removed:** `src/pages/{1,3,4,5,6,8}/` and per-site fx
  (`public/mv/sketch.js`, `public/mv8/`). Also retired the legacy old-brand
  clean-URL pages (`Base.astro`, `[cat].astro`, root `about/project`
  pages, `brand.js`, `counter.js`, `style.css`, `v2-tokens.css`,
  `src/styles/`) — the real pages live at those URLs now — and the stray
  pre-multiverse `public/labs/Alternate Sites/` folder. All in git history.
- **Old doors never 404:** `_redirects` now 301s every `/N/…` page to its
  root twin (`/N/work` → `/work`, `/N/project/*` → `/project/*`, `/N/*` →
  `/`), plus `/architecture` → `/work`, `/personal` → `/archive` for the
  retired category pages.
- **The lab stays, pinned:** `/lab` wears the site's own brand (the old
  skin 02) permanently — skin roll, reroll button, skin-4 warning strip and
  skin-5 marquee removed. All eight doors + keeper plates (swatch + №)
  kept; all eight experiments untouched and still universe-branded — the
  lab is where the multiverse lives on. Their "from universe 0N"
  provenance links now ride the redirects home. alternates.html kept as
  the era's index (its doors all lead home now); its /lab door tag reads
  "the multiverse, as it hung".
- **Quirks kept:** zero-g physics everywhere, letter color cycle + scroll
  reshuffle, ink-blot curtain (autoReveal on every page; /lab links
  swallowed via new `public/mv/lab-takeover.js`, extracted from ring.js;
  lab doors flood in site ink), cursor-riding back links, flip-card ticker
  + slot-machine + confetti, the die-3 favicon (still on brand — Tres =
  three).
- **Tracking untouched:** ts.js, /me control room, pulse.mjs counter
  (epoch 2), ticker — all exactly as before.
- **Build:** green, 24 pages (was 172). dist grep-verified: zero `/N/`
  links and zero MV/ring references outside `labs/` provenance.
- **Open flags for Tres:** (1) push = deploy — your go; (2) everything is
  still `noindex` — with one real site this is THE moment for the SEO
  pass; (3) alternates.html is now a museum piece whose doors all lead
  home — keep or retire, your call; (4) letter homes are constants at the
  top of `src/pages/index.astro` — nudge x/y to taste.

## 🔶 LAB, MULTIVERSE EDITION — BUILT + REVIEWED, **shipped 2026-07-12** — 2026-07-12 (Tres: "rebuild it all from scratch… theme align with the site it is associated with… make me proud")

**Every lab experiment is now ADOPTED by one universe and rebuilt ground-up
in that universe's full brand.** This supersedes the one-album dusk-black
family look (which survives only on alternates — the index, the space
between). Same URLs; one NEW page. Design doc:
`docs/specs/2026-07-11-lab-multiverse-design.md`. Committed on
`astro-migration`; **deploy needs Tres's explicit go (push = live).**

- **plan. → 01 (the sketchbook):** "the night shift" — a REAL house plan
  drafts itself in pencil on cream watercolor paper: weighted-BSP rooms on
  a 1ft module, poché walls, door leaves + quarter swings, triple-line
  windows, one dimension string per side with 45° slashes, Caveat room
  labels, north arrow, "tres." signature — then the sheet slides away and
  the next commission begins. Your pointer is a graphite pencil on the
  same sheet. [ cottage ] [ courtyard ] [ longhouse ] + [ next ].
  Builder ran a 3000-commission invariant harness (tiling, min dims,
  door tree, entry 100%).
- **birds. → 02 (zero gravity):** a murmuration loose in the white void —
  grab a bird and THROW it (jello spring), click one to cycle the zerog
  palette (the wordmark period takes the last color), tap scatters, hold
  gathers. Now and then the flock condenses into "TRES." (adaptive
  letterform sampling — seats ≈ flock size, column-ordered so it pours in
  clean); your colored birds claim the period. [ drift ] [ spell ]
  [ frenzy ].
- **pulse. → 03 (ascii):** sounding the blank sheet — ink glyphs print on
  white where ping rings cross a hidden terrain (JetBrains Mono atlas,
  density ramp + Sobel edge glyphs `|/-\`, scramble-boil ring, inverted
  answer-back on the summits ~0.5s later). [ ridge ] [ atoll ] [ blocks ]
  (a generated night city — the architect's world).
- **field. → 04 (the print sheet):** the halftone raster IS the field —
  wind rolls tone waves through a 45° screen of ink dots on hot-orange
  stock (r = Rmax·√darkness, dot gain ^0.85, seeded jitter); crop marks,
  film grain, FIG. 04 marginalia, warning-strip provenance. Move = dot-gain
  lens, drag = gust, tap = ink drop, hold = burnish. [ coarse ] [ fine ]
  [ overprint ] — a beige plate at 75° beats against the ink screen as
  LIVE MOIRÉ, misregistered per print run.
- **echo. → 05 (chromatic plates):** the registration pool — the wave
  field renders as marching-squares contour line art stroked TWICE (blue
  #2431FF + red #E82929, multiply → ink-dark overlap); plate offsets ride
  local water velocity, so a still pool is one crisp registered drawing
  and every ripple tears it into color. The blue registration crosshair
  trembles with global misregistration. [ still ] [ drizzle ] [ deluge ].
- **drift. → 06 (the hang):** suminagashi, hung by chance — Jaffer
  mathematical marbling (closed-form drop injection + tine combing on
  polygon drops, flat hard-edge pigment ONLY), chance-colored per visit
  from the exhibition HUES with the orange rationed like the period-dot;
  the wall label carries the visit's no. NNN seed. Drag = comb (feathered
  streaks are real marbling math), hold = alternating ink/paper rings.
  [ stone ] [ rings ] [ combed ] + [ rehang ] + [ save ].
- **stock. → 08 (the drop) — NEW PAGE `/labs/stock.html`:** midnight in
  the stockroom — kraft parcels drop onto drawn shelves (G=2600 canon,
  squash, contact shadows, sleep), grab/throw anything, a true click
  STAMPS it (red two-arc 08) and knocks it down a level; floor strays get
  reshelved by the unhurried stockkeeper (9s, 1.4s gaps). [ receiving ]
  [ inventory ] (full re-sort by size) [ rush ]. Boots with 7 seated.
- **Portal (/lab):** door plates now carry the keeper's swatch + № tag;
  doors ordered by universe; skin roll extended to ALL SEVEN universes
  (IDS list [1,2,3,4,5,6,8] — never a count); new stock door + new field
  halftone door pattern; reroll copy "skin 0X · reload to reroll".
- **alternates.:** stays dusk-black on purpose (it's the index); each
  universe door gained "keeps plan." etc; lede notes the adoption.
- **Contracts preserved:** same URLs; `/ts.js` the only tracking; nav
  contract (mark → /, [ ← lab ] → /lab, provenance link → /N/); PRM
  two-layer everywhere; QA hook `window.__lab` (tick/snap/info + per-sim
  extras) now UNIVERSAL — birds/drift's old gap closed; all ambience on
  the frame clock; die-3 favicon auto-discovers (per-page icon links
  dropped).
- **Adversarial review: 78-agent workflow round** (8 files × 3 lenses,
  every finding refutation-verified): 47 confirmed / 54 raw → ALL FIXED.
  Highlights: the /lab back-link was COUNT-based and silently broke for
  universe 8 (now ID-LIST membership — the "never 1..COUNT" rule bit us
  AGAIN); marbling refine() ran per-op instead of per-frame (now flagged
  + fixed-capacity vertex buffers, zero per-op allocation); birds
  multi-touch could permanently orphan a held bird; house patterns now
  binding on all lab pages: dt clamped [0, 0.05] (QA tick pushes `last`
  past wall-clock), pointercancel clears state ONLY (never commits taps),
  one gesture at a time + non-primary buttons rejected, capture in
  try/catch, QA gate via URLSearchParams (substring 'qa' false-matched),
  resize debounced 150ms, keydown ignores button/link targets, idle
  early-outs (echo/pulse skip full repaints at rest), mobile modes row
  at 5.4rem (the two-line wordmark+provenance block needs the clearance).
  Then a second 3-lens round on plan.html (built later) — see below.
- **Verified (astro dev, browser, QA hooks + snapd visual judging):** all
  seven sims boot console-clean, all modes exercised, gestures traced
  (stamp-drop-level, stockkeeper reshelve 2→0, marbling comb streaks,
  TRES. formation legible, city-world sonar, moiré breathing, plate
  tear/re-register), desktop + 375px zero collisions/overflow (button
  row measured), `window.TS` boots everywhere, `astro build` green
  (172 pages incl. stock). **NOT humanly eyeballed: motion pacing on all
  seven** (constants at the top of each inline script) — Tres judges on
  the live site, per canon.
- **Open flags for Tres:** (1) push = deploy — your go; (2) stock. is a
  new URL — bless the name; (3) alternates stays dusk-black by design —
  flag if you want it re-skinned; (4) pacing constants everywhere are
  yours to tune; (5) the old WebGL fluid drift is fully replaced —
  it lives in git history if you ever miss the smoke.

## ✅ SITE 08 "THE DROP" HOOKED UP + SHIPPED — 2026-07-11 (Tres: "all chats done, wire it up and push live")

**The seventh universe: /8/ — the stockroom.** Built in isolation at
`E:\tres-08-staging` (its HOOKUP.md + docs/ = full design + QA record),
hooked up tonight. Warm-white shelf wall (#F6F4EE), TRES letterforms rest
GREEN (#00934D) + red period-dot + stamp red #D8341F accents, Hepta Slab
900 + Space Mono. The letters DROP onto their shelf on load; everything is
a gravity body (hand-rolled `public/mv8/grav.js`, zerog pointer canon +
gravity/shelves/AABB stacking/contact shadows/sleep). A true click on loose
stock drops it a LEVEL (links navigate instead); strays reshelve after 9s,
one item at a time (1.4s gap — "the stockkeeper"). Round-2 feedback all in
(click-drop, unhurried queued returns, two-arc stamp, green TRES).

**NUMBERING: there is no site 7 — Tres named this one 8 and the brand says
08.** Both rollers now pick from the registry ID LIST, never 1..COUNT:
`roll.js` has `IDS = [1,2,3,4,5,6,8]`; the MV_CLIENT refresh-roll builds
`ids` from `MV.sites` (validation, reload-roll, and back/forward restore
all list-based). Slot 7 is an open door; alternates.html says so.

**Hookup deltas beyond the registry line:** the 8-pages use the NEW `/ts.js`
tracking bootstrap (not the old inline snippets); alternates.html gained the
eighth door (+ "seven sites" lede, nth-child(7) stagger); lab.astro portal
tag → "seven doors, one front door".

**Verified in real Chrome against the integrated repo (:4321):** drop
settles all-bodies-asleep at exact homes (desktop + 375 verified in staging;
desktop re-verified integrated); reload-roll live-sampled 8→5, 8→6, 6→1 —
never /7/, never a repeat; `?u=8` pin jumps from /5/ to /8/; sessionStorage
mv:u + mv_last cookie track 8; window.TS boots on the 8-pages; dot map = 7
dots (304px row, fits phones); alternates lists seven doors; `astro build`
green — 171 pages. **Engine fixes found at hookup (in grav.js, synced to
staging):** ResizeObserver's mandatory initial fire was snapping the
entrance to seated 150ms after boot (now only real size changes re-measure,
and a resize during WAIT re-spawns above the room — the identity moment
can't be skipped); occluded-window rAF starvation is why QA uses the
localhost `window.__g8.tick()` clock.

**NOT humanly eyeballed: motion pacing** (drop rhythm/squash/reshelve
glide) — both browser surfaces on this machine starved rAF this session
(occluded windows). Physics is deterministic and fully verified on the
synchronous clock; **Tres judges pacing on the live site** (constants at
the top of grav.js; glyph seat = 0.135em in 8/index.astro). Also still
open: real-touch feel on an actual phone.

**FAVICON (same night, 71eacf4 — live-verified):** one mark for every
universe — a die face **3** (tres = three; the front door is a dice roll)
on the brand-orange #FF5A1F tile, two ink pips + a paper period-pip.
`public/favicon.ico` (16/32/48 PNG-in-ICO) + `public/apple-touch-icon.png`
(180) — both browser-AUTO-DISCOVERED paths, zero `<link>` tags anywhere
(ts.js consolidation philosophy). Browsers cache favicons hard — if an old
tab shows the globe, hard-refresh or new tab. Generator geometry recorded
in the commit message.

## ✅ TRACKING CLEANUP — 2026-07-11 (Tres: "exclude me… user IDs in Clarity… reset the total, remove bots")

**Analytics consolidated + self-exclusion + visitor IDs + counter reset.**
Design: `docs/specs/2026-07-11-tracking-cleanup-design.md`.

- **`public/ts.js` is now THE tracking bootstrap** — the Umami+Clarity
  snippets that were pasted inline in 39 files (31 Astro pages + 7 static
  lab pages + Base.astro) are gone; every page loads the one script. Same
  guards as before (Umami data-domains, Clarity host-gated to tres.studio).
- **Self-exclusion via `/me`** (noindex, linked nowhere): a per-BROWSER
  kill-switch in `localStorage ts_off` — Tres visits it once on phone /
  work / home and flips [ exclude this browser ]. Works on any network, so
  the NordVPN case costs nothing (IP rules were the wrong axis). Excluding
  also sets Umami's own `umami.disabled` bypass. Excluded browsers still
  SEE the ticker; they just never count (`?x=1` → pulse skips all writes).
- **Visitor IDs → Clarity:** every tracked browser mints a stable
  pseudonymous id (`ts_vid`, e.g. "bone-kite-95" — palette word + coastal
  bird + digits). Sent as Clarity custom user id + friendly name +
  `visitor` custom tag → filter recordings by person in the dashboard.
  `/me` has an optional friendly-name field (label a device before
  excluding it, or a friend's browser). Privacy page updated honestly.
- **Counter reset to 0 + bot filter:** `pulse.mjs` total moved to Blobs key
  `total-2` (epoch 2 — deploy = fresh 0; epoch-1 `total` frozen as
  history). Server-side UA bot filter (bot/crawl/headless/lighthouse/curl/
  python/no-UA → never counted, still served numbers); client-side
  `navigator.webdriver` sends x=1 too. 12-scenario Node harness green
  (mocked Blobs): dedupe, exclusion, every bot UA class, epoch isolation.
- **Verified in the browser (astro dev):** /me mints id + toggles state
  (ts_off/umami.disabled/ts_name all correct across reloads), excluded
  universe page injects NO trackers and ticker pings `&x=1`, re-included
  page injects Umami (domain-guarded) and no Clarity off-host, vid stable
  across pages, zero console errors. NOT testable locally: Clarity
  identify on the production host, and the real Blobs epoch swap — check
  Clarity's custom-id filter + the ticker showing a fresh low number after
  deploy.
- **Adversarial review round (18 agents, 14 raw → 11 confirmed, all
  fixed):** the big one — the `/me` gate compared pathname to '/me' but
  prod Netlify 301s to `/me/` (VERIFIED against the live site), so the
  control page would have tracked Tres on every visit; gate now
  slash-tolerant. Clarity kept recording one page deep after excluding
  (bfcache restore self-restarts its recorder — verified against the live
  clarity.js bundle; now a pageshow handler calls clarity('stop')).
  BOT_RE's bare 'bot' matched CUBOT-brand Android phones → `(?<!cu)bot`
  (35 real UAs battered, zero other false positives). counter.js now
  re-reads ts_off on every 20s heartbeat (a tab open during the flip used
  to keep counting). Ticker cache key bumped ts_v2→ts_v3_ticker so the
  stall fallback can't flash an epoch-1 total. Privacy wording fixed (the
  'VPN opts you out' claim was false — and now explicitly says nothing
  keys off IP). Harness now 19 cases green (Cubot, GPTBot, gate paths).
  REFUTED (no fix needed): private-mode vid churn (storage-hostile
  browsers only), reload-replace double-count (exact parity with the old
  inline snippets), ts-seen growth (strictly improved — bots no longer
  write it).
- **For Tres after deploy:** open `tres.studio/me` on each browser (phone,
  work, home — VPN on/off doesn't matter), optionally name the device,
  hit [ exclude this browser ]. Umami/Clarity DASHBOARD history can't be
  retro-cleaned (their data); the fresh epoch + filters solve it going
  forward. Clarity: filter by Custom tags → visitor, or User ID.

## ✅ REFRESH-ROLL + ROOT CLEANUP — 2026-07-11 (Tres: "randomized on any refresh, any page")

**The dice now roll on refresh EVERYWHERE, not just at the front door.**
Spec + decision table: `docs/specs/2026-07-11-refresh-roll-design.md`.
The contract: refresh any page → the SAME page in a DIFFERENT universe
(never the one you're on); links/back/forward NEVER re-roll; ring dots and
`/N/` deep links stay deliberate; `?u=N` now pins on ANY page (the dev/QA
escape hatch — F5 with `?u` does not teleport you).

- **How:** ~30 lines appended to `MV_CLIENT()` in `src/lib/multiverse.ts` —
  the inline head bootstrap every universe page already injects. Navigation
  Timing API type detection: `reload` on `/N/...` → `location.replace` same
  path in another universe; `back_forward` never rolls (+ a correction for
  back-to-`/` after a bfcache miss, via `/?u=` + replaceState). Syncs
  `sessionStorage mv:u` (tab's universe) + the edge's `mv_last` cookie so
  the front door never rolls the universe you're already in. Lab pages
  inject `current=0` → no-op. Replace loads report `navigate` → loop-proof.
- **`src/pages/index.astro` replaced:** the old pre-multiverse homepage port
  (unreachable since cutover — the edge owns `/`) is now a minimal client
  front-door fallback with roll.js-identical semantics, so `astro dev` /
  `astro preview` / `/index.html` / edge-failure all roll too.
- **Bug fixed in passing:** `lab.astro` back-link referrer regex was
  `[1-5]` — universe 6 never got a back-link since the hang shipped.
- **ROOT CLEANUP (the "messy in there" half):** the dead pre-Astro static
  site is gone from the repo root — `index/about/category/lab/privacy/
  project.html`, `style.css`, `brand.js`, `config.js`, `counter.js`,
  `data.js`, stale root `labs/` (public/labs/ has the live rebuilt copies).
  `projects.xlsx` → `_archive/`, `HANDOFF.md` → `docs/`. `README.md`
  rewritten for the multiverse era (repo map, randomization contract,
  content workflow — sheet edits need a REDEPLOY now, that's new-ish info).
  All of it lives in git history.
- **Adversarial review round (19 agents, 15 raw → 12 confirmed, all fixed):**
  `?u`-strip at `/` was over-stripping (now surgical — only `u` goes, utm_*
  + hash survive for Umami — and one-shot via `mv:restored`, so shared
  `/?u=3` links STAY pinned across F5); legacy back/forward mapping
  (`performance.navigation` type 2) now honored; **/privacy "← back" and
  /lab "← back" no longer re-roll** — both consult `sessionStorage mv:u`
  (privacy was a guaranteed universe-teleport on a link labeled "back");
  lab back-link regex now registry-driven (`\d+` + MV.sites.length), so
  the README's "adding universe 7" recipe is true; **alternate2 lab's
  escape links all 404'd on prod since the cutover** (`../../*.html`
  resolved to /labs/ — pre-existing) → now root-absolute clean URLs; dead
  `../favicon/` links in all 8 lab pages → inline SVG icon; README/comment
  truth fixes (public/ map shows the LIVE brand.js/counter.js/v2-tokens.css
  copies; `?u` scope stated honestly — ignored on single-version pages).
  REFUTED with empirical repros (no fix needed): analytics double-count on
  reload-replace (instrumented Chromium test: nothing executes after the
  replace) and tab-discard/duplicate "phantom re-roll" (real CDP-driven
  discard reports `back_forward`, which never rolls).
- **Verified (astro dev, browser):** reload chain `/1/work→/4→/5→/3` zero
  repeats; project-in/back-out sticks; `?u` pins + jumps; `/lab` reload
  no-ops; zero console errors; `astro build` green (149 pages). NOT
  verified live: the edge + client interplay on tres.studio (edge doesn't
  run locally) — spot-check `/` reload + inner-page reload after deploy.

## ✅ LAB REBUILD COMPLETE (7/7): ECHO + FIELD + PLAN + PULSE + ALTERNATES — 2026-07-11

**The remaining five lab experiments are rebuilt ground-up into the lab
family language** (dusk-black paper, Space Mono chrome, bracketed controls,
one yellow accent, scene-alive-on-its-own, PRM-honest, same URLs). The two
arcade games (echo, pulse) lost their score/timer/lives chrome entirely —
every piece is now a field study. The series reads as one album: birds =
the sky, drift = the air, echo = the water, field = the grass, plan = the
drafting table, pulse = the dark, alternates = the index. Design doc:
`docs/specs/2026-07-11-lab-rebuild-3-7-design.md`.

- **echo (was ring-crossing arcade):** rain on a still pool. Hugo Elias
  two-buffer wave field (real interference, soft-absorb banks) rendered
  per-pixel: height → shade, slope → refraction INTO a baked moon-
  reflection mask + glint — the same moon birds hangs, read in the water
  (gradient mirrored top-to-bottom). drag = wake, tap = drop, hold = rain
  under the hand; [ still ] [ drizzle ] [ deluge ]; a single yellow leaf
  falls, lands with a ring, rides the wave slopes, slips away.
- **field (was flow-field particles):** wind through tall grass. ~3k
  spring-loaded blades in 3 depth layers (quadratic curves, batched into
  6 strokes; pow-biased roots so the canopy thins raggedly), advected
  value-noise wind + visible gust FRONTS sweeping across; 7 fireflies
  (the accent) — move = part, hold = press a circle flat + gather the
  fireflies to your hand, tap = radial shock; [ lull ] [ breeze ]
  [ squall ].
- **plan (was Langton + rule-deck tool UI):** the unattended draftsman.
  Langton core kept, engineering UI killed; the piece is watching: 7 sps
  at first (each turn readable), doubling every 7s to 26k — a plan
  drafting itself in time-lapse on graph-paper hairlines. Curated rules
  as modes: [ highway ] RL, [ bloom ] LLRR, [ estate ] LRRRRRLLR (walled
  square, corridors inside — verified against the turmite literature).
  Torus wrap so highways come back around. tap = seed an ant (≤5),
  [ again ] = fresh sheet. The ants are the yellow.
- **pulse (was orbit-dodge game):** sounding the dark. A hidden terrain
  (marching-squares contours over fbm, chopped into front-sized pieces)
  lights up only where an expanding ping crosses it, then phosphor-
  decays; the highest ground answers back in yellow ~0.5s later. A
  beacon at (0.82, 0.24) pings ambiently. Worlds: [ ridge ] (anisotropic
  ranges) [ atoll ] (sharpened noise breaks the rim into islands)
  [ blocks ] (generated night city, tall blocks carry courts — the
  architect's world). tap = ping, hold = ping train.
- **alternates (was Oswald "SOON" stub):** the index of the multiverse —
  the only page listing all six universes: swatch dots from the registry,
  one-line characters, deep links /1/–/6/, [ roll the dice ] → /, and the
  old Three.js particle experiment kept as "proto — an abandoned
  universe". The one lab page that scrolls; entrance staggered, PRM-gated.
- Portal tags updated (lab.astro): echo "rain on a still pool", field
  "wind through tall grass", plan "langton's ant, drafting", pulse
  "sounding the dark", alternates "six doors, one front door".
- **Verified in the preview browser at desktop + 375px:** all modes on
  all four sims, tap/drag/hold interactions, ambient events, mobile
  chrome (44px targets, no overlaps, no x-overflow), zero console
  errors, `astro build` green (149 pages). Frame cost measured: echo
  2.6ms, field 0.7ms, pulse 0.4ms. NOT eyeballed in visible Chrome
  (headless session) — pacing judgment is Tres's on the live site.
- **VERIFICATION LESSON (new tooling):** this session's pane starved rAF
  completely (occluded window), so every sim now ships a tiny QA hook —
  localhost/?qa-gated `window.__lab = {tick, snap, info}` that steps
  `frameBody(last+16.7)` synchronously and returns a downscaled JPEG
  dataURL; a throwaway node receiver (scratchpad `snapd.js`, :4599) wrote
  snaps to disk for visual judging. All ambient scheduling (rain, leaf,
  fronts, beacon) runs off the FRAME clock, never `performance.now()`,
  so synthetic stepping and real time behave identically. Keep execs
  small — one snap per javascript_exec; a 3-snap mega-exec wedged the
  pane renderer hard.
- **Open flags for Tres:** motion pacing on all four sims (constants at
  the top of each inline script); echo leaf cadence (~every 20-40s in
  still/drizzle); pulse atoll re-rolls per world switch — if a roll looks
  weak, switch away and back; alternates one-line characters are my copy,
  edit freely.

## ✅ LAB REBUILD 1+2: BIRDS + DRIFT — 2026-07-04 (Tres: "go off" / "redo in totality")

**The lab experiments are being rebuilt ground-up, one at a time, into a
shared LAB FAMILY language:** dusk-black paper (the birds sky gradient is
the family reference), Space Mono chrome only, lowercase, bracketed
controls on the right (bottom row on phones), one yellow accent, nav =
"tres carter." → `/` + "[ ← lab ]" → `/lab`, wordmark bottom-left
("birds." / "drift."), hint bottom-right that fades on first input,
Umami+Clarity on both, reduced-motion always works, no numbered
decoration, gated hovers. Same URLs — the /lab portals didn't move.

- **birds.html (was: 4-preset boids on V1 yellow/Bebas):** now a dusk
  field study. Depth-sorted murmuration (z-layers, painter's order) over
  a huge matte moon disc; a REAL perch wire (spring-node catenary —
  landings bounce it, waves travel); a summonable hawk that carves panic
  waves (fear is contagious — neighbor-diffused); wind gusts; storm
  empties the wire. Gestures: hold = gather, tap = scatter (wire empties
  in a distance ripple). States: [ murmur ] [ roost ] [ storm ] +
  [ hawk ] event; keys 1/2/3/h/space. ~3% rogues stay yellow and never
  roost. Opus review: 4 findings, all fixed (space-key a11y, LAND
  resize-strand, two-finger gesture ownership, O(n²) shuffle sampled).
- **drift.html (was: WebGL2 fluid w/ 9 sliders + 6 numbered "studies" —
  numbered decoration, white V1 brand, blank until dragged):** now a
  wind study. Same proven Navier-Stokes core, EXPERIENCE rebuilt: three
  weathers [ smoke ] [ ember ] [ gale ] (one ink each — no sliders, no
  palette pickers), scene alive on its own via discrete BREATH events
  (one compact dye blob + one up-impulse; the projection step rolls it
  into mushroom vortices unaided). Buoyancy pass added (smoke rises);
  gale = steady crosswind + silk streamers from the left edge. Move =
  stir air, drag = draw ink, tap = puff apart, [ save ] = PNG. KEY
  ENGINE LESSONS (paid for in blood): dye texture at ~1024 while
  velocity solves at ~256 — the split IS the crisp-filament look;
  velocity units are sim-px/FRAME (sane impulses are 2-6, not 16+);
  splats centered off-screen land only their gaussian tail — sources sit
  just inside; one-shot blobs need dyeDiss ≥0.994 to live (steady-state
  math only applies to continuous emitters); paper color is a DISPLAY
  color — never gamma-lift it or near-black renders milky gray; dye
  exits via an edge-fade band at the ceiling instead of pooling.
- Portal tags updated: birds "starlings, a wire, a hawk"; drift
  "smoke, ember, gale".
- **Verified in the preview browser (rAF-honest) at desktop + 375px:**
  all modes, gather/scatter/puff/draw, hawk, wire ripple, zero console
  errors. NOT eyeballed in visible real Chrome (non-interactive
  session) — pacing judgment call is Tres's on the live site.
- **Remaining 5 to rebuild:** echo, field, plan, pulse, alternates.
  (✅ Done 2026-07-11 — see the section above.)

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
