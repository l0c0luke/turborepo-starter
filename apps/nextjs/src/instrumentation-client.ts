// Sentry browser-side initialization.
// Inert unless NEXT_PUBLIC_SENTRY_DSN is set (`pnpm setup` points it at the local Bugsink).
import * as Sentry from "@sentry/nextjs";

import { errorTrackingOptions } from "@example-app/shared";

import { env } from "~/env";

if (env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    ...errorTrackingOptions,
  });
}

// Required by @sentry/nextjs to instrument App Router navigations. This is a
// client-only export — it lives in the SDK's browser entry point, which static
// import resolution doesn't see (it resolves the Node entry), hence the disable.
// eslint-disable-next-line import/namespace
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
