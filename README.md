# Example App - Full Stack Starter Template

A production-ready monorepo template for building full-stack applications with a React Native mobile app (Expo) and a Next.js web application. Both apps share authentication, database, and type-safe APIs.

> **New Project?** Use the `@project-init` agent to transform this template into your app. It handles renaming, scaffolding, and configuration automatically.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Environment Configuration](#environment-configuration)
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

- **Mobile App**: React Native 0.84 with Expo SDK 55
- **Web App**: Next.js 16 with React 19
- **Shared Packages**: Database, API, Authentication, Validation, and more

### Key Technologies

| Category           | Technology                                        |
| ------------------ | ------------------------------------------------- |
| **Mobile**         | React Native 0.84, Expo SDK 55, React 19, Uniwind |
| **Web**            | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui   |
| **Authentication** | Better-Auth (OTP, Google, Apple Sign In)          |
| **Database**       | Drizzle ORM, PostgreSQL                           |
| **API**            | tRPC (end-to-end type safety)                     |
| **Validation**     | Zod v4                                            |
| **Monorepo**       | Turborepo, PNPM 10.26.0                           |
| **Runtime**        | Node.js >= 22.11.0                                |

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

- Node.js >= 22.11.0
- PNPM 10.26.0+ (`npm install -g pnpm`)
- Docker (for PostgreSQL and MailHog)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd example-app

# Install dependencies
pnpm install

# Start Docker services (PostgreSQL + MailHog)
docker-compose up -d

# Push database schema
pnpm db:push

# Start development servers
pnpm dev
```

### Quick Access

- **Web App**: http://localhost:3000
- **MailHog** (email testing): http://localhost:8025
- **Drizzle Studio**: `pnpm db:studio`

## Project Structure

```
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
│   ├── auth/                 # Better-Auth configuration
│   ├── db/                   # Drizzle ORM + PostgreSQL
│   ├── email/                # Email templates + sending
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

Create `.env` files in both apps:

**apps/nextjs/.env:**

```env
DATABASE_URL="postgresql://example:example@localhost:5832/example"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

**apps/expo/.env:**

```env
EXPO_PUBLIC_API_URL="http://localhost:3000"
```

### Available Scripts

```bash
# Development
pnpm dev              # Start all development servers
pnpm dev:next         # Start Next.js development server only

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues automatically
pnpm format           # Check Prettier formatting
pnpm format:fix       # Fix Prettier formatting
pnpm typecheck        # Run TypeScript type checking

# Mobile
pnpm ios              # Run iOS app
pnpm android          # Run Android app

# Building
pnpm build            # Build all packages and apps
```

## Package Architecture

All packages use the `@example-app/` scope and are located in `packages/`:

| Package                   | Description                   | Usage                                               |
| ------------------------- | ----------------------------- | --------------------------------------------------- |
| `@example-app/api`        | tRPC router and procedures    | `import { appRouter } from "@example-app/api"`      |
| `@example-app/auth`       | Better-Auth configuration     | `import { auth } from "@example-app/auth"`          |
| `@example-app/db`         | Drizzle ORM client and schema | `import { db } from "@example-app/db/client"`       |
| `@example-app/email`      | Email templates and sender    | `import { sendEmail } from "@example-app/email"`    |
| `@example-app/shared`     | Shared utilities              | `import { utils } from "@example-app/shared"`       |
| `@example-app/validators` | Zod validation schemas        | `import { schemas } from "@example-app/validators"` |

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

The Expo app uses **Uniwind** (Tailwind CSS for React Native). Use `className` on components:

```tsx
<View className="bg-background flex-1 p-4">
  <Text className="text-foreground text-lg font-bold">Title</Text>
</View>
```

Design tokens are also available in `apps/expo/src/styles/` for programmatic access:

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
- Push changes: `pnpm db:push`
- View data: `pnpm db:studio`

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

### Pre-commit Checklist

```bash
pnpm lint:fix      # Fix linting issues
pnpm format:fix    # Fix formatting
pnpm typecheck     # Verify types
```

## Deployment

### Web (Next.js)

Deploy to any platform that supports Node.js (Railway, Fly.io, AWS, etc.):

```bash
pnpm build
```

### Mobile (Expo)

Use EAS Build for production builds:

```bash
cd apps/expo
eas build --platform ios
eas build --platform android
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
