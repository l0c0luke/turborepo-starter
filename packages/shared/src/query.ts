/**
 * Shared TanStack Query defaults for the web and mobile apps (each builds its
 * own QueryClient; this keeps their caching behaviour identical).
 *
 * Stale-while-revalidate is what makes the UI feel instant: cached data
 * renders immediately (no skeleton on back-navigation) while a background
 * refetch keeps it fresh. A non-zero `staleTime` also stops the web app
 * re-fetching every server-prefetched query the moment it hydrates.
 *
 * Plain values only — no @tanstack/react-query import — so this package stays
 * framework-agnostic.
 */
export const queryDefaults = {
  queries: {
    /** Data younger than this is served from cache without refetching. */
    staleTime: 30 * 1000,
    /** Unused cache entries are kept this long (TanStack's default). */
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },
} as const;
