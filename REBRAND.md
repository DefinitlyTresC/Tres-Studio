# tres.studio — Rebrand Brief (V2 identity on the Astro foundation)

**Date:** 2026-07-01 · **Source:** Tres, rebrand kickoff conversation
**Status of the migration:** Phases 0–4 of HANDOFF.md are DONE (parity port on
branch `astro-migration`, edit-sheet→Publish pipeline proven end-to-end).
**Phases 5 & 6 are folded into this rebrand** — image tiers, meta/OG, and the
production cutover all ship as part of the rebrand build, not before it.

---

## 1. Palette (Tres-supplied, locked as the starting point)

| Swatch | Hex | Role (working) |
|---|---|---|
| Cream | `#FFEDDB` | background |
| Sand | `#EDCDBB` | surface / cards |
| Clay | `#E3B7A0` | mid accents |
| Umber | `#BF9270` | strong accents |

**Gaps to resolve before building (flagged by Claude):**
- No **ink color** — Umber on Cream is ~2.4:1 contrast, unusable for text.
  Needs a near-black (likely a warm espresso, not pure black) for body/display.
- Decide whether there's a **fifth "signal" accent** (for interactive states,
  the ticker counter, links) or whether Umber carries all interaction.
- **CONFIRMED (2026-07-01):** the site flips **light-first** (was near-black
  `#080808`). Dark mode is a maybe-later, not part of this build.
- Honest note: warm-cream + terracotta is a *popular* palette family right now.
  It stays distinctive through execution — the blob motion, architectural
  content, and type choices must carry the personality, not the palette alone.

## 2. Motion & interaction budget (hard limits Tres set)

