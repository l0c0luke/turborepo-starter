import path from "node:path";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import { createJiti } from "jiti";
import createNextIntlPlugin from "next-intl/plugin";

const jiti = createJiti(import.meta.url);

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
await jiti.import("./src/env");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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

  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },

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

const nextConfig = withBundleAnalyzer(withNextIntl(config));

// Sentry wraps the final config. With no SENTRY_AUTH_TOKEN it skips source-map
// upload (a warning, not an error), so the build works out of the box and only
// reports at runtime once a DSN is set.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
