import * as Sentry from "@sentry/nextjs";

export async function register() {
  // `NEXT_RUNTIME` is a Next.js-internal value, not part of the typed env.
  // eslint-disable-next-line no-restricted-properties
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  // eslint-disable-next-line no-restricted-properties
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture errors thrown in Server Components, middleware, and route handlers.
export const onRequestError = Sentry.captureRequestError;
