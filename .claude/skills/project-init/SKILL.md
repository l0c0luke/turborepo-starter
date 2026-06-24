---
name: project-init
description: "Initialize this starter template for a new app idea. Use when: bootstrapping a new project, renaming example-app, replacing placeholders, scaffolding features for a new app idea, setting up a new mobile+web app from this template."
---

# Project Initialization

Transform this turborepo starter into a production-ready app. Handles mechanical renaming of all placeholders AND intelligent scaffolding of initial features based on the app idea.

> This template is a **bare-bones skeleton** — there are no demo pages to delete.
> Initialization is about _renaming_ placeholders and _adding_ features. The one
> reference feature (the users admin) shows the protected-route + tRPC + Drizzle
> pattern; copy it, don't remove it (unless the app has no admin concept).

## When to Use

- First time setting up a new project from this template
- User says "initialize", "bootstrap", "set up new project", "rename example-app"
- User provides an app idea and wants to get started

## Procedure

### Phase 1: Gather Project Details

Ask the user for these details (use the ask-questions tool if available, otherwise ask in chat):

| Detail                           | Example                             | Required |
| -------------------------------- | ----------------------------------- | -------- |
| App name (display)               | "My Cool App"                       | Yes      |
| App slug (kebab-case)            | "my-cool-app"                       | Yes      |
| Package scope                    | "@coolco"                           | Yes      |
| Bundle identifier                | "com.coolco.mycoolapp"              | Yes      |
| App description                  | "A social fitness tracking app"     | Yes      |
| Target domain                    | "mycoolapp.com"                     | No       |
| Auth providers needed            | Google, Apple, both, email-only     | Yes      |
| Core features / idea description | Detailed feature list               | Yes      |
| Key database entities            | "users, workouts, exercises, goals" | No       |

### Phase 2: Mechanical Replacements

Perform find-and-replace across the entire codebase. **Every file listed below must be updated.**

#### 2.1 Package Scope: `@example-app/` → `@{scope}/`

**Files to update (ALL of these):**

- `pnpm-workspace.yaml` — no scope references, skip
- `package.json` (root) — `name` field, all script references like `-F @example-app/...`
- `apps/expo/package.json` — `name` field, all `@example-app/*` dependencies
- `apps/nextjs/package.json` — `name` field, all `@example-app/*` dependencies
- `packages/api/package.json` — `name` field, all `@example-app/*` dependencies
- `packages/auth/package.json` — `name` field, all `@example-app/*` dependencies
- `packages/db/package.json` — `name` field, all `@example-app/*` dependencies
- `packages/email/package.json` — `name` field, all `@example-app/*` dependencies
- `packages/shared/package.json` — `name` field, all `@example-app/*` dependencies
- `packages/validators/package.json` — `name` field, all `@example-app/*` dependencies
- `tooling/eslint/package.json` — `name` field, all `@example-app/*` dependencies
- `tooling/prettier/package.json` — `name` field, all `@example-app/*` dependencies
- `tooling/typescript/package.json` — `name` field (if present)
- `turbo/generators/config.ts` — scope reference in prompts and logic
- `turbo/generators/templates/package.json.hbs` — `@example-app/` in name and deps
- `apps/nextjs/next.config.js` — `transpilePackages` array references
- `.github/copilot-instructions.md` — all `@example-app/` references
- `README.md` — all `@example-app/` references
- `AGENTS.md` — all `@example-app/` references
- `CLAUDE.md` — references (mostly delegates to `AGENTS.md`)

**Also search all TypeScript/TSX files for import statements:**

```bash
grep -r "@example-app/" apps/ packages/ --include="*.ts" --include="*.tsx" -l
```

Update every import found.

#### 2.2 App Name: `Example App` → `{App Name}`

- `apps/expo/app.config.ts` — `name` field
- `apps/nextjs/src/env.ts` — `EMAIL_FROM` default string
- `.env.example` — `EMAIL_FROM` value
- `README.md` — title and references
- `.github/copilot-instructions.md` — title and references

#### 2.3 App Slug: `example-app` → `{app-slug}`

- `apps/expo/app.config.ts` — `slug` and `scheme` fields
- `docker-compose.yml` — container names (`example-app-postgres`, `example-app-mailhog`), network name
- `package.json` (root) — `name` field
- `.env.example` — database URL username/password/dbname

#### 2.4 Bundle Identifier: `com.example.app` → `{bundle.id}`

- `apps/expo/app.config.ts` — `ios.bundleIdentifier` and `android.package`
- `.env.example` — `APPLE_CLIENT_ID` and `APPLE_APP_BUNDLE_ID`

#### 2.5 Docker Credentials

Update `docker-compose.yml`:

- `POSTGRES_USER`: change from `example` to app-slug
- `POSTGRES_PASSWORD`: change from `example` to a random dev password
- `POSTGRES_DB`: change from `example` to app-slug

Update `.env.example` `POSTGRES_URL` to match.

#### 2.6 EAS Project ID

- `apps/expo/app.config.ts` — replace `your-project-id-here` (user needs to provide or leave as TODO)

#### 2.7 Email

- `.env.example` — update `EMAIL_FROM` with new app name/domain
- `apps/nextjs/src/env.ts` — update `EMAIL_FROM` default

