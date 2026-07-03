// The front door dice roll: tres.studio/ serves one universe at random.
// URL stays "/" — this is a rewrite, not a redirect. Refreshing / re-rolls;
// inner paths (/1/, /2/…) are deterministic and untouched.
// ?u=N forces a universe (testing / "start here" links).
// COUNT must match src/lib/multiverse.ts.
const COUNT = 2;

export default async (request, context) => {
  const url = new URL(request.url);
  const forced = Number(url.searchParams.get('u'));
  const n = forced >= 1 && forced <= COUNT ? forced : 1 + Math.floor(Math.random() * COUNT);
  return context.rewrite(new URL(`/${n}/`, request.url));
};

export const config = { path: '/' };
