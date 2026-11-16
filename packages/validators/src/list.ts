import { z } from "zod/v4";

/**
 * The contract for every list/table: the SERVER pages, searches and sorts.
 * Clients never download a whole table to filter or slice it in the browser.
 *
 * - A list procedure takes `listQuerySchema([...sortable columns])` as input
 *   and returns a `ListPage<T>` (build it with `paginate()` in
 *   packages/api/src/pagination.ts).
 * - The web table keeps the input in the URL (`useListParams`), so a search
 *   or page survives reloads and is shareable; `listInputFromSearchParams`
 *   turns the URL back into the same input on the server (for `prefetch`)
 *   and the client, so the hydrated query keys match.
 * - Mobile lists use the same procedure through tRPC `infiniteQueryOptions`,
 *   which sends the page number as `cursor`.
 */

/** Page sizes the web table offers. */
export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;
/** The server rejects larger pages (BAD_REQUEST). */
export const MAX_PAGE_SIZE = 100;
export const MAX_SEARCH_LENGTH = 200;

export const sortDirections = ["asc", "desc"] as const;
export type SortDirection = (typeof sortDirections)[number];

/** Input schema for a list procedure; the first sortable column is the default sort. */
export function listQuerySchema<
  const TSort extends readonly [string, ...string[]],
>(sortable: TSort, defaults: { dir?: SortDirection } = {}) {
  return z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
    search: z.string().trim().max(MAX_SEARCH_LENGTH).default(""),
    sort: z.enum(sortable).default(sortable[0]),
    dir: z.enum(sortDirections).default(defaults.dir ?? "desc"),
    /** Set by tRPC infinite queries (mobile); takes precedence over `page`. */
    cursor: z.number().int().min(1).nullish(),
  });
}

/** Parsed input of any list procedure. */
export interface ListQuery {
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  dir: SortDirection;
  cursor?: number | null;
}

/** What every list procedure returns. */
export interface ListPage<TItem> {
  items: TItem[];
  /** Rows matching the search, across all pages. */
  total: number;
  page: number;
  pageSize: number;
  /** At least 1, so "page 1 of 1" renders for an empty result. */
  pageCount: number;
  /** The next page for infinite queries, or null on the last page. */
  nextCursor: number | null;
}

/** `URLSearchParams` / `ReadonlyURLSearchParams` (anything with `get`), or Next.js page `searchParams`. */
type SearchParamsLike =
  | { get: (name: string) => string | null }
  | Record<string, string | string[] | undefined>;

const LIST_KEYS = ["page", "pageSize", "search", "sort", "dir"] as const;

const getParam = (params: SearchParamsLike, key: string) => {
  const value =
    typeof params.get === "function"
      ? (params as { get: (name: string) => string | null }).get(key)
      : (params as Record<string, string | string[] | undefined>)[key];
  return Array.isArray(value) ? value[0] : (value ?? undefined);
};

/**
 * Reads a list input from URL search params. Invalid or missing values fall
 * back to the schema defaults instead of failing, so a hand-edited URL still
 * renders the table.
 */
export function listInputFromSearchParams<TSchema extends z.ZodType>(
  schema: TSchema,
  params: SearchParamsLike,
): z.output<TSchema> {
  const raw: Record<string, string | number> = {};
  for (const key of LIST_KEYS) {
    const value = getParam(params, key);
    if (value === undefined || value === "") continue;
    raw[key] = key === "page" || key === "pageSize" ? Number(value) : value;
  }
  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Drop the fields that failed and keep the rest.
  const invalid = new Set(parsed.error.issues.map((issue) => issue.path[0]));
  for (const key of invalid) {
    if (typeof key === "string") Reflect.deleteProperty(raw, key);
  }
  return schema.parse(raw);
}

/**
 * The inverse of `listInputFromSearchParams`: only values that differ from
 * the defaults are written, so the default view keeps a clean URL. Pass the
 * result to `new URLSearchParams(…)`.
 */
export function listInputToSearchParams(
  input: ListQuery,
  defaults: ListQuery,
): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of LIST_KEYS) {
    if (input[key] !== defaults[key]) params[key] = String(input[key]);
  }
  return params;
}
