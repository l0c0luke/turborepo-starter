---
name: testing
description: Write and fix tests in this monorepo the way its testing policy requires — Vitest with coverage thresholds, tRPC router tests through a real caller against the dev Postgres, validator tests, and pure-function tests. Use whenever adding behaviour, fixing a bug (regression test first), or when `pnpm test` / coverage / the testing conventions check fails.
---

# Testing

Testing is policy here (see `AGENTS.md` → Testing policy): new behaviour ships
with tests, bug fixes start with a failing regression test, and coverage
thresholds fail the build. Prefer real collaborators over mocks.

## Basics

- Vitest, colocated: `src/foo.ts` → `src/foo.test.ts`.
- Each package's `vitest.config.ts` is one line using the shared preset
  (`tooling/vitest/index.js`): `export default createVitestConfig();`. The
  preset sets coverage thresholds (80% lines/functions/statements, 75%
  branches) — raise them per package via `createVitestConfig({ thresholds })`,
  never lower them.
- `pnpm test` runs every package with coverage; `pnpm -F @example-app/api test:watch` to iterate.
- No `.only` (the preset sets `allowOnly: false`), no skipped tests without a
  linked reason, no snapshot tests of large objects — assert what matters.
- Tests are strict TypeScript too (typechecked and linted like the code).

## tRPC routers (`packages/api`) — required for every router

API tests call procedures through `callerFor()` from
`packages/api/src/test/helpers.ts`, against the real Postgres (`pnpm setup`
starts it; CI runs a service container with migrations applied). Don't mock
Drizzle — the queries are what you're testing.

```ts
import { afterAll, describe, expect, it } from "vitest";

import { callerFor, cleanupTestUsers, createTestUser } from "../test/helpers";

describe("workout router", () => {
  afterAll(cleanupTestUsers); // also delete rows your tests created

  it("rejects anonymous callers", async () => {
    await expect(callerFor().workout.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("only returns the caller's own workouts", async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    await callerFor(alice).workout.create({ name: "Run", durationMinutes: 30 });

    await expect(callerFor(bob).workout.list()).resolves.toEqual([]);
  });

  it("validates input", async () => {
    const alice = await createTestUser();
    await expect(
      callerFor(alice).workout.create({ name: "", durationMinutes: -1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
```

Cover, for every procedure: the auth boundary (`UNAUTHORIZED` / `FORBIDDEN`),
**ownership** (another user can't read or change the row), validation
(`BAD_REQUEST`), the happy path, and not-found. Use unique data per test
(`createTestUser` generates ids) so tests can run in any order and in parallel
files. The HTTP contract (status codes, `zodError` shape) is covered once in
`packages/api/src/http.test.ts`.

## Validators and pure functions

Test the accept and reject edges of every schema (`safeParse(...).success`),
and pure helpers with table-driven cases (`it.each`). See
`packages/validators/src/index.test.ts`, `packages/shared/src/*.test.ts`.

## Bug fixes

1. Write a test that reproduces the bug and fails for the right reason.
2. Fix the code; the test passes.
3. Keep the test — it is the proof the bug stays fixed.

## New packages

`pnpm gen:package` scaffolds a package with a `test` script, the shared
preset and a first test. A package without tests fails
`pnpm check:conventions`; the debt list there (`UNTESTED_PACKAGES_DEBT`) is
for pre-existing packages only — remove a package from it when you add its
tests, never add one.

## When coverage fails

Read the per-file report (`pnpm -F <pkg> exec vitest run --coverage
--coverage.reporter=text`) and test the uncovered **behaviour** — don't write
tests that only execute lines, and don't exclude files to pass.
