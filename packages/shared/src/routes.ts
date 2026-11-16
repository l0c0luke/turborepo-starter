/**
 * Route matching for app route registries (the web command palette and
 * contextual help resolve "which page am I on?" with it). Patterns use the
 * Next.js / Expo Router segment syntax: `/users/[id]`, `/docs/[...slug]`.
 */

const segments = (path: string) => path.split("/").filter(Boolean);
const isDynamic = (segment: string) => /^\[.+\]$/.test(segment);
const isCatchAll = (segment: string) =>
  /^\[{1,2}\.\.\..+\]{1,2}$/.test(segment);

/** How many leading segments of `pathname` the pattern matches, or -1. */
function matchDepth(pattern: string, pathname: string): number {
  const want = segments(pattern);
  const have = segments(pathname);
  for (const [index, segment] of want.entries()) {
    if (isCatchAll(segment)) return have.length > index ? have.length : -1;
    const actual = have[index];
    if (actual === undefined) return -1;
    if (!isDynamic(segment) && segment !== decodeURIComponent(actual))
      return -1;
  }
  return want.length;
}

/** True when `pathname` is exactly the route `pattern`. */
export function matchesRoute(pattern: string, pathname: string): boolean {
  const depth = matchDepth(pattern, pathname);
  return depth !== -1 && depth === segments(pathname).length;
}

/**
 * The route for `pathname`: an exact match, else its closest registered
 * ancestor (so `/admin/users/42` falls back to `/admin`, and anything to `/`).
 */
export function findRoute<TRoute extends { href: string }>(
  routes: readonly TRoute[],
  pathname: string,
): TRoute | undefined {
  let best: TRoute | undefined;
  let bestDepth = -1;
  for (const route of routes) {
    const depth = matchDepth(route.href, pathname);
    if (depth > bestDepth) {
      best = route;
      bestDepth = depth;
    }
  }
  return best;
}
