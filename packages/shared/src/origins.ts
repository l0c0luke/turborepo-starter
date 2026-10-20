/**
 * Parse a comma-separated list of origins (e.g. the `TRUSTED_ORIGINS` env var)
 * into a de-duplicated array. Whitespace and empty entries are dropped, and a
 * bare trailing slash on an http(s) origin is removed ("https://a.com/" ->
 * "https://a.com"). Other entries — custom app schemes like "myapp://" or
 * Better Auth wildcard patterns like "https://*.example.com" — are kept as-is.
 */
export function parseOriginList(value: string | null | undefined): string[] {
  if (!value) return [];
  const origins = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) =>
      /^https?:\/\/[^/]+\/$/i.test(entry) ? entry.slice(0, -1) : entry,
    );
  return [...new Set(origins)];
}

/**
 * Exact-match CORS check against an allow-list of http(s) origins. Returns
 * the origin to echo in `Access-Control-Allow-Origin`, or `null` when the
 * request has no Origin header or it isn't allowed. Wildcards are
 * intentionally not supported — list each origin explicitly.
 */
export function matchAllowedOrigin(
  origin: string | null | undefined,
  allowed: readonly string[],
): string | null {
  if (!origin) return null;
  return allowed.includes(origin) ? origin : null;
}
