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

// Required by @sentry/nextjs to instrument App Router navigations. This is a
// client-only export — it lives in the SDK's browser entry point, which static
// import resolution doesn't see (it resolves the Node entry), hence the disable.
// eslint-disable-next-line import/namespace
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
