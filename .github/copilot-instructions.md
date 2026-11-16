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
- **⌘K + contextual help**: register every web page in
  `apps/nextjs/src/navigation/routes.ts` with `routes.<key>` and
  `help.pages.<key>` messages; page actions via `usePageCommands`; every
  mobile screen passes `help={screenHelp.<screen>}`.
- **Tables and lists are server-side**: list procedures take
  `listQuerySchema` and return `paginate()` pages; web tables use
  `useListParams` + `_components/data-table/`; mobile lists use
  `useInfiniteQuery`. Never page, search or sort fetched rows in the browser.
- Schema changes ship with a migration (`pnpm db:generate`).
- Versions only in the `pnpm-workspace.yaml` catalog (`pnpm add` writes
  `catalog:`); never hand-write a version into a `package.json`.
- Cloud provider resources are **Terraform in `infra/`** only — no console
  click-ops, no CDK/Pulumi/CloudFormation; OIDC in CI, never keys.
- Skills in `.agents/skills/`: `add-feature`, `testing`, `security-audit`,
  `next-bundle-optimizer`, `infrastructure`, `project-init`, plus React/Expo
  and Terraform best-practice skills.
