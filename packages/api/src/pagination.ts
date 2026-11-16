import type { AnyColumn, SQL } from "drizzle-orm";
import { asc, desc, ilike, or } from "drizzle-orm";

import type { ListPage, ListQuery } from "@example-app/validators";

/**
 * Server-side paging, search and sort for list procedures (AGENTS.md → UX →
 * Data tables). `admin.listUsers` is the pattern:
 *
 *   const where = searchAny(input.search, [user.name, user.email]);
 *   return paginate(input, {
 *     rows: (limit, offset) => ctx.db.query.user.findMany({
 *       where, limit, offset,
 *       orderBy: [sortBy(SORT_COLUMNS[input.sort], input.dir), asc(user.id)],
 *     }),
 *     count: () => ctx.db.$count(user, where),
 *   });
 *
 * Always add a unique tiebreaker (the id) after the sort column, or rows with
 * equal values can repeat or vanish between pages.
 */

/** Escapes LIKE wildcards so a search for `50%` or `a_b` matches literally. */
export const likePattern = (term: string) =>
  `%${term.replace(/[\\%_]/g, "\\$&")}%`;

/** Case-insensitive "contains" across columns; `undefined` (no filter) for an empty term. */
export function searchAny(
  term: string,
  columns: [AnyColumn, ...AnyColumn[]],
): SQL | undefined {
  if (!term) return undefined;
  const pattern = likePattern(term);
  return or(...columns.map((column) => ilike(column, pattern)));
}

export const sortBy = (column: AnyColumn, dir: ListQuery["dir"]) =>
  dir === "asc" ? asc(column) : desc(column);

/** Runs the page query and the count in parallel and shapes a `ListPage`. */
export async function paginate<TItem>(
  input: ListQuery,
  query: {
    rows: (limit: number, offset: number) => Promise<TItem[]>;
    count: () => Promise<number>;
  },
): Promise<ListPage<TItem>> {
  const page = input.cursor ?? input.page;
  const { pageSize } = input;
  const [items, total] = await Promise.all([
    query.rows(pageSize, (page - 1) * pageSize),
    query.count(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return {
    items,
    total,
    page,
    pageSize,
    pageCount,
    nextCursor: page < pageCount ? page + 1 : null,
  };
}
