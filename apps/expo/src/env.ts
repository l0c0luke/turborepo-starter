import { z } from "zod/v4";

/**
 * Validated, typed public env for the mobile app — the Expo counterpart of
 * `apps/nextjs/src/env.ts`. Import `env` from `~/env`; never read
 * `process.env` elsewhere in `src/` (enforced by oxlint).
 *
 * Values come from the repo-root `.env`: every script in package.json runs
 * through `pnpm with-env`, and Expo inlines `EXPO_PUBLIC_*` variables into the
 * bundle at build time. Each variable must be referenced statically
 * (`process.env.EXPO_PUBLIC_X`) for that inlining to work, so they are listed
 * one by one below rather than passing `process.env` itself.
 */
const emptyAsUndefined = (value: string | undefined) =>
  value === "" ? undefined : value;

const schema = z.object({
  /** Where the mobile app reaches the API (the web app's origin). */
  EXPO_PUBLIC_BASE_URL: z.url(),
  /** Google sign-in: the same web client ID as the server's AUTH_GOOGLE_ID. */
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().min(1).optional(),
  /** Apple sign-in (iOS): "true" once the server has Apple configured. */
  EXPO_PUBLIC_APPLE_AUTH_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  /** Error tracking (Bugsink locally, or any Sentry-compatible DSN). */
  EXPO_PUBLIC_SENTRY_DSN: z.url().optional(),
});

export const env = schema.parse({
  EXPO_PUBLIC_BASE_URL: emptyAsUndefined(process.env.EXPO_PUBLIC_BASE_URL),
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: emptyAsUndefined(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  ),
  EXPO_PUBLIC_APPLE_AUTH_ENABLED: emptyAsUndefined(
    process.env.EXPO_PUBLIC_APPLE_AUTH_ENABLED,
  ),
  EXPO_PUBLIC_SENTRY_DSN: emptyAsUndefined(process.env.EXPO_PUBLIC_SENTRY_DSN),
});
