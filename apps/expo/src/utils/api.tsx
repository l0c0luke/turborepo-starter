import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { AppRouter } from "@example-app/api";
import { log, queryDefaults } from "@example-app/shared";

import { env } from "~/env";
import { authClient } from "./auth";

/**
 * One QueryClient for the app, with the same stale-while-revalidate defaults
 * as the web app (see `queryDefaults` in @example-app/shared): cached screens
 * render instantly while a background refetch keeps them fresh.
 */
export const queryClient = new QueryClient({
  defaultOptions: queryDefaults,
});

/**
 * tRPC options proxy — the same API the web app uses. In a screen:
 *
 *   const { data, isPending } = useQuery(trpc.auth.getSession.queryOptions());
 *   const mutation = useMutation(trpc.admin.setUserAdmin.mutationOptions());
 *
 * Render a skeleton while `isPending`, and give mutations an immediate
 * pending/optimistic state (see the `add-feature` skill).
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (opts) =>
          __DEV__ ||
          (opts.direction === "down" && opts.result instanceof Error),
        colorMode: "ansi",
        logger: (opts) => {
          if (opts.direction === "down" && opts.result instanceof Error) {
            log.error(`[tRPC] ${opts.path} failed`, opts.result);
          } else if (__DEV__) {
            log.debug(`[tRPC ${opts.direction}] ${opts.path}`);
          }
        },
      }),
      httpBatchLink({
        transformer: superjson,
        url: `${env.EXPO_PUBLIC_BASE_URL}/api/trpc`,
        async headers() {
          const headers = new Map<string, string>();
          headers.set("x-trpc-source", "expo-react");

          // Better Auth's Expo plugin keeps the session cookie in SecureStore.
          const cookies = await authClient.getCookie();
          if (cookies) {
            headers.set("Cookie", cookies);
          }
          return headers;
        },
      }),
    ],
  }),
  queryClient,
});

export type { RouterInputs, RouterOutputs } from "@example-app/api";
