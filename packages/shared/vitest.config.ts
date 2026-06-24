import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node environment is the default; switch to "jsdom" for component tests.
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
