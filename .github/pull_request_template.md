## What & why

<!-- One or two sentences. Link the issue if there is one. -->

## Checklist

<!-- CI enforces most of this (see AGENTS.md → Quality gates); the rest is on you. -->

- [ ] `pnpm check` passes locally (CI also runs the build, bundle budget, Docker build, audit and secret scan)
- [ ] Tests added/updated for new behaviour — every router has a `*.test.ts`, coverage thresholds hold
- [ ] Data-loading UI shows a skeleton; mutations give instant feedback (optimistic or pending) and an error toast
- [ ] Schema changes come with a migration (`pnpm db:generate`, `packages/db/drizzle/` committed)
- [ ] New user-facing web strings are in every locale file (`apps/nextjs/src/languages/`)
- [ ] Auth, API or data-access changes: reviewed with the `security-audit` skill (guidance mode)
- [ ] Web UI changes: no bundle-budget regression (or a `next-bundle-optimizer` report justifies the new budget)
- [ ] Product events use `trackEvent` from `@example-app/analytics` (no PII in params)
