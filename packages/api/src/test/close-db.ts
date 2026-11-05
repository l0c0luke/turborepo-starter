import { afterAll } from "vitest";

import { db } from "@example-app/db/client";

// Each test file gets its own module graph (and Postgres pool); close it so
// the worker can exit cleanly.
afterAll(async () => {
  await db.$client.end();
});
