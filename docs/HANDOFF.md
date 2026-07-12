# tres.studio — Backend Overhaul Handoff

**Date:** 2026-07-01
**From:** Planning conversation, Claude web
**For:** Claude Code session in the tres.studio repo (and Tres, as the approver)
**Read this entire document before touching anything.**

---

## 0. The decision

**Primary path: the overhaul is the V4 foundation.** Migrate the site to Astro, with the Google Sheet preserved as the content-editing surface but read at **build time** instead of in the visitor's browser. Cloudinary stays. Netlify stays. The vanilla-JS site gets ported for visual/behavioral parity — this phase is plumbing, not redesign.

Rationale, so future sessions understand intent:

- The core defect of V-current is *when* the spreadsheet is read. Every visitor's browser does: load HTML → load JS → fetch the published Google Sheet endpoint (uncached, 300ms–2s, occasionally flaky) → parse → build DOM → then start fetching Cloudinary images. That waterfall is the "site runs weirdly": content pop-in, blank sections on Google hiccups, inconsistent loads. Google's published-sheet endpoints are a courtesy, not a CDN.
- Moving the sheet read to build time fixes this in any architecture. Doing it inside an Astro migration means the work isn't throwaway: the planned V4 rebuild (PHASE — GPGPU particle system, React Three Fiber) requires a build toolchain anyway, and Astro is Vite underneath, so R3F drops in later as islands instead of being bolted onto vanilla pages.
- The original "no framework, no build step" constraint existed so the site stayed simple for Tres to maintain by hand. That constraint is honored differently now: Claude Code operates the toolchain; Tres's manual surface stays exactly as simple as before (edit sheet → click Publish) or simpler.

**Fallback path** (if migration stalls, or Tres wants stability shipped before the port completes): §9 documents a bake-at-build patch on the current vanilla site. Most of its logic ports into the Astro data layer later.

---

## 1. Current state (stale-but-directional — verify in Phase 0)

The last full file audit predates the recent rebrand. Treat this inventory as orientation, not truth. **The repo is the source of truth; Phase 0 corrects this section.**

**Stack:** Plain HTML/CSS/JS, no framework, no build step. GitHub → Netlify. Domain `tres.studio` registered at Namerider; DNS is an A record (75.2.60.5) + CNAME (apex-loadbalancer.netlify.com) pointing at Netlify. **Do not touch DNS, the domain, or registrar settings.**

**Files as of the May audit (pre-rebrand):** `index.html`, `project.html`, `about.html`, plus lab pages; `style.css` (~1,500 lines); `scroll.js`, `data.js`, `config.js`, `dot.js`, `hammer.js`. Project/gallery data is fetched client-side from a published Google Sheet (exact endpoint/mechanism lives in `config.js` — identify it in Phase 0). Images served from Cloudinary via URL transforms.

**Live site as of 2026-07-01 (post-rebrand):** "Tres." wordmark; positioning line "Multidisciplinary designer on 30A — architecture, art, and code"; genre navigation (01 Architecture, 02 Personal, 03 Lab, 04 Downloads — "Soon," currently a mailto placeholder); Lab lists **7 experiments** (was 4: drift, plan, birds, field); category views appear driven by a `?cat=` URL param; project pages by `?id=` param; theme-color is now near-black, so the rebrand may have changed design tokens from the original light palette. A privacy page exists.

**Behaviors that must survive the port (easter eggs are features, not cruft):**
- Physics dot game with basketball hoop
- Hammer animation on the logo
- About-page typewriter effect
- Scroll reveal animations on cards/galleries; hero scroll behavior
- All 7 lab experiments, byte-for-byte behavior

**Known open items carried from the May audit** (fold into this overhaul, see Phase 5/6): two-tier Cloudinary transform strategy (deferred decision), `<title>`/meta description/Open Graph tags, gallery alt-text strategy, `:focus-visible` pass on lab subpages, about-typer `aria-live` fix.

---

## 2. Symptom capture (do this first, in conversation)

Tres has described the site as "running really weirdly" and "clunky" but has not enumerated symptoms. **At the start of the first Code session, ask him what weird looks like concretely** — pop-in? blank category pages? slow first paint? mobile-specific? intermittent? — and reproduce before and after. The runtime-sheet-fetch diagnosis above is high-confidence but unconfirmed against the post-rebrand code; if the audit reveals a different or additional cause (e.g., a rebrand regression), report it and adjust the plan rather than proceeding on rails.

