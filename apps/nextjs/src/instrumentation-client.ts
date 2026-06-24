// Sentry browser-side initialization.
// Inert unless NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";

import { env } from "~/env";

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
  });
}

// Required for Sentry to instrument App Router navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
