# AGENTS.md

Canonical guidance for AI agents (Claude Code, Codex, Cursor, Copilot, …) and
humans working in this repo. `CLAUDE.md` and `.github/copilot-instructions.md`
point here — change rules **here**, once.

Every rule below names what enforces it. If a rule says "CI", breaking it fails
the build; don't work around a check — fix the code, or change the rule here
and its check in the same PR.

## What this is

An opinionated **skeleton** for a full-stack mobile + web monorepo. It ships
the wiring (auth, database, type-safe API, UI primitives, design system, error
tracking, analytics, CI, deploy) plus **one** reference feature (a users admin)
and otherwise gets out of your way. Build your app by **adding** features.

Placeholders `@example-app/` (scope), `Example App` (name), `example-app`
(slug) and `com.example.app` (bundle id) are intentional — the `project-init`
skill renames them.

## Starting a new project

1. `pnpm install && pnpm setup` — creates `.env` (with a random `AUTH_SECRET`),
   starts Postgres + Mailpit + Bugsink, applies migrations, seeds a dev admin,
   provisions Bugsink projects and writes their DSNs into `.env`, and sends a
   test event so you can see error tracking working. Idempotent.
2. `pnpm dev` — web at http://localhost:3000 (sign in as `admin@example.com`;
   the magic link/OTP lands in Mailpit at http://localhost:8025, errors in
   Bugsink at http://localhost:8000 — `admin@example.com` / `admin`).
3. Run the **project-init** skill to rename placeholders and scaffold the
   app's first features (it asks for the GA4 measurement ID — every project
   ships with Google Analytics).

## Tech stack

- **Mobile**: Expo SDK 58 (React Native 0.88), React 19.3, NativeWind 5 (Tailwind 4)
- **Web**: Next.js 16.4 (App Router, Turbopack), React 19.3, Tailwind 4, shadcn/ui
- **Auth**: Better Auth 1.7 (email OTP, magic link; Google/Apple optional — on only when their env vars are set)
- **DB**: Drizzle ORM 0.45 + PostgreSQL 18 · **API**: tRPC 11 · **Validation**: Zod 4 (`zod/v4`)
- **Errors**: Sentry SDKs → **Bugsink** (self-hosted, Sentry-compatible; local instance in `docker-compose.yml`)
- **Analytics**: Google Analytics 4 (`@example-app/analytics`) — standard in every project
- **Tooling**: TypeScript 7 · oxlint (type-aware) · Prettier · Vitest 5 · knip · Turborepo 2 · pnpm 11 · Node 24 LTS

## Layout

```
apps/
  expo/       # React Native app (MUST stay in apps/expo): src/app screens, src/components/ui, src/styles tokens, src/env.ts
  nextjs/     # Next.js app: src/app routes, src/_components/ui (shadcn), src/trpc, src/auth, src/env.ts
packages/
  api/        # tRPC routers (src/router/*.ts, each with a *.test.ts) + root.ts + trpc.ts
  auth/       # Better Auth config (additionalFields: isAdmin)
  db/         # Drizzle client, schema, migrations (drizzle/), seed
  email/      # react-email templates + nodemailer sender
  validators/ # shared Zod schemas (server + client)
  shared/     # framework-agnostic: log, captureException, errorTrackingOptions, queryDefaults, parseError
  analytics/  # GA4 provider + trackEvent · seo/ # metadata + JSON-LD helpers
tooling/      # typescript (strict base), vitest (shared preset), prettier, github (CI setup action)
scripts/      # setup.ts, check-conventions.ts, check-bundle.ts, check-infra.ts, bugsink-provision.py
infra/        # Terraform — only once the project uses a cloud provider: envs/<env>, modules/<name> (+ tests)
.agents/skills/  # agent skills (see "Agent skills"); .claude/skills/* symlink here
```

## Quality gates

`pnpm check` runs every local gate; CI (`.github/workflows/ci.yml`) runs the
same scripts plus the slower ones. **Work is done when `pnpm check` passes** —
the pre-push hook runs it too. Never bypass hooks (`--no-verify`).

