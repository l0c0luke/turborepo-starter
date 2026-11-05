# Copilot instructions

**Canonical guidance lives in [`AGENTS.md`](../AGENTS.md)** — Copilot reads it
too. This file only repeats the handful of rules that matter most; if they
ever disagree, AGENTS.md wins (and should be fixed here).

- **Done = `pnpm check` passes.** CI also runs the build, a per-route bundle
  budget, the Docker build, `pnpm audit` and a gitleaks secret scan.
- **Always `pnpm`** — never `npm`, `yarn`, `bun` or raw `npx`.
- **The mobile app stays in `apps/expo`.**
- Strict TypeScript, no `any`; validated `env` from `~/env` (never
  `process.env`); `log` from `@example-app/shared` (never `console`); Zod from
  `zod/v4`; tRPC for all API calls.
- **Tests are policy**: every tRPC router has a sibling `*.test.ts`; coverage
  thresholds fail the build.
- **Skeletons + instant feedback**: data routes/screens render skeletons;
  mutations are optimistic (or show per-item pending state) and toast on error.
- Schema changes ship with a migration (`pnpm db:generate`).
- Skills in `.agents/skills/`: `add-feature`, `testing`, `security-audit`,
  `next-bundle-optimizer`, `project-init`, plus React/Expo best-practice skills.
