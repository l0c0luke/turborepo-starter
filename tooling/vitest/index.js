// Shared Vitest preset — every package's vitest.config.ts is a one-liner:
//
//   import { createVitestConfig } from "@example-app/vitest-config";
//   export default createVitestConfig();
//
// Tests are colocated (`src/**/*.test.ts`). `pnpm test` runs them with
// coverage, and the thresholds below fail the run (and CI) when coverage drops.
// Plain JS on purpose: Node won't strip TypeScript inside node_modules, which
// is where workspace packages resolve from.
import { defineConfig } from "vitest/config";

/** Minimum coverage (%) for every package. Raise per package, never lower. */
export const defaultThresholds = {
  lines: 80,
  statements: 80,
  functions: 80,
  branches: 75,
};

/**
 * @param {{
 *   environment?: "node" | "jsdom",
 *   thresholds?: Partial<typeof defaultThresholds>,
 *   coverageExclude?: string[],
 *   globalSetup?: string[],
 *   setupFiles?: string[],
 * }} [options]
 */
export function createVitestConfig(options = {}) {
  return defineConfig({
    test: {
      environment: options.environment ?? "node",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      globalSetup: options.globalSetup,
      setupFiles: options.setupFiles,
      // Fail on stray `.only` and on suites that define no tests.
      allowOnly: false,
      passWithNoTests: false,
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.{test,spec}.{ts,tsx}",
          "src/**/*.d.ts",
          "src/test/**",
          ...(options.coverageExclude ?? []),
        ],
        reporter: ["text-summary"],
        thresholds: { ...defaultThresholds, ...options.thresholds },
      },
    },
  });
}
