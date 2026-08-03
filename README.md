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

- **Mobile App**: Expo SDK 55 with SDK-aligned React Native and React 19
- **Web App**: Next.js 16 with React 19
- **Shared Packages**: Database, API, Authentication, Validation, and more

### Key Technologies

| Category           | Technology                                      |
| ------------------ | ----------------------------------------------- |
| **Mobile**         | Expo SDK 55, React Native, React 19, NativeWind |
| **Web**            | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **Authentication** | Better-Auth (OTP, Google, Apple Sign In)        |
| **Database**       | Drizzle ORM, PostgreSQL                         |
| **API**            | tRPC (end-to-end type safety)                   |
| **Validation**     | Zod v4                                          |
| **Monorepo**       | Turborepo, PNPM 11                              |
| **Runtime**        | Node.js >= 22.13.0                              |

## Features

### Mobile App (Expo)

- 🔐 **Authentication** - OTP, Google, and Apple Sign In
- 📱 **Cross-Platform** - iOS and Android support
- 🎨 **Design System** - Centralized styling with design tokens
- 🧭 **Custom Navigation** - Consistent custom navigation bar

### Web Dashboard (Next.js)

- 👤 **User Management** - User authentication and profiles
- 🔑 **Multi-Provider Auth** - OTP, Google, and Apple Sign In
- 🌐 **Internationalization** - Multi-language support with next-intl
- 🎨 **Modern UI** - Tailwind CSS with shadcn/ui components

## Quick Start

### Prerequisites

- Node.js >= 22.13.0
- PNPM 11 (`corepack enable`)
- Docker (for PostgreSQL and MailHog)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd example-app

# Install dependencies
pnpm install

# One-command bootstrap:
#   creates .env, starts Postgres + MailHog, pushes the schema, seeds a dev admin
pnpm setup

# Start development servers
pnpm dev
```

Then open <http://localhost:3000> and sign in as **admin@example.com** — the
magic-link / OTP email lands in MailHog at <http://localhost:8025>, and the
seeded admin can reach the users admin at `/admin`.

> Prefer to do it by hand? `cp .env.example .env`, `docker compose up -d`,
> `pnpm db:push`, then `pnpm -F @example-app/db seed`.

### Quick Access

- **Web App**: <http://localhost:3000>
- **MailHog** (email testing): <http://localhost:8025>
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
    ├── eslint/               # ESLint configuration
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

Optional provider flags and credentials are also documented in `.env.example` for Google Sign In, Apple Sign In, SMTP, and Google Analytics.

### Available Scripts

```bash
# Setup
pnpm setup            # .env + Docker + db push + seed (one-time bootstrap)

# Development
pnpm dev              # Start all development servers
pnpm dev:next         # Start Next.js development server only

# Database
pnpm db:push          # Push schema straight to the database (prototyping only)
pnpm db:generate      # Generate SQL migrations from schema changes
pnpm db:migrate       # Apply pending migrations (use this on deploy)
pnpm db:studio        # Open Drizzle Studio
pnpm -F @example-app/db seed   # Re-seed dev data

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues automatically
pnpm format:fix       # Fix Prettier formatting
pnpm typecheck        # Run TypeScript type checking
pnpm test             # Run Vitest

# Mobile
pnpm ios              # Run iOS app
pnpm android          # Run Android app

# Building
pnpm build            # Build all packages and apps
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

### iOS Setup

```bash
cd apps/expo
npx expo run:ios
```

### Android Setup

```bash
cd apps/expo
npx expo run:android
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
import { colors, commonStyles, spacing, typography } from "@/styles";
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

- **Email OTP** - Passwordless login via email
- **Google Sign In** - OAuth with Google
- **Apple Sign In** - OAuth with Apple (iOS/web)

## Database

### Schema Management

- Schema files: `packages/db/src/schema.ts` and `packages/db/src/auth-schema.ts`
- Prototype changes: `pnpm db:push` (syncs the schema directly, no history)
- Generate migrations: `pnpm db:generate`
- Apply migrations: `pnpm db:migrate`
- View data: `pnpm db:studio`

**Migrations workflow** (use this for anything beyond local prototyping): after
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
- **Linting**: ESLint with shared config in `tooling/eslint/`
- **Formatting**: Prettier with shared config in `tooling/prettier/`
- **Validation**: Use Zod v4 (`import { z } from "zod/v4"`)

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
included `apps/nextjs/Dockerfile` (build from the repo root) or any Node host
(Vercel, Railway, Fly.io, AWS, …):

```bash
docker build -f apps/nextjs/Dockerfile -t example-app-web .
docker run -p 3000:3000 --env-file .env example-app-web
```

Health probe: `GET /api/health`. Error tracking via Sentry is wired but inert
until you set a DSN (`NEXT_PUBLIC_SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN`).
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
3. Follow the code quality standards above
4. Run `pnpm lint:fix && pnpm format:fix && pnpm typecheck` before committing
5. Submit a pull request

## License

MIT License
