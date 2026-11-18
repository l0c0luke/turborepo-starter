# Example App - Full Stack Starter Template

A production-ready monorepo **skeleton** for building full-stack applications with a React Native mobile app (Expo) and a Next.js web application. Both apps share authentication, database, and type-safe APIs. It ships the wiring and one reference feature (a users admin) — you add your app on top, rather than deleting demo content.

> **New Project?** Use the `@project-init` agent to transform this skeleton into your app. It handles renaming, scaffolding, and configuration automatically.
>
> **AI agents:** canonical conventions live in [`AGENTS.md`](AGENTS.md).

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Environment Variables](#environment-variables)
- [Package Architecture](#package-architecture)
- [Mobile Development](#mobile-development)
- [Web Development](#web-development)
- [Authentication](#authentication)
- [Database](#database)
- [API Development](#api-development)
- [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Launch Checklist](#launch-checklist)
- [Contributing](#contributing)

## Overview

This monorepo contains everything you need to start building a full-stack application:

- **Mobile App**: Expo SDK 58 with SDK-aligned React Native and React 19
- **Web App**: Next.js 16 with React 19
- **Shared Packages**: Database, API, Authentication, Validation, and more

### Key Technologies

| Category           | Technology                                             |
| ------------------ | ------------------------------------------------------ |
| **Mobile**         | Expo SDK 58, React Native 0.88, React 19, NativeWind 5 |
| **Web**            | Next.js 16.4, React 19, Tailwind CSS 4, shadcn/ui      |
| **Authentication** | Better-Auth 1.7 (OTP; optional Google, Apple Sign In)  |
| **Database**       | Drizzle ORM (0.45), PostgreSQL 18                      |
| **API**            | tRPC v11 (end-to-end type safety)                      |
| **Validation**     | Zod v4                                                 |
| **Monorepo**       | Turborepo 2.11, PNPM 11                                |
| **Tooling**        | TypeScript 7, oxlint 1.91, Prettier, Vitest 5, knip    |
| **Runtime**        | Node.js 24 LTS (`.nvmrc`; engines `>=24.11.0`)         |
| **Errors**         | Sentry SDKs → Bugsink (self-hosted, local in Docker)   |
| **Analytics**      | Google Analytics 4 (`@example-app/analytics`)          |

## Features

### Mobile App (Expo)

- 🔐 **Authentication** - Email OTP, plus optional Google and Apple Sign In
- 📱 **Cross-Platform** - iOS and Android support
- 🎨 **Design System** - Centralized styling with design tokens
- 🧭 **Custom Navigation** - Consistent custom navigation bar

### Web Dashboard (Next.js)

- 👤 **User Management** - User authentication and profiles
- 🔑 **Multi-Provider Auth** - Magic link / OTP, plus optional Google and Apple Sign In
- 🌐 **Internationalization** - Multi-language support with next-intl
- 🎨 **Modern UI** - Tailwind CSS with shadcn/ui components

## Quick Start

### Prerequisites

- Node.js 24 LTS (`nvm use` reads `.nvmrc`; engines require `>=24.11.0`)
- PNPM 11 (`corepack enable`)
- Docker (for PostgreSQL, Mailpit and Bugsink)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd example-app

# Install dependencies
pnpm install

# One-command bootstrap (idempotent):
#   creates .env, starts Postgres + Mailpit + Bugsink, applies migrations,
#   seeds a dev admin, provisions Bugsink and writes its DSNs into .env
pnpm setup

# Start development servers
pnpm dev
```

Then open <http://localhost:3000> and sign in as **admin@example.com** — the
magic-link / OTP email lands in Mailpit at <http://localhost:8025>, and the
seeded admin can reach the users admin at `/admin`. Errors from both apps land
in Bugsink at <http://localhost:8000> (`admin@example.com` / `admin`) — setup
already sent a test event so you can see it working.

> Prefer to do it by hand? `cp .env.example .env`, `docker compose up -d --wait`,
> `pnpm db:migrate`, then `pnpm db:seed`.

### Quick Access

- **Web App**: <http://localhost:3000>
- **Mailpit** (email testing): <http://localhost:8025>
- **Bugsink** (error tracking): <http://localhost:8000>
- **Drizzle Studio**: `pnpm db:studio`

## Project Structure

```text
├── apps/
│   ├── expo/                 # React Native mobile app
│   │   └── src/
│   │       ├── app/          # Expo Router pages
│   │       ├── components/   # Reusable components
│   │       ├── hooks/        # Custom React hooks
│   │       ├── styles/       # Design system tokens
│   │       └── utils/        # Utility functions
│   │
│   └── nextjs/               # Next.js web application
│       └── src/
│           ├── _components/  # Shared components
│           ├── app/          # App Router pages
│           ├── i18n/         # Internationalization
│           ├── languages/    # Translation files
│           └── trpc/         # tRPC client setup
│
├── packages/
│   ├── api/                  # tRPC API router
│   ├── analytics/            # Google Analytics provider
│   ├── auth/                 # Better-Auth configuration
│   ├── db/                   # Drizzle ORM + PostgreSQL
│   ├── email/                # Email templates + sending
│   ├── seo/                  # Metadata and JSON-LD helpers
│   ├── shared/               # Shared utilities
│   └── validators/           # Zod validation schemas
│
└── tooling/
    ├── prettier/             # Prettier configuration
    └── typescript/           # TypeScript base configs
```

## Development Setup

### Environment Variables

Copy `.env.example` to a root `.env` file. The defaults work with the included Docker services:

```env
POSTGRES_URL="postgresql://example:example@localhost:5832/example"
AUTH_SECRET="supersecret"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EXPO_PUBLIC_BASE_URL="http://localhost:3000"
```

Optional credentials are also documented in `.env.example` for Google Sign In and Apple Sign In (each enabled only when its credentials are set — see [Authentication](#authentication)), SMTP, `TRUSTED_ORIGINS`, error tracking (Bugsink DSNs — filled in by `pnpm setup`) and Google Analytics (standard in every project; set the measurement ID per app).

### Available Scripts

```bash
# Setup
pnpm setup            # .env + services + migrations + seed + Bugsink (idempotent)

# Development
pnpm dev              # Start all development servers
pnpm dev:next         # Start Next.js development server only

# Database
pnpm db:generate      # Generate a SQL migration from schema changes (commit packages/db/drizzle/)
pnpm db:migrate       # Apply pending migrations (also on deploy)
pnpm db:seed          # Re-seed dev data
pnpm db:studio        # Open Drizzle Studio
pnpm db:push          # Throwaway prototyping only — CI requires migrations

# Quality gates (CI runs the same scripts — see AGENTS.md → Quality gates)
pnpm check            # Everything below in one go — run before you push
pnpm lint             # oxlint, type-aware; warnings fail
pnpm lint:ws          # sherif workspace lint
pnpm format           # Prettier check (format:fix to write)
pnpm typecheck        # TypeScript, every package + root scripts
pnpm test             # Vitest + coverage thresholds (API tests use the dev Postgres)
pnpm check:deps       # knip: unused files/deps, undeclared deps
pnpm check:conventions # repo rules from AGENTS.md (pnpm-only, catalog, tests, skeletons, server-side tables, ⌘K + contextual help, i18n, skills, terraform)
pnpm check:expo       # Expo SDK version alignment
pnpm check:bundle     # per-route JS budget (apps/nextjs/bundle-budget.json; CI)
pnpm check:audit      # no high/critical advisories (CI)
pnpm check:infra      # Terraform fmt/validate/test/tflint/trivy (once infra/ exists)

# Mobile
pnpm ios              # Run iOS app
pnpm android          # Run Android app

# Building
pnpm build            # Build all packages and apps
pnpm -F @example-app/nextjs analyze   # Interactive Turbopack bundle analyzer

# Agent skills
pnpm skills:update    # Refresh third-party skills in .agents/skills (skills-lock.json)
```

## Package Architecture

All packages use the `@example-app/` scope and are located in `packages/`:

| Package                   | Description                   | Usage                                                                 |
| ------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `@example-app/analytics`  | Google Analytics provider     | `import { AnalyticsProvider } from "@example-app/analytics/provider"` |
| `@example-app/api`        | tRPC router and procedures    | `import { appRouter } from "@example-app/api"`                        |
| `@example-app/auth`       | Better-Auth configuration     | `import { auth } from "@example-app/auth"`                            |
| `@example-app/db`         | Drizzle ORM client and schema | `import { db } from "@example-app/db/client"`                         |
| `@example-app/email`      | Email templates and sender    | `import { sendEmail } from "@example-app/email"`                      |
| `@example-app/seo`        | Metadata and JSON-LD helpers  | `import { createMetadata } from "@example-app/seo"`                   |
| `@example-app/shared`     | Framework-agnostic utilities  | `import { log, captureException } from "@example-app/shared"`         |
| `@example-app/validators` | Zod validation schemas        | `import { setUserAdminSchema } from "@example-app/validators"`        |

## Mobile Development

The mobile app lives strictly in `apps/expo` within the `apps/` directory and is managed via `pnpm`.

### iOS Setup

```bash
pnpm ios
# or: cd apps/expo && pnpm ios
```

### Android Setup

```bash
pnpm android
# or: cd apps/expo && pnpm android
```

### Expo Styling Guidelines

The Expo app uses **NativeWind 5** (Tailwind 4 for React Native — CSS-first; the
theme lives in `apps/expo/src/global.css` and is wired via `apps/expo/metro.config.js`,
so there's no `tailwind.config.js`). Use `className` on components (see
`apps/expo/src/app/home.tsx`):

```tsx
<View className="flex-1 p-4">
  <Text className="text-lg font-bold text-gray-900">Title</Text>
</View>
```

Design tokens are also available in `apps/expo/src/styles/` for programmatic access
(both approaches coexist):

```typescript
import { colors, commonStyles, spacing, typography } from "~/styles";
```

**Important**: Prefer Tailwind classes via `className`. Use design tokens for dynamic styles only.

## Web Development

### Next.js Styling

- Use **Tailwind CSS** for all styling
- Use **shadcn/ui** components from `src/_components/ui/`
- Follow shadcn/ui patterns for new components

### Internationalization

All user-facing strings must use `next-intl`:

```typescript
import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("MyComponent");
  return <h1>{t("title")}</h1>;
}
```

Translation files are in `apps/nextjs/src/languages/`.

## Authentication

The app uses [Better-Auth](https://better-auth.js.org/) for authentication with support for:

- **Email OTP / magic link** - Passwordless login via email (always on)
- **Google Sign In** - OAuth with Google (optional)
- **Apple Sign In** - OAuth with Apple (iOS/web, optional)

Social providers are **off unless configured** — there are no feature flags to
keep in sync. On the web/server a provider is registered, and its button shown,
only when its credentials are present at runtime
(`apps/nextjs/src/auth/providers.ts`):

| Provider | Web / server                              | Mobile (Expo build env)                       |
| -------- | ----------------------------------------- | --------------------------------------------- |
| Google   | `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`   | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`            |
| Apple    | `APPLE_CLIENT_ID` + `APPLE_CLIENT_SECRET` | `EXPO_PUBLIC_APPLE_AUTH_ENABLED="true"` (iOS) |

The mobile flags only show the native buttons; the app's ID token is verified
by the server, so the matching server variables must be set too (for Apple
also `APPLE_APP_BUNDLE_ID`). See `.env.example` for details.

### Security defaults

Configured in `packages/auth/src/index.ts`:

- **Session cookie cache: 5 minutes.** `getSession()` trusts a signed cache
  cookie for up to 5 minutes before re-reading the database, so a revoked
  session, deleted user or changed role (e.g. `isAdmin`) can take up to 5
  minutes to apply. Disable `session.cookieCache` if changes must apply on the
  next request, or bump its `version` to invalidate every cache at once.
- **Rate limiting** (Better Auth enables it in production) stores counters in
  Postgres — the `rate_limit` table in `packages/db/src/auth-schema.ts` — so
  limits are shared across instances and survive restarts. Include the table
  in the committed baseline migration (`packages/db/drizzle/`). Behind a
  proxy/load balancer, make sure the client IP header it sets is one Better
  Auth reads (`advanced.ipAddress.ipAddressHeaders`).
- **Trusted origins / CORS.** Better Auth trusts `NEXT_PUBLIC_BASE_URL` and the
  mobile app scheme. `/api/trpc` only returns CORS headers to
  `NEXT_PUBLIC_BASE_URL`. To allow another browser origin (a separate
  frontend, Expo web in dev, …) add it to the comma-separated
  `TRUSTED_ORIGINS` env var — it feeds both lists. Native apps send no Origin
  header and need no entry.

## Database

### Schema Management

- Schema files: `packages/db/src/schema.ts` and `packages/db/src/auth-schema.ts`
- Generate migrations: `pnpm db:generate` · apply: `pnpm db:migrate`
- View data: `pnpm db:studio`
- Throwaway prototyping only: `pnpm db:push` (no history; CI requires migrations)

**Migrations workflow** (the default — the repo ships a baseline migration,
`pnpm setup` applies it, and CI fails if the schema and migrations drift): after
changing the schema, run `pnpm db:generate` to emit a SQL migration into
`packages/db/drizzle/` and commit that folder alongside your schema change.
On deploy, run `pnpm db:migrate` (or invoke `packages/db/src/migrate.ts`
directly) before starting the server — it applies only the pending migrations
and records them in the database. `db:push` is for local iteration only: it
diffs and mutates the database in place with no history and can drop data.

### Drizzle ORM Usage

```typescript
import { eq } from "drizzle-orm";

import { usersTable } from "@example-app/db";
import { db } from "@example-app/db/client";

const user = await db.select().from(usersTable).where(eq(usersTable.id, id));
```

## API Development

### tRPC Patterns

Routers are in `packages/api/src/router/`. Use the appropriate procedure type:

```typescript
import { z } from "zod/v4";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const exampleRouter = createTRPCRouter({
  // Public - no auth required
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => ({ greeting: `Hello ${input.name}` })),

  // Protected - requires authentication
  getProfile: protectedProcedure.query(({ ctx }) => ({
    userId: ctx.session?.user?.id,
  })),
});
```

## Code Quality

### Standards

- **TypeScript**: Strict mode enabled - never use `any`
- **Linting**: [oxlint](https://oxc.rs) (Rust, type-aware via [tsrs](https://github.com/oxc-project/tsrs), a Rust port of the TypeScript checker) configured in `.oxlintrc.json`
- **Formatting**: Prettier with shared config in `tooling/prettier/`
- **Validation**: Use Zod v4 (`import { z } from "zod/v4"`)

### Workspace lint (sherif)

[sherif](https://github.com/QuiiBz/sherif) checks the workspace itself — one
version per dependency across packages, sorted dependency lists, and so on. It
is a pinned root devDependency, runs in CI (`pnpm lint:ws`), and deliberately
**not** in `postinstall` (an install-time gate would block every `pnpm` command,
because pnpm 11 re-verifies dependencies before running scripts). To exempt a
package that can't follow the shared catalog yet (e.g. an imported legacy app),
pass `-p <package-name>` in the `lint:ws` script, or list it under
`"sherif": { "ignorePackage": [...] }` in the root `package.json`.

### Secret scanning (gitleaks)

CI's `secret-scan` job runs a pinned, checksum-verified
[gitleaks](https://github.com/gitleaks/gitleaks) over the **full git history**
and fails on any finding. Run it locally before pushing with
`gitleaks git --redact .` (`brew install gitleaks`). For a confirmed false
positive, add its fingerprint to a `.gitleaksignore` file. If you import
history that contains already-rotated secrets, record them once with
`gitleaks git --report-path .gitleaks-baseline.json` and add
`--baseline-path .gitleaks-baseline.json` to the CI step — and rotate them
first: a baseline hides findings, it doesn't revoke anything.

### Tests & pre-commit

Tests run with **Vitest** (`pnpm test`) — colocate `*.test.ts` next to the source
(see `packages/shared/src/parse-error.test.ts`). Git hooks (lefthook) format
staged files on commit and run typecheck + lint on push. To check manually:

```bash
pnpm lint:fix      # Fix linting issues
pnpm format:fix    # Fix formatting
pnpm typecheck     # Verify types
pnpm test          # Run tests
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for full details. In short:

### Web (Next.js)

Builds to a self-contained server via `output: "standalone"`. Deploy with the
included `apps/nextjs/Dockerfile` (build from the repo root; it uses
`turbo prune --docker` so only the web app's dependency graph is installed and
the install layer stays cached, runs as a non-root user, and has a
`HEALTHCHECK` on `/api/health`) or any Node host (Vercel, Railway, Fly.io,
AWS, …):

```bash
docker build -f apps/nextjs/Dockerfile -t example-app-web .
docker run -p 3000:3000 --env-file .env example-app-web
```

Health probe: `GET /api/health`. Error tracking uses the Sentry SDKs pointed at
Bugsink (`NEXT_PUBLIC_SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN`; `pnpm setup` fills
them in locally) and stays inert when no DSN is set.
`renovate.json` keeps dependencies current.

### Mobile (Expo)

Use EAS Build for production builds:

```bash
pnpm --filter @example-app/expo exec eas build --platform ios
pnpm --filter @example-app/expo exec eas build --platform android
```

## Launch Checklist

See [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) for a comprehensive pre-launch checklist covering environment variables, OAuth, database, email, app store submissions, and monitoring.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow [AGENTS.md](AGENTS.md) — it applies to humans as well as agents
4. Run `pnpm check` (the pre-push hook does too) and use Conventional Commits
5. Submit a pull request — the template's checklist mirrors the CI gates

## License

[MIT](LICENSE) © 2026 Luke Ollett.
