// The front door dice roll: tres.studio/ serves one universe at random.
// URL stays "/" — this is a rewrite, not a redirect. Refreshing / re-rolls.
// Inner paths (/1/, /2/…) re-roll on refresh too, but CLIENT-side — see the
// refresh-roll block in src/lib/multiverse.ts (MV_CLIENT), which shares the
// mv_last cookie with this function so the two never roll the universe the
// visitor is already in.
// ?u=N forces a universe (testing / "start here" links) — honored here at
// "/" and on every universe page by the client script; the single-version
// pages (/lab, /labs/*, /privacy) ignore it.
// IDS must match src/lib/multiverse.ts — an id LIST, not a count: the
// universes are not contiguous (7 is an open door; Tres named the new one 8).
const IDS = [1, 2, 3, 4, 5, 6, 8];

export default async (request, context) => {
  const url = new URL(request.url);
  const forced = Number(url.searchParams.get('u'));
  let n;
  if (IDS.includes(forced)) {
    n = forced;
  } else {
    // never the same door twice in a row — a re-roll that repeats reads as
    // "nothing happened". Roll among the other doors and remember the pick
    // in a small functional cookie (no tracking, just the last door).
    const last = Number(context.cookies.get('mv_last')) || 0;
    const pool = IDS.includes(last) ? IDS.filter((id) => id !== last) : IDS;
    n = pool[Math.floor(Math.random() * pool.length)];
  }
  try {
    context.cookies.set({
      name: 'mv_last',
      value: String(n),
      path: '/',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch (e) { /* cookie is a nicety; the roll must never fail on it */ }
  return context.rewrite(new URL(`/${n}/`, request.url));
};

export const config = { path: '/' };
