// Sentry edge-runtime initialization (middleware / edge routes).
// Loaded by `src/instrumentation.ts`. Inert unless a DSN is set (`pnpm setup` points it at the local Bugsink).
import * as Sentry from "@sentry/nextjs";

import { errorTrackingOptions } from "@example-app/shared";

import { env } from "~/env";

const dsn = env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    ...errorTrackingOptions,
  });
}
