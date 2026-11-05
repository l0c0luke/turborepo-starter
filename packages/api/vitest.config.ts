import { createVitestConfig } from "@example-app/vitest-config";

export default createVitestConfig({
  globalSetup: ["src/test/global-setup.ts"],
  setupFiles: ["src/test/close-db.ts"],
});
