import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs/config";
import { createJiti } from "jiti";
import createNextIntlPlugin from "next-intl/plugin";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import("next").NextConfig} */
const config = {
  /** Produce a self-contained server build for Docker (see apps/nextjs/Dockerfile) */
  output: "standalone",
  /** Trace workspace dependencies from the monorepo root for standalone output */
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@example-app/analytics",
    "@example-app/api",
    "@example-app/auth",
    "@example-app/db",
    "@example-app/seo",
    "@example-app/shared",
    "@example-app/validators",
  ],

  /**
   * Fail the build on type errors. CI runs `typecheck` separately, but the
   * build is the last line of defense — a package whose typecheck script is
   * skipped (or a machine that never runs it) should not produce a broken
   * production bundle that only fails at runtime.
   */
  typescript: { ignoreBuildErrors: false },

  experimental: {
    /**
     * TypeScript 7 dropped the compiler API Next.js used for its built-in type
     * checks, so route the remaining checks through the TypeScript CLI.
     * (`pnpm typecheck` is what actually gates types in CI.)
     */
    useTypeScriptCli: true,
  },

  typedRoutes: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

// Bundle analysis: `pnpm -F @example-app/nextjs analyze` (Turbopack's built-in
// `next analyze`); CI enforces a size budget with `pnpm check:bundle`.
const nextConfig = withNextIntl(config);

// Source maps upload only when SENTRY_AUTH_TOKEN is set (CI/release). Works
// with Bugsink as well as Sentry: set SENTRY_URL to your Bugsink instance.
export default withSentryConfig(nextConfig, {
  sentryUrl: process.env.SENTRY_URL,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Tree-shake SDK code we don't use out of the browser bundle (~30 KB gz):
  // tracing is off (errorTrackingOptions in @example-app/shared — Bugsink
  // ignores it) and Session Replay isn't enabled. Flip excludeTracing to
  // false if you move to Sentry and raise tracesSampleRate.
  bundleSizeOptimizations: {
    excludeTracing: true,
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeReplayWorker: true,
  },
});
