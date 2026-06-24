# Example App - Copilot Instructions

> **Canonical guidance lives in [`AGENTS.md`](../AGENTS.md)** (shared by all AI
> tools). This file mirrors the essentials for GitHub Copilot.

## Getting Started

This repo is a **bare-bones skeleton** — not a finished demo. Build by _adding_
features; there is nothing to delete. To bring up the dev environment in one step:
`pnpm install && pnpm setup`. To rename + scaffold for a new app idea, use the
**project-init agent** (`@project-init`), which renames the `@example-app/` scope,
scaffolds features, and configures auth providers.

## Overview

This is a Turborepo monorepo containing a full-stack application with a React Native mobile app (Expo) and a Next.js web application. Both apps share authentication, database, and API packages.

## Tech Stack

- **Mobile**: Expo SDK 55 with SDK-aligned React Native, React 19
- **Web**: Next.js 16 with React 19
- **Authentication**: Better-Auth with OTP, Google, and Apple Sign In
- **Database**: Drizzle ORM with PostgreSQL
- **API**: tRPC for type-safe APIs
- **Styling**: Tailwind CSS 4 (web), NativeWind 5 / Tailwind 4 (mobile)
- **Monorepo**: Turborepo with PNPM 11
- **Node**: >= 22.13.0

---

## Project Structure Guidelines

### Package Naming Convention

All packages use the `@example-app/` scope:

- `@example-app/analytics` - Google Analytics provider and env validation
- `@example-app/api` - tRPC router and procedures
- `@example-app/auth` - Better-Auth configuration
- `@example-app/db` - Drizzle ORM database client and schema
- `@example-app/email` - Email templates and sender
- `@example-app/seo` - SEO metadata helpers and JSON-LD
- `@example-app/shared` - Framework-agnostic utilities (parseError, log, captureException / Sentry bridge)
- `@example-app/validators` - Zod validation schemas (shared server + client)

### Import Patterns

```typescript
// Correct import patterns from packages
import { AnalyticsProvider } from "@example-app/analytics/provider";
import { api } from "@example-app/api";
import { auth } from "@example-app/auth";
import { db } from "@example-app/db/client";
import { createMetadata, JsonLd } from "@example-app/seo";
import { log, parseError } from "@example-app/shared";
```

---

## Expo App Guidelines

### Styling

- The Expo app uses **NativeWind 5** (Tailwind 4 for React Native) — use `className` on components (CSS-first: theme in `apps/expo/src/global.css`, wired via `metro.config.js`)
- Use the global design system from `src/styles/` for design tokens (colors, spacing, typography)
- Import styles from the centralized export: `import { colors, spacing, typography, commonStyles } from "@/styles"`
- Never use inline hardcoded colors or spacing values - use design tokens or Tailwind classes
- Global CSS is in `src/global.css` (imported in root layout)
- Available style modules: `colors`, `typography`, `spacing`, `layout`, `components`, `accessibleLayouts`

### Navigation

- **DO NOT** use the default Expo navigation bar
- All screens must implement their own custom `NavigationBar` component from `src/components/NavigationBar`
- Maintain consistent navigation patterns across all screens

### Component Organization

- Place reusable components in `src/components/`
- UI primitives go in `src/components/ui/`
- Export all components from `src/components/index.ts`

### Hooks

- Custom hooks go in `src/hooks/`
- Export all hooks from `src/hooks/index.ts`

### File Structure Pattern

```
src/
  app/           # Expo Router pages
  components/    # Reusable components
    ui/          # UI primitives
  constants/     # App constants
  contexts/      # React contexts
  hooks/         # Custom hooks
  services/      # API services
  styles/        # Design system
  types/         # TypeScript types
  utils/         # Utility functions
```

---

## Next.js App Guidelines

### Styling

- Use **Tailwind CSS** for all styling
- Use **shadcn/ui** components from `src/_components/ui/`
- Follow the shadcn/ui patterns for new components

### Component Organization

- Shared components go in `src/_components/`
- Page-specific components can be colocated with pages
- UI primitives from shadcn/ui are in `src/_components/ui/`

### Internationalization

- All user-facing strings must use `next-intl`
- Translation files are in `src/languages/`
- Use the `useTranslations` hook for translations

### File Structure Pattern

```
src/
  _components/   # Shared components
    ui/          # shadcn/ui components
  app/           # Next.js App Router pages
  auth/          # Auth utilities
  hooks/         # Custom hooks
  i18n/          # i18n configuration
  languages/     # Translation files
  lib/           # Utility libraries
  styles/        # Global styles
  trpc/          # tRPC client setup
  types/         # TypeScript types
```

---

## Database Guidelines

### Schema Changes

- Database schema is in `packages/db/src/schema.ts`
- Auth-related tables are in `packages/db/src/auth-schema.ts`
- After schema changes, run `pnpm db:push` to sync with database
- Use `pnpm db:studio` to inspect the database

### Drizzle ORM Patterns

```typescript
// Always import db client correctly
import { db } from "@example-app/db/client";

// Use proper Drizzle query patterns
const users = await db.select().from(usersTable).where(eq(usersTable.id, id));
```

---

## API Guidelines (tRPC)

### Router Structure

- Routers are in `packages/api/src/router/`
- Main router is in `packages/api/src/root.ts`
- Use `publicProcedure` for unauthenticated endpoints
- Use `protectedProcedure` for authenticated endpoints

### Adding New Procedures

```typescript
import { z } from "zod/v4";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const exampleRouter = createTRPCRouter({
  // Public endpoint
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { greeting: `Hello ${input.name}` };
    }),

  // Protected endpoint (requires auth)
  getSecretData: protectedProcedure.query(({ ctx }) => {
    return { userId: ctx.session?.user?.id };
  }),
});
```

---

## Validation Guidelines

### Zod Schemas

- Shared validation schemas go in `packages/validators/src/`
- Import Zod from `zod/v4` (not `zod`)
- Export validators from the package index

```typescript
import { z } from "zod/v4";

export const userSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
});
```

---

## Code Quality Standards

### TypeScript

- Strict TypeScript is enabled across all packages
- Never use `any` type - use proper typing or `unknown` with type guards
- All functions should have explicit return types for public APIs

### Linting & Formatting

- Run `pnpm lint` before committing
- Run `pnpm format:fix` to auto-format code
- Run `pnpm typecheck` to verify types

### Testing

- Write tests for critical business logic
- Test files should be colocated with source files or in `__tests__/` directories

---

## Common Commands

```bash
# One-time setup (.env + Docker + db push + seed)
pnpm setup

# Development
pnpm dev              # Start all development servers
pnpm dev:next         # Start Next.js only

# Database
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format:fix       # Fix formatting
pnpm typecheck        # TypeScript check
pnpm test             # Run Vitest

# Mobile
pnpm ios              # Run iOS app
pnpm android          # Run Android app

# Building
pnpm build            # Build all packages
```

---

## Important Conventions

1. **Never hardcode values** - Use design tokens, environment variables, and constants
2. **Keep packages independent** - Avoid circular dependencies between packages
3. **Type everything** - Use TypeScript's full potential for type safety
4. **Use tRPC for API calls** - Don't create custom fetch wrappers
5. **Follow existing patterns** - Look at similar code in the codebase before implementing new features
6. **Export from index files** - Always export new modules from their package's index.ts
7. **Use path aliases** - Use `@/` for local imports within apps, `@example-app/` for packages