### Phase 3: Feature Scaffolding

Based on the app idea, create the initial codebase structure:

#### 3.1 Database Schema

Edit `packages/db/src/schema.ts`:

- Keep the existing user/session/account/verification tables (from auth-schema.ts)
- Add new domain-specific tables using Drizzle ORM patterns:

```typescript
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { id, timestamps } from "./auth-schema"; // reuse helpers if available

export const exampleTable = pgTable("example_table", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // ... domain fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

#### 3.2 Validators

Add Zod schemas in `packages/validators/src/`:

- Create a file per domain entity (e.g., `workout.ts`, `goal.ts`)
- Export from `packages/validators/src/index.ts`
- Import zod from `zod/v4` (NOT `zod`)

```typescript
import { z } from "zod/v4";

export const createWorkoutSchema = z.object({
  name: z.string().min(1),
  duration: z.number().positive(),
});
```

#### 3.3 tRPC Routers

Create routers in `packages/api/src/router/`:

- One file per domain entity
- Use `protectedProcedure` for authenticated endpoints
- Use `publicProcedure` only for truly public data
- Register in `packages/api/src/root.ts`

```typescript
import { createWorkoutSchema } from "@{scope}/validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const workoutRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(workouts)
      .where(eq(workouts.userId, ctx.session.user.id));
  }),
  create: protectedProcedure
    .input(createWorkoutSchema)
    .mutation(async ({ ctx, input }) => {
      // implementation
    }),
});
```

#### 3.4 Next.js Pages

Create pages under `apps/nextjs/src/app/`:

- Each core feature gets a directory with `page.tsx` (and `loading.tsx` if it streams)
- Use server components by default, client components only when needed
- Protect routes in `apps/nextjs/src/proxy.ts` by adding to the matcher
- Model new pages on `src/app/admin/page.tsx` (server `prefetch` → client
  `useSuspenseQuery` in `_components/admin/AdminContent.tsx`)
- Add translations for new pages in every locale file under `apps/nextjs/src/languages/`
  (`en.json`, `es.json`); add a locale to `src/lib/locale.ts` to support more

#### 3.5 Expo Screens

Create screens under `apps/expo/src/app/`:

- Follow the existing authed-screen pattern in `home.tsx`, and register each new
  screen in `apps/expo/src/app/_layout.tsx`
- Use the design system from `@/styles` — never hardcode colors/spacing
- Use the custom `NavigationBar` component, NOT the default Expo nav bar
- Use tRPC hooks for data fetching

#### 3.6 Navigation Updates

- **Next.js**: Update `apps/nextjs/src/_components/navbar.tsx` with new nav items
- **Expo**: Update navigation in `apps/expo/src/app/_layout.tsx`

### Phase 4: Configuration Updates

#### 4.1 Auth Providers

Based on user's choice, update:

- `apps/nextjs/src/env.ts` — remove unused provider env vars
- `.env.example` — remove unused provider config blocks
- `packages/auth/src/index.ts` — disable unused social providers
- Feature flags: `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`, `NEXT_PUBLIC_APPLE_AUTH_ENABLED`

#### 4.2 Update Documentation

- `README.md` — project name, description, features, setup specifics
- `AGENTS.md` — canonical agent guidance (update structure/feature references)
- `.github/copilot-instructions.md` and `CLAUDE.md` point to `AGENTS.md`

### Phase 5: Verification

Run these commands and fix any errors:

```bash
# 1. Install dependencies (regenerates lockfile)
pnpm install

# 2. Type check, lint, test, format
pnpm typecheck
pnpm lint
pnpm test
pnpm format:fix

# 3. Bring up the dev environment in one step
#    (.env + Docker services + db push + seed)
pnpm setup

# 4. Start dev (sign in as admin@example.com; magic link at http://localhost:8025)
pnpm dev
```

### Phase 6: Post-Init Checklist

Remind the user to:

- [ ] Set up EAS project and update `projectId` in `app.config.ts`
- [ ] Configure Google OAuth credentials (if using Google auth)
- [ ] Configure Apple Sign In credentials (if using Apple auth)
- [ ] Set `AUTH_SECRET` to a real secret (`openssl rand -base64 32`)
- [ ] Set up production database and update `POSTGRES_URL`
- [ ] Set up production email (SMTP/SES) credentials
- [ ] Review `LAUNCH_CHECKLIST.md` for full launch preparation

## Key Patterns to Follow

| Pattern             | Rule                                                                |
| ------------------- | ------------------------------------------------------------------- |
| Imports             | Use `@{scope}/` for packages, `@/` for local                        |
| Zod                 | Always `import { z } from "zod/v4"`                                 |
| Styling (web)       | Tailwind CSS + shadcn/ui components                                 |
| Styling (mobile)    | Design tokens from `@/styles`, never inline colors                  |
| Navigation (mobile) | Custom `NavigationBar`, NOT default Expo nav                        |
| API calls           | tRPC only — no custom fetch wrappers                                |
| DB queries          | Drizzle ORM — use the `db` client from `@{scope}/db/client`         |
| Auth endpoints      | `protectedProcedure` for authenticated, `publicProcedure` otherwise |
| Translations        | All user-facing strings via `next-intl` (web)                       |