| Gate                                                              | Script                          | Where                            |
| ----------------------------------------------------------------- | ------------------------------- | -------------------------------- |
| Lint — oxlint type-aware, **warnings fail**, unused disables fail | `pnpm lint`                     | check, CI, pre-commit (staged)   |
| Workspace manifests (sherif)                                      | `pnpm lint:ws`                  | check, CI                        |
| Formatting (Prettier)                                             | `pnpm format`                   | check, CI, pre-commit (auto-fix) |
| Types — strict TS, every package + root scripts                   | `pnpm typecheck`                | check, CI                        |
| Tests + coverage thresholds (API tests hit real Postgres)         | `pnpm test`                     | check, CI                        |
| Unused files/deps, unlisted (phantom) deps (knip)                 | `pnpm check:deps`               | check, CI                        |
| Peer dependencies                                                 | `pnpm check:peers`              | check, CI                        |
| Repo conventions (rules in this file)                             | `pnpm check:conventions`        | check, CI                        |
| Expo SDK version alignment                                        | `pnpm check:expo`               | check, CI                        |
| Terraform: fmt, validate, `terraform test`, tflint, trivy         | `pnpm check:infra`              | check, CI (once `infra/` exists) |
| Migrations apply + match the schema                               | `pnpm db:migrate` / drift check | CI                               |
| Production build                                                  | `pnpm build`                    | CI                               |
| Bundle budget per route                                           | `pnpm check:bundle`             | CI                               |
| Docker image builds                                               | —                               | CI                               |
| No high/critical advisories                                       | `pnpm check:audit`              | CI                               |
| No secrets in history (gitleaks)                                  | —                               | CI                               |
| Conventional Commit messages                                      | —                               | commit-msg hook                  |

## Conventions

- **Package manager**: **always `pnpm`** — never `npm`, `yarn`, `bun` or raw
  `npx` (use `pnpm dlx` / `pnpm exec`). _Enforced: `check:conventions`
  (scripts, workflows, Dockerfiles, lockfiles), Claude `settings.json` deny
  rules._
- **One version per dependency, in the catalog**: versions live only in the
  `pnpm-workspace.yaml` catalog; packages reference `catalog:` (or
  `workspace:`). `catalogMode: strict` makes `pnpm add <pkg>` do this for you
  — it reuses the catalog version or adds the latest to the catalog. Don't
  hand-write versions into a `package.json`. _Enforced: `check:conventions`
  (catalog), pnpm, sherif._
- **Dependencies are declared where they're used** — no relying on hoisting
  (phantom deps), no unused deps. _Enforced: knip._
- **Mobile app stays in `apps/expo`** — never move it to the root or outside
  `apps/`; never create Expo/RN config elsewhere. _Enforced: `check:conventions`._
- **TypeScript**: strict everywhere, never `any`, no non-null `!`, no floating
  promises, exhaustive `switch`es. _Enforced: tsc + oxlint._
- **Imports**: `@example-app/*` for packages, `~/*` for app-local files (both
  apps). Type-only imports use `import type`. Zod from `zod/v4`. _Enforced: oxlint._
- **Env**: import the validated `env` from `~/env` (web: `apps/nextjs/src/env.ts`;
  mobile: `apps/expo/src/env.ts`) — never `process.env` in app code. _Enforced: oxlint._
- **Logging**: never `console.*` in app/library code — use `log` from
  `@example-app/shared` (`log.error` also reports to Bugsink). Never log
  secrets, tokens, OTPs or PII. CLI scripts may use `console`. _Enforced: oxlint `no-console`._
- **API**: tRPC only — no custom fetch wrappers. `publicProcedure` /
  `protectedProcedure` / `adminProcedure` from `packages/api/src/trpc.ts`.
- **DB**: Drizzle via `@example-app/db/client`. Schema change ⇒
  `pnpm db:generate` ⇒ commit `packages/db/drizzle/` ⇒ `pnpm db:migrate`.
  (`pnpm db:push` is for throwaway local prototyping only.) _Enforced: CI drift check._
- **i18n (web)**: all user-facing strings via `next-intl`; every locale file in
  `apps/nextjs/src/languages/` has the same keys. _Enforced: `check:conventions` (keys)._
- **Styling**: web — Tailwind + shadcn/ui (`apps/nextjs/src/_components/ui/`).
  Mobile — NativeWind `className` and/or tokens from `~/styles`; never
  hardcode colors/spacing; screens use the custom `NavigationBar`.
- **Analytics**: product events go through `trackEvent` from
  `@example-app/analytics` — snake_case/GA4 names, no PII in params.
- **Infrastructure is Terraform**: if the project deploys to a cloud provider
  (AWS, GCP, Azure, Cloudflare, Hetzner, DigitalOcean, …), every resource in
  that account — including the VM a self-hosted PaaS runs on — is Terraform in
  `infra/` (`envs/<env>` root modules with a remote state backend and a
  committed `.terraform.lock.hcl`; `modules/<name>` with `terraform test`s).
  No console click-ops, no CLI `create`/`delete` scripts, no CDK, Pulumi,
  CloudFormation/SAM, Serverless or Bicep. CI authenticates with OIDC (no
  long-lived keys, no credentials in `.tf`/`*.tfvars`); changes are planned
  on the PR and applied from CI. See the **infrastructure** skill.
  _Enforced: `check:conventions` (terraform — layout, backends, lock files,
  other IaC tools, literal credentials, module tests), `check:infra` (fmt,
  validate, test, tflint, trivy)._
