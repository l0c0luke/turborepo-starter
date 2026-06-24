// Sentry edge-runtime initialization (middleware / edge routes).
// Loaded by `src/instrumentation.ts`. Inert unless SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";

import { env } from "~/env";

const dsn = env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1,
  });
}