- **2–3 mouse effects max**, plus click interactions. Clean over clever.
- **Blob / ragged-edge effect** on project-photo scrolling — the layout device
  from [ragged-edge](https://recent.design/i/jsz1o56-ragged-edge), but more
  blob-like in motion. Critically: it's a *layout* treatment on imagery; it
  never distorts or interferes with text.
- **Tracking button** — the back-button that follows the cursor vertically,
  inspired by nonfigurativ.com/projects. Adapted, not copied. "Clean af."
- **Interior scroll feel** from [meech213](https://recent.design/i/i1mq7nk-meech213)
  — brings the blob feel into page flow. **iOS-first**: horizontal scrolling
  is acceptable *only if it works flawlessly on touch*.
- **Podium-style zoom-through-logo landing**
  ([podium](https://recent.design/i/gxi9ddp-podium)) — Tres likes it but NOT
  for the main site. Candidate: **entry to the Lab section**. Interior must be
  cleaner than Podium's.

## 3. Landing concept (working idea, not final)

Scroll-driven: a clean **hero shot per project, ~5 featured projects** stacked
as you scroll; after the last one, the page "drops you into" the section menu
(taxonomy per §4). Open: exact drop mechanic, and whether the wordmark gets a
moment first.

## 4. Navigation / IA — ✅ DECIDED 2026-07-01: Option A

**Tres picked Option A** (curate by quality, not provenance). The roster:
- **Work (5, also the landing heroes, in discussion order):** Alys Beach Z-07
  (`z07`), Alys Beach EE-13 (`ee13`), Flatwood Residence (`flatwood`),
  The Pointe at Tucker Landing (`tucker`), Thesis Project (`thesis`).
- **Archive:** every other architecture project (creekbridge, drome,
  urbanneighbors, variousdetails, woodcomp, schoolwork, fithyearmini …).
- **Personal / Lab / Downloads** as described below.

Original discussion kept for context:

**Problem (Tres):** current categories mix school work, professional work,
filler, and never-filled sections (photography). Wants it streamlined and
honest.

**Tres's straw proposal:** Professional · School · Personal · Lab · Revit
Extension Downloads.

**Claude's counter-proposal (Option A, recommended):** curate by *quality,
not provenance*:
- **Work** — selected best projects across professional + academic, each
  tagged with its context ("Professional · Alys Beach", "Thesis · academic").
  Feeds the 5 landing heroes.
- **Archive** — dense index-list page (very recent.design) holding schoolwork,
  filler, minor projects. Everything has a home; nothing weak gets hero
  treatment. Solves the "filler work" embarrassment structurally.
- **Personal** — photography/art, only once there's content (no more "Soon").
- **Lab** — experiments (possibly behind the Podium-style zoom entry).
- **Downloads** — pyRevit extension packs (section to be built; download
  counters via the existing pulse/Blobs pattern).

Rationale: "School" as a top-level nav item ages badly as professional work
accumulates; visitors care about what the work *is*, not where it was made.
Option B = Tres's original five, refined. **Decision pending.**

## 5. Content model v2 — new Google Sheet + book restructure

- **Rebuild the sheet** clean, in-theme. Same edit-sheet→Publish workflow
  (non-negotiable, already proven on the branch).
- **Two project layouts:**
  - **Book** — long-form one-offs: *The Pointe* and *Thesis* only.
  - **Standard** — max **5 main images** on the page + a **"View gallery"**
    button opening a 25–30 image Cloudinary gallery.
- Hard cap 100 images/project (books are why the cap exists at all).
- **Cloudinary folder structure stays as-is** (Home/architecture/<slug>/,
  personal/<slug>/, about/, lab/) — Tres reorganizes it himself over the next
  few weeks. Content work is on his clock; build work shouldn't block on it.

### 📌 SIDE NOTE for a dedicated discussion (Tres asked for this)
How to structure ~17 existing projects under the new model:
- Which ~5 are the landing heroes? Which make "Work" vs "Archive"?
- Proposed sheet v2 schema: `Slug · Title · Section · Context tag ·
  Featured(order) · Layout(book/standard) · Hero · main_01..main_05 ·
  Description · Year/Location/Status` — and the gallery does NOT live in the
  sheet at all: at build time, list the project's Cloudinary `gallery/` folder
  via the Admin API (free tier, key in Netlify env vars only) so Tres curates
  galleries by *dragging images into folders*, never touching 100 columns.
  Discuss before committing.
- Duplicate `Order` values in the current sheet get cleaned in the rebuild.

## 5b. 3D assets — idea parking lot (Tres offered, 2026-07-01)

Tres can provide **clean STL files** (and other formats) of his building
models. Not scoped yet — candidates, roughly in order of effort:
- Wireframe/contour-line motifs drawn from real model geometry (cheap, on-brand
  with the drawing-set DNA).
- A model viewer island on Work project pages (React Three Fiber — the V4
  integration path Astro was chosen for).
- Lab experiments built on the models; possibly behind the Podium-zoom entry.
- The V4 PHASE particle field morphing between *models* rather than photos.
Decide after R1 ships; don't let 3D scope-creep the rebrand.

## 6. Counter, analytics, privacy

- **Visitor counter stays** — rebuilt as an **old-fashioned black-and-white
  mechanical ticker/odometer**, fixed bottom-right. Reset the count at rebrand
  launch (clear the `ts-stats` Netlify Blobs store). Open to additional
  "friendly tracker" displays (ideas welcome round).
- **Umami + Clarity carry over** (already preview-guarded in Base.astro).
- **Privacy page: strip to bare-minimum plain language.** Tone: "I collect
  anonymous data. I use it to improve the site." One caveat that must survive
  legally: Clarity uses cookies — one honest sentence about it stays.

## 6b. Lab rebuild (added 2026-07-01, Tres)

The 6 experiments (drift, plan, birds, field, echo, pulse) get **rebuilt as
fully better versions of themselves** — not ported, re-made: V2 identity,
iOS/touch-first controls, performance pass, and each pushed further as an
experience where the concept supports it. Candidate extras: the Podium-style
zoom as the Lab section entry (§2), STL-derived experiments (§5b), and
whether "Alternates" survives as a concept. Originals stay recoverable in git
history; the live site carries only the new versions. **Depends on R1
decisions (ink/type/motion) — labs are born in the new identity, not
re-skinned later.**

## 7. Sequencing

1. **R0 — decisions:** IA (§4), ink/accent + light-flip (§1), landing mechanic
   (§3). Conversation, cheap, do first.
2. **R1 — design system + motion prototypes:** tokens, type, the blob scroll,
   tracking button, ticker — built as isolated prototypes on the branch
   preview for Tres to feel on his phone (iOS-first).
3. **R2 — sheet v2 + data layer update** (schema per §5, gallery-from-folder
   if approved). Can start once Tres's Cloudinary reorg is far enough along.
4. **R3 — build the real pages** on the new IA; image tiers (old Phase 5),
   meta/OG (old Phase 6), Downloads section skeleton.
5. **R4 — cutover:** redirects verified, Lighthouse vs. baseline, counter
   reset, Tres's explicit go → production.

## 8. Carry-over guardrails

- Tres edits content in a sheet, never code. $24/yr domain, $0/month, no
  servers to babysit. No DNS/domain/registrar changes. Branch + deploy
  previews for everything; production moves only on Tres's explicit go.
- Copy voice: plain and specific; no pretentious taglines. Tres approves copy.