- **Fix once**: before writing something, look for code that already does it
  and reuse or extend it; fold duplicated logic into one shared piece.
- **Commits**: Conventional Commits (`feat(api): …`). _Enforced: commit-msg hook._

## UX: skeletons + instant feedback

Users must never wait on a blank screen, a lone spinner, or a button that does
nothing visible.

- **Web data routes**: server `prefetch` → `<Suspense fallback={<…Skeleton />}>`
  → client `useSuspenseQuery`, plus a sibling `loading.tsx` rendering the same
  skeleton (`apps/nextjs/src/app/admin/`). `apps/nextjs/src/app/loading.tsx`
  covers everything else. _Enforced: `check:conventions` (route-skeleton)._
- **Web components that load without Suspense** (`useQuery`) render a
  `<Skeleton>` while pending. _Enforced: `check:conventions` (query-skeleton)._
- **Mobile screens and components that load data**: render `<Skeleton>`
  (`~/components/ui/Skeleton`) shaped like the content while `isPending` —
  never a lone spinner. _Enforced: `check:conventions` (screen-skeleton)._
- **Mutations**: update the UI immediately — optimistic `onMutate` with
  rollback (the admin switch/delete in
  `apps/nextjs/src/_components/admin/AdminContent.tsx` is the pattern), or at
  least a per-item pending state — and always an `onError` toast. Revalidate
  in `onSettled`. _Enforced: `check:conventions` (mutation-feedback)._
- **Data tables and lists are server-side**: the database pages, searches
  and sorts — never fetch a whole table to slice, filter or sort it in the
  browser (no `getPaginationRowModel` / `getFilteredRowModel` /
  `getSortedRowModel`). A list procedure takes
  `listQuerySchema([...sortable columns])` from `@example-app/validators` and
  returns a `ListPage` built with `paginate()` + `searchAny()` + `sortBy()`
  (`packages/api/src/pagination.ts`; sort columns map to a whitelist, with an
  id tiebreaker). Web tables keep page/search/sort in the URL with
  `useListParams` (the page prefetches the same input from `searchParams`),
  use `DataTableSearch` (debounced), `SortableHead` and `DataTablePagination`
  from `apps/nextjs/src/_components/data-table/`, keep the current rows on
  screen (dimmed) while the next page loads, prefetch the neighbouring page on
  hover, and update every cached page optimistically with
  `useOptimisticPages`. Mobile lists use the same procedure with
  `useInfiniteQuery(trpc.….infiniteQueryOptions(input, { getNextPageParam:
(page) => page.nextCursor }))`. The admin users table is the pattern.
  _Enforced: `check:conventions` (server-pagination — every `findMany` /
  `select().from()` in a router has a `limit`; data-table; list-pagination),
  `admin.test.ts`._
- **Caching**: both apps share stale-while-revalidate defaults
  (`queryDefaults` in `@example-app/shared`) so revisits render instantly.
- In dev, tRPC adds a random 100–500 ms delay so missing loading states are
  obvious — don't remove it to "fix" a slow-feeling screen.

## Testing policy

Tests are how this repo knows it works; untested code is unfinished.

- Every new behaviour ships with tests; every bug fix with a regression test.
- Every tRPC router `packages/api/src/router/<name>.ts` has a sibling
  `<name>.test.ts` covering: unauthenticated → `UNAUTHORIZED`, wrong role →
  `FORBIDDEN`, invalid input → `BAD_REQUEST`, happy path, not-found. API tests
  call procedures through `callerFor()` (`packages/api/src/test/helpers.ts`)
  against the real Postgres — don't mock Drizzle.
- Every package with a `src/` has a `test` script and tests (the generator
  `pnpm gen:package` scaffolds one). Packages that predate the policy are
  listed as debt in `scripts/check-conventions.ts` — shrink that list, never grow it.
- Coverage thresholds (80% lines/functions/statements, 75% branches) live in
  `tooling/vitest/index.js` and fail `pnpm test`. Raise per package; never lower.
- Tests are colocated (`src/**/*.test.ts`) and must not use `.only`.
- See the **testing** skill for patterns. _Enforced: `pnpm test` (thresholds), `check:conventions` (testing)._

