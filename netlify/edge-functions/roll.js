// The front door dice roll: tres.studio/ serves one universe at random.
// URL stays "/" — this is a rewrite, not a redirect. Refreshing / re-rolls;
// inner paths (/1/, /2/…) are deterministic and untouched.
// ?u=N forces a universe (testing / "start here" links).
// COUNT must match src/lib/multiverse.ts.
const COUNT = 6;

export default async (request, context) => {
  const url = new URL(request.url);
  const forced = Number(url.searchParams.get('u'));
  let n;
  if (forced >= 1 && forced <= COUNT) {
    n = forced;
  } else {
    // never the same door twice in a row — a re-roll that repeats reads as
    // "nothing happened". Roll among the other COUNT-1 and remember the pick
    // in a small functional cookie (no tracking, just the last door).
    const last = Number(context.cookies.get('mv_last')) || 0;
    if (last >= 1 && last <= COUNT) {
      n = 1 + Math.floor(Math.random() * (COUNT - 1));
      if (n >= last) n += 1;
    } else {
      n = 1 + Math.floor(Math.random() * COUNT);
    }
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
