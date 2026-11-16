"use client";

import type { QueryFilters, QueryKey } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ListPage } from "@example-app/validators";

type Snapshot<TItem> = { previous: [QueryKey, ListPage<TItem> | undefined][] };

/**
 * Optimistic updates for a paged list (AGENTS.md → UX → Mutations). Every
 * cached page of the list (`trpc.<router>.<list>.pathFilter()`) is updated at
 * once, so the change shows on whichever page, search or sort is on screen:
 *
 *   const pages = useOptimisticPages<User>(trpc.admin.listUsers.pathFilter(), t("actionFailed"));
 *   useMutation(trpc.admin.deleteUser.mutationOptions({
 *     onMutate: ({ userId }) => pages.update((items) => items.filter((u) => u.id !== userId)),
 *     onError: (_e, _v, snapshot) => pages.rollback(snapshot),
 *     onSettled: pages.revalidate,
 *   }));
 *
 * Removing items lowers `total` to match; `revalidate` then refetches the
 * real page from the server.
 */
export function useOptimisticPages<TItem>(
  filter: QueryFilters,
  errorMessage: string,
) {
  const queryClient = useQueryClient();
  return {
    update: async (
      change: (items: TItem[]) => TItem[],
    ): Promise<Snapshot<TItem>> => {
      await queryClient.cancelQueries(filter);
      const previous = queryClient.getQueriesData<ListPage<TItem>>(filter);
      queryClient.setQueriesData<ListPage<TItem>>(filter, (page) => {
        if (!page) return page;
        const items = change(page.items);
        return {
          ...page,
          items,
          total: page.total + items.length - page.items.length,
        };
      });
      return { previous };
    },
    rollback: (snapshot?: Snapshot<TItem>) => {
      for (const [key, page] of snapshot?.previous ?? []) {
        queryClient.setQueryData(key, page);
      }
      toast.error(errorMessage);
    },
    revalidate: () => queryClient.invalidateQueries(filter),
  };
}