## Security & performance reviews

- **Auth, API, data access, file handling, or new external input** → review
  the change with the **security-audit** skill (guidance mode) before
  finishing. Run a **full audit** before launch and after major features
  (output goes outside the repo by default — never commit its reports).
- **Web UI / new client dependencies** → keep within the bundle budget
  (`apps/nextjs/bundle-budget.json`). If `check:bundle` fails, run the
  **next-bundle-optimizer** skill and fix what it finds; raise a budget only
  with a reason in the PR.
- **Infrastructure changes** (`infra/`) → `pnpm check:infra` (trivy fails
  on HIGH/CRITICAL misconfigurations) plus a **security-audit** review of IAM,
  network exposure and data storage.
- Secrets never go in code or committed files (gitleaks scans all history).

## Agent skills

Skills live in `.agents/skills/` (read natively by Codex, Copilot and others;
`.claude/skills/*` are symlinks). Third-party skills are pinned in
`skills-lock.json` — refresh with `pnpm skills:update`, restore with
`pnpm skills:install`, never edit them in place.

| Skill                         | Use it when                                                              |
| ----------------------------- | ------------------------------------------------------------------------ |
| `project-init`                | Turning this skeleton into a new app (rename + first features)           |
| `add-feature`                 | Building any feature end to end (schema → API → tests → web + mobile UI) |
| `testing`                     | Writing or fixing tests                                                  |
| `security-audit`              | Reviewing auth/API/data changes; full audits before launch               |
| `next-bundle-optimizer`       | Bundle budget failures; slow web page loads                              |
| `vercel-react-best-practices` | Writing or reviewing React/Next.js code                                  |
| `vercel-react-native-skills`  | Writing or reviewing React Native/Expo code                              |
| `expo-data-fetching`          | Mobile data loading, loading/empty/error states                          |
| `expo-design-system`          | Mobile tokens, components, design-system drift                           |
| `expo-upgrade`                | Expo SDK upgrades (`pnpm check:expo` failing)                            |
| `infrastructure`              | Any cloud resource: `infra/` layout, state, OIDC, plan/apply, the gate   |
| `terraform-style-guide`       | Writing or reviewing Terraform (HCL)                                     |
| `terraform-test`              | Writing `.tftest.hcl` tests for Terraform modules                        |

## Reference patterns (copy these)

- **Protected, role-gated feature**: `packages/api/src/router/admin.ts`
  (+ `admin.test.ts`) → `apps/nextjs/src/app/admin/page.tsx` +
  `loading.tsx` → `apps/nextjs/src/_components/admin/AdminContent.tsx`
  (server-side table: search, sort, pagination; optimistic mutations) and
  `AdminSkeleton.tsx`.
- **Auth loop**: `apps/nextjs/src/app/login/page.tsx` → `apps/nextjs/src/proxy.ts`
  (gating) → `apps/nextjs/src/app/page.tsx`. Mobile: `apps/expo/src/app/index.tsx` → `home.tsx`.
- **Add a tRPC procedure**: new file in `packages/api/src/router/` + its test,
  register in `packages/api/src/root.ts`.
- **Add a package**: `pnpm gen:package` (comes with a test).

## Commands

```bash
pnpm setup            # one-time (idempotent): .env, services, migrate, seed, Bugsink
pnpm dev              # all dev servers (pnpm dev:next for web only)
pnpm ios / android    # run the Expo app
pnpm check            # every local quality gate — run before you finish
pnpm lint:fix         # auto-fix lint · pnpm format:fix — auto-format
pnpm test             # vitest + coverage (needs Postgres: pnpm setup)
pnpm db:generate      # migration from schema changes (commit packages/db/drizzle/)
pnpm db:migrate       # apply migrations · pnpm db:seed · pnpm db:studio
pnpm check:bundle     # bundle budget (CI) · pnpm -F @example-app/nextjs analyze — interactive
pnpm check:infra      # Terraform gate (no-op until infra/ exists)
pnpm skills:update    # refresh third-party agent skills (skills-lock.json)
```

## Deploy

`output: "standalone"` Next.js → `apps/nextjs/Dockerfile` (built from the repo
root; pass `NEXT_PUBLIC_*` values as **build args** — they're inlined at build
time). Health probe: `GET /api/health`. Run `pnpm db:migrate` on deploy. See
`DEPLOY.md` and `LAUNCH_CHECKLIST.md`. Cloud resources are Terraform in
`infra/` (see Infrastructure above and `DEPLOY.md` → Infrastructure).
Dependencies stay current via Renovate.