---

## 3. Target architecture

- **Framework:** Astro (current stable major), static output, deployed on Netlify. No SSR — this site is fully static.
- **Content:** Astro content collections. A custom build-time loader fetches the Google Sheet and produces typed entries. The visitor's browser makes **zero** requests to Google.
- **Resilience:** Commit a last-good `data snapshot` (JSON) to the repo as part of each successful build or via a fallback mechanism, so a Google outage degrades to slightly-stale content instead of a failed build.
- **Publish workflow:** Netlify Build Hook + a Google Apps Script custom menu in the sheet. Tres edits cells → clicks "Publish site" → live in ~60–90s. Git pushes also auto-deploy as they do now.
- **Images:** Cloudinary retained. Implement the two-tier transform strategy during the port: thumbnails/grid at `f_auto,q_auto,w_~800–1100` (final width chosen after measuring the real rendered layout), lightbox/full at `f_auto,q_auto,w_~1800`. Add `loading="lazy"` below the fold and a `preconnect` to the Cloudinary domain.
- **Lab experiments:** Self-contained pages. Port via `public/` passthrough or minimal Astro wrappers — whichever preserves exact behavior with least surgery. Do not refactor their internals in this phase.
- **Styling:** Port the existing CSS and design tokens as-is (confirm current tokens in Phase 0 — the rebrand may have gone dark). Global stylesheet is fine; no CSS framework, no Tailwind. Parity, not redesign.
- **V4 readiness (foundation only):** Structure so a React Three Fiber island can be added later (Astro `@astrojs/react` integration is trivially added when needed). **Do not install R3F or build any particle work in this phase.**

### URL preservation

Anything shared or indexed must keep working. Netlify `_redirects` supports query-param matching; the pattern (verify exact syntax against current Netlify docs during cutover):

```
/project.html  id=:id   /project/:id   301!
/index.html    cat=:cat /:cat          301
```

Map every old route. New URL shape recommendation: clean paths (`/architecture`, `/lab`, `/project/<slug>`), but confirm the shape with Tres before locking it (§8).

### Apps Script publish button (pattern to implement)

```js
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Site')
    .addItem('Publish site', 'publish')
    .addToUi();
}
function publish() {
  UrlFetchApp.fetch('NETLIFY_BUILD_HOOK_URL', { method: 'post' });
  SpreadsheetApp.getActiveSpreadsheet().toast('Build triggered — live in about a minute.');
}
```

The build-hook URL is a capability token (anyone holding it can trigger builds — harmless but not for the public repo). Keep it in the Apps Script only.

---

## 4. Execution phases

Work in a branch (`astro-migration` or similar) with Netlify deploy previews. **Production cutover only on Tres's explicit go.** Each phase ends with a short report; do not silently roll into the next phase on anything with a decision embedded in it.

**Phase 0 — Audit (read-only, no edits).**
Full inventory of the post-rebrand repo: every file, every route, current design tokens, the sheet fetch mechanism and endpoint in `config.js`, the sheet's schema (tabs, columns, how rows map to projects/galleries/copy), all Cloudinary transform strings in use, Netlify config, and the list of easter eggs/behaviors actually present. Capture Tres's symptom description (§2) and confirm or correct the diagnosis. Baseline metrics: Lighthouse mobile, LCP, and a network-tab trace showing the Google request. **Deliverable: findings digest, prioritized, flagging anything that changes this plan. Stop and get approval before Phase 1.**

**Phase 1 — Scaffold.**
Astro init in the branch, Netlify build config, global CSS with the (verified) design tokens, base layout with nav/footer. Deploy preview live.

**Phase 2 — Data layer.**
Build-time sheet loader producing typed collections mirroring the current schema; snapshot fallback; build hook created; Apps Script menu installed in the sheet; end-to-end test: edit cell → Publish → preview updates.

**Phase 3 — Page port.**
Index, category views, project pages, about, privacy. Scroll animations and easter eggs intact. Parity check against the live site page-by-page.

