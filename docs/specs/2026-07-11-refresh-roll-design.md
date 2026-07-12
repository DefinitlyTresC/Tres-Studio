# Refresh-roll — the multiverse re-rolls on refresh, sticks on navigation

**Date:** 2026-07-11 · **Status:** approved direction from Tres (verbal spec), design by Claude

## The spec (Tres's words, translated)

1. **Any refresh, any page** → the same page serves from a **different universe**
   (never the one you were just on — a repeat reads as "nothing happened").
2. **Click into a page and back out** → still the **same universe**. In-site
   navigation (links, back/forward) never re-rolls.
3. This currently doesn't happen: the dice only roll at `/` (edge function).
   Inner URLs carry the universe number (`/3/work`), so F5 pins you forever.

## What exists today

- `netlify/edge-functions/roll.js` — intercepts `/` only. Rewrite (URL stays `/`),
  anti-repeat via `mv_last` cookie (30d), `?u=N` forces a universe.
- Every one of the 30 universe pages injects `window.MV = {current, sites}` via
  `MV_CLIENT(n)` from `src/lib/multiverse.ts` — an inline head script, the single
  shared bootstrap. Lab injects `MV_CLIENT(0)` (no universe).
- Universes are fully self-contained: no `/N/` page links to `/`. The six-dot
  ring (`public/mv/ring.js`) is the only deliberate universe switch.
- Known hole: back-button to `/` after a bfcache miss re-rolls at the edge →
  you return to a *different* universe than you left. Violates rule 2.

## Approaches considered

**A. Client reload-roll in the MV bootstrap (chosen).**
Extend `MV_CLIENT` with ~30 lines that run synchronously at the top of `<head>`
on every universe page. Detect the navigation type via the Navigation Timing API
(`performance.getEntriesByType('navigation')[0].type`, legacy
`performance.navigation.type` fallback):
- `reload` on `/N/...` → roll one of the other five, `location.replace('/M/...')`.
- `back_forward` → never roll. Special case: arriving back at `/` when the edge
  re-rolled under you (bfcache miss) → `location.replace('/?u=' + stored)` to
  restore the universe you left (stored per-tab in `sessionStorage['mv:u']`).
- `navigate` → trust the URL (ring dots, deep links stay deliberate).
- `?u=N` works on **every universe page** now, not just `/`: pins that load
  (and jumps to universe N if the path disagrees). This is the dev/QA escape
  hatch — iterate on one universe with F5 without being teleported. (Single-
  version pages — /lab, /labs/*, /privacy — ignore `?u`; nothing to pin.)
- Client rolls also refresh the `mv_last` cookie so the front door's
  anti-repeat stays truthful.
+ Smallest possible diff (one shared function), works in `astro dev` (no edge
  needed), URL scheme untouched, zero SEO churn, loop-safe (`location.replace`
  loads report type `navigate`).
− Reload costs one throwaway HTML round-trip before the replace (~CDN-fast,
  fires before deferred analytics, so no double pageview).

**B. Edge function on every path, universe-less URLs (`/work`, `/about`).**
Purest form of "same URL, different version" — but requires rewriting every
internal link in six hand-built universes, breaks `astro dev` parity (no edge
locally), complicates the eventual SEO/canonical pass, big blast radius.
Rejected — not worth it for behavior A already delivers.

**C. Service worker rewriting.** Same result as B with worse failure modes
(stale-SW traps, iOS quirks). Rejected.

## Decision table (what happens when)

| Situation | Result |
|---|---|
| F5 / Cmd-R / address-bar re-enter on `/3/work` | `/M/work`, M ≠ 3, random |
| F5 on `/` | edge re-rolls (already live), client just records it |
| Link click within a universe | stays in that universe (URLs are prefixed) |
| Back/forward anywhere | exactly the page you left, same universe |
| Back to `/` after bfcache miss | client restores the universe you left via `?u=` |
| Ring dot / `/N/` deep link / `?u=N` | deliberate choice, respected + recorded |
| `/lab`, `/labs/*`, `/privacy`, legacy root pages | untouched (single-version pages; `MV.current` is 0 or absent) |
| Reload with `?u=N` in the URL | pinned — no roll (dev/QA/"start here" links) |

## Also in this pass

- `src/pages/index.astro` — the old pre-multiverse homepage port is unreachable
  in prod (edge owns `/`) but still serves at `/index.html`, in `astro dev`, and
  if the edge ever fails. Replace it with a minimal **front-door fallback**: same
  roll semantics client-side (anti-repeat via `mv_last`, honors `?u=`), noscript
  links to all six universes. Dev now behaves like prod.
- `lab.astro` back-link regex `[1-5]` → `[1-6]` (universe 6 was never matched —
  pre-existing bug from before the hang shipped).
- Comment truth: `roll.js` header ("inner paths deterministic" — no longer),
  `netlify.toml` ("main publishes repo root" — stale; main == astro-migration).
- **Repo cleanup** (the "messy in there" half of the request): `git rm` the dead
  pre-Astro static site from the repo root — `index/about/category/lab/privacy/
  project.html`, `style.css`, `brand.js`, `config.js`, `counter.js`, `data.js`,
  the stale root `labs/` (public/labs/ has the live rebuilt copies). Move
  `projects.xlsx` → `_archive/`, `HANDOFF.md` → `docs/`. Rewrite `README.md`
  for the multiverse era. Everything stays in git history.

## Storage / key map (no collisions — audited)

| Key | Where | Meaning |
|---|---|---|
| `sessionStorage mv:u` | **new** | this tab's current universe |
| `cookie mv_last` | edge + **now client too** | last universe served (anti-repeat) |
| `sessionStorage mv:covered / mv:lab-skin` | curtain / lab | existing, untouched |
| `ts_*`, `mv1-*` | analytics / site-1 sketch | existing, untouched |

## Verification plan

`astro build` green (149 pages) → `astro preview` + browser: reload-rolls on
inner pages (≥10 reloads, zero consecutive repeats), navigate-in/back-out keeps
the universe, `?u=` pins, lab reload keeps its own skin-roll behavior, zero
console errors. Adversarial multi-agent review of the script logic and the
cleanup safety before commit.
