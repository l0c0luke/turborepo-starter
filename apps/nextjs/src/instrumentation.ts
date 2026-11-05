import * as Sentry from "@sentry/nextjs";

export async function register() {
  // `NEXT_RUNTIME` is a Next.js-internal value, not part of the typed env
  // (this file is exempt from the process.env lint rule).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");

    // Every project ships with GA4. Make a production deploy without it loud
    // (NEXT_PUBLIC_* is baked in at build time — see DEPLOY.md).
    const { env } = await import("./env");
    if (env.NODE_ENV === "production" && !env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      const { log } = await import("@example-app/shared");
      log.warn(
        "NEXT_PUBLIC_GA_MEASUREMENT_ID is not set: Google Analytics is disabled in this production build.",
      );
    }
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture errors thrown in Server Components, middleware, and route handlers.
export const onRequestError = Sentry.captureRequestError;
