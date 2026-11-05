import type { TRPCQueryOptions } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { headers } from "next/headers";
import { dehydrate, HydrationBoundary, noop } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "@example-app/api";
import { appRouter, createTRPCContext } from "@example-app/api";

import { auth } from "~/auth/server";
import { createQueryClient } from "./query-client";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    headers: heads,
    auth,
  });
});

const getQueryClient = cache(createQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  router: appRouter,
  ctx: createContext,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
// eslint-disable-next-line typescript/no-explicit-any
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  // Start the fetch on the server without awaiting it; <HydrateClient>
  // streams the pending query to the client. Errors surface there (via the
  // client's useSuspenseQuery + error boundary), so swallow them here.
  if (queryOptions.queryKey[1]?.type === "infinite") {
    // eslint-disable-next-line typescript/no-unsafe-argument, typescript/no-explicit-any
    queryClient.infiniteQuery(queryOptions as any).catch(noop);
  } else {
    queryClient.query(queryOptions).catch(noop);
  }
}
