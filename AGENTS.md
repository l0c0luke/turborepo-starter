# AGENTS.md

Canonical guidance for AI agents (Claude Code, Cursor, Copilot, Codex, …) working
in this repo. `CLAUDE.md` and `.github/copilot-instructions.md` point here.

## What this is

An opinionated **skeleton** for a full-stack mobile + web monorepo. It is
intentionally **not** a finished demo app — it ships the wiring (auth, database,
type-safe API, UI primitives, design system, CI, deploy) plus **one** working
reference feature (a users admin) and otherwise gets out of your way. Build your
app by **adding** features, not by deleting demos.

Placeholders `@example-app/` (scope), `Example App` (name), `example-app` (slug),
and `com.example.app` (bundle id) are intentional — the `project-init` skill
renames them for a new project.

## Starting a new project

- **Bootstrap the dev environment:** `pnpm install && pnpm setup` (creates `.env`,
  starts Postgres + MailHog, pushes the schema, seeds a dev admin). Then `pnpm dev`.
- **Rename + scaffold for an app idea:** run the **project-init** skill/agent
  (`.claude/skills/project-init/` and `.github/agents/project-init.agent.md`). It
  renames the placeholders and scaffolds initial features. The skeleton is already
  stripped, so init is about _adding_, not _removing_.

## Tech stack

- **Mobile**: Expo SDK 57 (SDK-aligned React Native 0.86), React 19, NativeWind 5 (Tailwind 4)
- **Web**: Next.js 16.4 (App Router, Turbopack), React 19, Tailwind 4, shadcn/ui
- **Auth**: better-auth 1.7 (email OTP, magic link, Google, Apple)
- **DB**: Drizzle ORM (0.45) + PostgreSQL
- **API**: tRPC v11 (end-to-end type safety)
- **Validation**: Zod v4 (`import { z } from "zod/v4"`)
- **Errors**: Sentry v11 (DSN-gated — inert until a DSN is set)
- **Tests**: Vitest 5 · **Lint**: oxlint 1.88 (type-aware, `.oxlintrc.json`) · **TypeScript 7**
- **Monorepo**: Turborepo 2.11 + pnpm 11 catalog · **Node** ≥ 22.13

## Layout

```
apps/
  expo/      # React Native app — app/ screens, components/ui, styles/ tokens, utils/
             # (MUST remain in apps/expo — never move to root or outside apps/)
  nextjs/    # Next.js app — src/app routes, src/_components/ui shadcn, src/trpc, src/auth
packages/
  api/        # tRPC routers (router/) + root.ts + trpc.ts
  auth/       # better-auth config (additionalFields: isAdmin)
  db/         # Drizzle client, schema.ts, auth-schema.ts, seed.ts, ping()
  email/      # react-email templates + nodemailer sender
  validators/ # shared Zod schemas (server + client)
  shared/     # framework-agnostic utils: log, parseError, captureException
  analytics/ · seo/  # Next.js helpers
tooling/      # prettier / typescript / github configs (lint config: .oxlintrc.json)
```

## Reference patterns (copy these)

- **Auth loop**: `apps/nextjs/src/app/login/page.tsx` → `src/proxy.ts` (gating) →
  `src/app/page.tsx` (authed landing). Mobile: `apps/expo/src/app/index.tsx` → `home.tsx`.
- **Protected, role-gated feature** (the canonical example): the **users admin** —
  `packages/api/src/router/admin.ts` (`adminProcedure` + validators in
  `packages/validators`), surfaced at `apps/nextjs/src/app/admin/page.tsx` +
  `src/_components/admin/AdminContent.tsx` (server `prefetch` → client `useSuspenseQuery`).
- **Add a tRPC procedure**: new file in `packages/api/src/router/`, register in
  `root.ts`; `publicProcedure` / `protectedProcedure` / `adminProcedure` from `../trpc`.
- **Add a test**: colocate `*.test.ts` next to the source (see
  `packages/shared/src/parse-error.test.ts`); add a `test` script + `vitest` if the
  package lacks one; `pnpm test` runs them all.

## Conventions

- **Package manager**: **Always use `pnpm`**. Never use `npm`, `yarn`, or `bun`.
  Never run raw `npx` commands that bypass workspace dependencies — use `pnpm dlx`,
  `pnpm exec`, or root package scripts. All dependencies, migrations, scripts, and
  app commands must be run through `pnpm`.
- **Mobile app directory**: The mobile app **must always remain in the `apps/` directory**
  (`apps/expo`). Never move it to the repository root, never extract it into a separate
  standalone repository or root-level folder, and never generate mobile code outside `apps/expo`.
- **Imports**: `@example-app/*` for packages, `~/*` (web) or `@/*` (mobile) for local.
- **Never** use `any`; strict TypeScript everywhere.
- **Env**: import the validated `env` from `~/env` — never `process.env` directly
  (enforced by oxlint; `env.ts` and a few framework files are the only exceptions).
- **Web styling**: Tailwind + shadcn/ui (`src/_components/ui/`).
- **Mobile styling**: NativeWind `className` (Tailwind) and/or design tokens from
  `@/styles` — never hardcode colors/spacing. Screens use the custom `NavigationBar`,
  not the default nav. (NativeWind 5 / Tailwind 4, CSS-first — theme in
  `apps/expo/src/global.css`, wired via `metro.config.js`; no `tailwind.config.js`.)
- **i18n**: all web user-facing strings via `next-intl`; files in
  `apps/nextjs/src/languages/` (`en`, `es` — add a file + a `lib/locale.ts` entry per locale).
- **API**: tRPC only — no custom fetch wrappers. **DB**: Drizzle via `@example-app/db/client`.
- **Errors**: report via Sentry; server/shared code can use `captureException` from
  `@example-app/shared` (forwards to Sentry when a DSN is set).

## Commands

```bash
pnpm setup         # one-time: .env + docker + db push + seed
pnpm dev           # all dev servers (pnpm dev:next for web only)
pnpm ios           # run expo iOS app
pnpm android       # run expo Android app
pnpm typecheck     # tsc across the workspace
pnpm lint          # oxlint (type-aware; lint:fix to autofix)
pnpm format:fix    # prettier
pnpm test          # vitest
pnpm build         # production build
pnpm db:push       # sync schema (prototyping)   ·   pnpm db:studio   ·   pnpm -F @example-app/db seed
pnpm db:generate   # emit SQL migration from schema changes (commit packages/db/drizzle/)
pnpm db:migrate    # apply pending migrations (run on deploy)
```

Always run `pnpm typecheck` (and `pnpm lint`) after changes. Tests, types,
formatting, and lint run in CI (`.github/workflows/ci.yml`); git hooks (lefthook)
format on commit and typecheck/lint on push.

## Deploy

`output: "standalone"` Next.js build → `apps/nextjs/Dockerfile` (build from repo
root) or any Node host. Health probe: `GET /api/health`. See `DEPLOY.md` and
`LAUNCH_CHECKLIST.md`. Dependencies are kept current via `renovate.json`.
