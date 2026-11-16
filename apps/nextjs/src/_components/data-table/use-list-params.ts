"use client";

import type { z } from "zod/v4";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import type { ListQuery } from "@example-app/validators";
import {
  listInputFromSearchParams,
  listInputToSearchParams,
} from "@example-app/validators";

const SEARCH_DEBOUNCE_MS = 300;

const toQueryString = (input: ListQuery, defaults: ListQuery) =>
  new URLSearchParams(listInputToSearchParams(input, defaults)).toString();

/**
 * URL-backed state for a server-side table (AGENTS.md → UX → Data tables).
 *
 * - `query` is the input to pass to the list procedure. The page component
 *   prefetches the same input from `searchParams`, so the first render is
 *   hydrated with no request.
 * - Paging, sorting and searching only change the URL (no server round trip
 *   for the page); the table keeps showing the current rows, dimmed via
 *   `isUpdating`, until the next page arrives — never a blank table or the
 *   Suspense fallback.
 * - The search box is local state, debounced into the URL.
 */
export function useListParams<TQuery extends ListQuery>(
  schema: z.ZodType<TQuery>,
) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const defaults = useMemo(() => schema.parse({}), [schema]);
  const input: TQuery = useMemo(
    () => listInputFromSearchParams(schema, searchParams),
    [schema, searchParams],
  );
  const current = toQueryString(input, defaults);

  // Keeps the previous rows on screen while the next page suspends.
  const query = useDeferredValue(input);
  // Set when we change the URL, cleared once the router commits any URL
  // (it may hold the commit until the new page has loaded).
  const [requestedFrom, setRequestedFrom] = useState<string | null>(null);
  if (requestedFrom !== null && requestedFrom !== current) {
    setRequestedFrom(null);
  }
  const isUpdating = query !== input || requestedFrom !== null;

  const navigate = useCallback(
    (change: Partial<ListQuery>, mode: "push" | "replace" = "push") => {
      const next = toQueryString({ ...input, ...change }, defaults);
      if (next === current) return;
      setRequestedFrom(current);
      const url = next ? `${pathname}?${next}` : pathname;
      // Next.js syncs useSearchParams with the History API, without
      // re-rendering the server page.
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [input, defaults, current, pathname],
  );

  const [searchText, setSearchText] = useState(input.search);
  // Back/forward changed the search: show it in the box (but don't fight
  // the user over whitespace while they type).
  const [syncedSearch, setSyncedSearch] = useState(input.search);
  if (syncedSearch !== input.search) {
    setSyncedSearch(input.search);
    if (searchText.trim() !== input.search) setSearchText(input.search);
  }
  useEffect(() => {
    if (searchText.trim() === input.search) return undefined;
    const timer = setTimeout(
      () => navigate({ search: searchText.trim(), page: 1 }, "replace"),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchText, input.search, navigate]);

  const sort: TQuery["sort"] = input.sort;
  return {
    /** Input for the list procedure (lags `input` while a page loads). */
    query,
    /** True while a page/sort/search change is loading. */
    isUpdating,
    searchText,
    setSearchText,
    setPage: (page: number) => navigate({ page }),
    setPageSize: (pageSize: number) => navigate({ pageSize, page: 1 }),
    setSort: (column: TQuery["sort"], dir: ListQuery["dir"]) =>
      navigate({ sort: column, dir, page: 1 }),
    toggleSort: (column: TQuery["sort"]) =>
      navigate({
        sort: column,
        dir: input.sort === column && input.dir === "asc" ? "desc" : "asc",
        page: 1,
      }),
    sort,
    dir: input.dir,
  };
}