**Phase 4 — Lab port.**
All 7 experiments moved with behavior identical. Add the carried-over `:focus-visible` pass here if low-risk.

**Phase 5 — Image pass.**
Two-tier Cloudinary transforms wired through the data layer, lazy loading, preconnect. Before/after weight comparison on the heaviest gallery (Tucker, ~46 images).

**Phase 6 — Cutover.**
`_redirects` for all legacy URLs; `<title>`/meta/OG tags per page (write drafts, Tres approves copy — see guardrails); Lighthouse re-run vs. Phase 0 baseline; Tres reviews the full deploy preview; on his go, merge and deploy to production. Watch Netlify logs for 404s on old URLs for a few days.

**Post-cutover backlog (not this phase):** gallery alt-text strategy, `aria-live` typer fix, Downloads section backend, and then V4/PHASE begins on this foundation.

---

## 5. Success criteria

- View-source of the homepage contains real project content (statically rendered — no client-side sheet fetch).
- Network tab shows zero requests to Google endpoints from the visitor's browser.
- Sheet edit → Publish → live in ≤ 2 minutes, verified end-to-end by Tres himself.
- All legacy URLs 301 to the right pages.
- All 7 lab experiments and all easter eggs behave identically to V-current.
- Lighthouse mobile performance materially improved over the Phase 0 baseline (target ≥ 90; LCP < 2.5s on throttled 4G).
- A build succeeds even when the Google fetch fails (snapshot fallback proven by test).

---

## 6. Guardrails

- **Parity first.** No visual redesign, no layout changes, no copy rewrites during the migration. Tactical brand decisions (accent strategy, type, wordmark, point-field motif) are a separate conversation that happens *after* the plumbing is sound.
- **Tres must be able to edit site copy without touching code.** The sheet workflow is a requirement, not a legacy quirk.
- If any copy does get drafted (meta descriptions, OG text): plain and specific. Tres explicitly dislikes pretentious tagline copy. He approves all of it.
- Don't touch DNS, domain, registrar, or email plans.
- Out of scope entirely: PHASE/V4 particle work (foundation only), the Revit extensions / paid product / Hub thread, Downloads backend.
- Ask before: deleting any file, changing URL shapes beyond the redirect plan, altering anything visual, or installing dependencies beyond Astro core + Netlify adapter.
- Branch + deploy previews for everything; production is sacred until the explicit go.

---

## 7. Open decisions — surface these with Tres, don't decide them

1. **Repo strategy:** in-place migration branch (recommended — history and Netlify config preserved) vs. fresh repo.
2. **New URL shape:** `/project/<slug>` and `/architecture` style clean paths (recommended) vs. keeping query-param shapes.
3. **Sheet endpoint:** keep the current fetch mechanism server-side vs. switching to the published-CSV endpoint (most stable unauthenticated option) vs. Sheets API v4 with a key. Decide after seeing what `config.js` actually uses and what the schema needs.
4. **Thumbnail width:** exact `w_` value after measuring the real rendered grid at common viewports.
5. **Sheet schema cleanup:** the audit may reveal dead columns (`tags`, `externalLink` were dropped from parsing in May). Propose cleanup; Tres approves.

---

## 8. Fallback: Path A — stabilize V-current without migrating

If Tres calls for stability *now*, or the migration needs to pause: add a small Node build script to the existing vanilla site that fetches the sheet during the Netlify build and writes `data.json` into the deploy; point the existing client code at the local JSON instead of Google; add the same build hook + Apps Script Publish button as §3. Roughly an afternoon. The loader logic, hook, and Apps Script all port directly into the Astro data layer later, so this is mostly not throwaway work — but don't do both paths preemptively; pick based on Tres's call at the time.

---

## 9. Kickoff prompt (paste as the first message in Claude Code)

> Read the handoff doc at the repo root in full before touching anything. Then execute **Phase 0 only** — the read-only audit — starting by asking me what "running weirdly" looks like concretely so you can reproduce it. Deliver the findings digest with: confirmation or correction of the diagnosis, the actual sheet endpoint and schema, current design tokens, the full route map, baseline Lighthouse/LCP numbers, and anything that changes the plan. Do not scaffold, install, or edit anything until I approve Phase 1.

Drop this file in the repo root (rename to `HANDOFF.md` if you like) so every future session can find it.
