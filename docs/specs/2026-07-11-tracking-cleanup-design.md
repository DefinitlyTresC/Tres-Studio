# Tracking cleanup — self-exclusion, visitor IDs, counter reset + bot filter

**Date:** 2026-07-11 · **Status:** spec from Tres (verbal), design by Claude

## The asks (Tres's words, translated)

1. **Exclude me** from my own stats — phone, work computer, home computer,
   phone-on-NordVPN. IP rules can't do this (VPN + dynamic IPs); it "is kinda
   alot" precisely because IP is the wrong axis.
2. **Assign user IDs to each person** that show up in Clarity and can be
   worked with there (filter/find), "like things i can edit."
3. **Reset the visit total to 0** and **stop bots inflating it**.

## Design

### 1. Self-exclusion: a per-browser kill-switch (`localStorage ts_off`)

The insight: exclude the **browser**, not the network. A flag in localStorage
rides along no matter what IP/VPN the device uses. Tres visits the hidden
control page **`/me`** once per browser (3 real browsers — the NordVPN case
is the same phone browser, so it's covered automatically) and hits
[ exclude this browser ]. Done forever, adjustable anytime.

- `ts_off === '1'` → the tracking bootstrap injects **nothing** (no Umami, no
  Clarity), and the counter clients send `x=1` so the pulse function serves
  numbers without counting. Tres still *sees* the ticker.
- Excluding also sets `umami.disabled=1` (Umami's own standard bypass) as a
  belt-and-suspenders for any cached pages.
- `/me` is noindex and linked from nowhere.

### 2. Visitor IDs → Clarity

Every tracked browser gets a stable, memorable, pseudonymous ID —
`ts_vid` in localStorage, shaped like `ochre-heron-42` (palette word +
coastal bird + 2 digits, tres-flavored). The bootstrap sends it to Clarity:

- `clarity("identify", vid, null, null, friendlyName)` — custom user ID
  (Clarity hashes it) + the name shown on recordings/filters.
- `clarity("set", "visitor", vid)` — a custom tag, filterable in the
  dashboard (Filters → Custom tags → visitor).

`friendlyName` = `ts_name` if set (editable on `/me` — so Tres can label his
own devices "carter-phone" etc. before excluding them, or label a friend's
browser when they visit him) — otherwise the vid itself. Umami is left as-is
(Tres asked for Clarity; Umami's session view keys off its own IDs).

### 3. One bootstrap to rule them: `public/ts.js`

Umami + Clarity snippets are currently pasted inline in **39 files** (31
Astro pages incl. the Base.astro layout + 7 static lab pages). All 39
collapse to one line:
`<script (is:inline) defer src="/ts.js"></script>`. ts.js:

- always defines `window.TS` (id, name, off, exclude(), include(),
  setName()) so `/me` and the console can drive it;
- boots nothing when: `ts_off`, or `navigator.webdriver` (headless bots), or
  pathname is `/me`;
- injects Umami (same data-domains guard) and Clarity (same
  `tres.studio`-host guard) exactly as before, plus the identify calls.

One place to edit tracking forever after. This is the "keep my code tidy"
half of the ask.

### 4. Counter: reset to 0 + bot filter (`pulse.mjs`)

- **Reset by epoch:** the total moves from Blobs key `total` to `total-2`.
  Deploy = fresh 0. Epoch 1 stays untouched in the store as the historical
  record (bots + Tres's own visits baked in). No manual Blobs surgery, no
  admin secrets, self-executing.
- **Bot filter, server-side:** requests with a User-Agent matching the bot
  regex (bot/crawl/spider/headless/lighthouse/curl/python…) or with no UA at
  all get numbers back but are never counted. Client-side, `navigator.
  webdriver` browsers send `x=1` too.
- **Self-exclusion:** `x=1` (set by counter.js/ticker.js when `ts_off`) →
  no seen-write, no increment, no presence-write; response still carries
  `{total, live}` so the widget renders for Tres.
- ticker.js's cached-total roll-up already handles a shrinking total
  (`if (from > target) from = 0`), so the reset won't glitch the flip-cards.

### 5. Honesty

`/privacy` gains one sentence: visits are grouped by a random ID stored in
the browser, never tied to identity. (Umami/Clarity already do their own
bot filtering; their historical dashboards can't be retro-cleaned — the
reset applies to OUR counter, which is the number on the site.)

## Keys (added to the existing map)

| Key | Where | Meaning |
|---|---|---|
| `localStorage ts_off` | new | '1' = this browser is excluded |
| `localStorage ts_vid` | new | stable visitor id (`ochre-heron-42`) |
| `localStorage ts_name` | new | optional friendly name → Clarity |
| `localStorage umami.disabled` | Umami standard | set/cleared with ts_off |
| Blobs `ts-stats/total-2` | new | epoch-2 visit total (epoch 1 = `total`, frozen) |

## Verification plan

`astro build` green → browser: /me toggles the flag and survives reload;
ts.js generates a stable vid and skips injection when excluded/webdriver;
counter clients append x=1 when excluded; pulse.mjs logic exercised via a
Node harness (Netlify functions don't run under `astro dev`); adversarial
review workflow before commit. Live after deploy: fresh total at 0, Clarity
shows custom IDs on new sessions, Tres's excluded browsers record nothing.
