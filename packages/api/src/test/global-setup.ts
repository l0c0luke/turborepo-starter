import { db, ping } from "@example-app/db/client";

/**
 * API tests run against a real Postgres (the one `pnpm setup` starts; CI runs
 * a service container), so queries, constraints and migrations are exercised
 * for real. Fail fast with instructions instead of a wall of connection errors.
 */
export default async function setup(): Promise<void> {
  const reachable = await ping();
  await db.$client.end();
  if (!reachable) {
    throw new Error(
      "API tests need Postgres with migrations applied. Run `pnpm setup` (or `docker compose up -d postgres && pnpm db:migrate`), then re-run the tests.",
    );
  }
}
