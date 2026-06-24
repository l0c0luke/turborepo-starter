// Sentry server-side initialization (Node runtime).
// Loaded by `src/instrumentation.ts`. Inert unless SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";

import { setErrorReporter } from "@example-app/shared";

import { env } from "~/env";

const dsn = env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 1,
    enableLogs: true,
  });

  // Route `captureException` / `log.error` from @example-app/shared to Sentry.
  setErrorReporter((error, context) =>
    Sentry.captureException(error, context ? { extra: context } : undefined),
  );
}
