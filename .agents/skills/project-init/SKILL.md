---
name: project-init
description: "Initialize this starter template for a new app idea. Use when: bootstrapping a new project, renaming example-app, replacing placeholders, scaffolding features for a new app idea, setting up a new mobile+web app from this template."
---

# Project initialization

Turn this skeleton into a specific app: rename the placeholders, configure the
always-on services (Google Analytics, Bugsink error tracking), and scaffold the
first features as complete, tested vertical slices. Read `AGENTS.md` first —
every rule there applies, and **done = `pnpm check` passes**.

The skeleton has no demo content to delete. The users-admin feature is the
reference pattern (protected route + tRPC + Drizzle + tests + skeletons +
optimistic mutations): keep it unless the app truly has no admin concept.

## Phase 1 — Interview

Ask for (use an ask-the-user tool if available; otherwise ask in chat):

| Detail | Example | Required |
| --- | --- | --- |
| App name (display) | "My Cool App" | Yes |
| App slug (kebab-case) | `my-cool-app` | Yes |
| Package scope | `@coolco` | Yes |
| Bundle identifier | `com.coolco.mycoolapp` | Yes |
| One-line description | "A social fitness tracker" | Yes |
| **GA4 measurement ID** | `G-ABC123XYZ` | Yes — every project ships with GA (if they don't have one yet, leave a clearly marked TODO and put it first on the post-init checklist) |
| Production domain | `mycoolapp.com` | No |
| Auth providers | Google, Apple, both, email-only | Yes |
| Core features | detailed list | Yes |
| Key entities | "workouts, exercises, goals" | No |

## Phase 2 — Rename placeholders (verify, don't trust a file list)

| Placeholder | Replace with |
| --- | --- |
| `@example-app/` | `@{scope}/` |
| `example-app` | `{app-slug}` (package name, Expo slug/scheme, container/compose names, Bugsink projects, auth `trustedOrigins`, SecureStore prefix) |
| `Example App` | `{App Name}` |
| `com.example.app` | `{bundle.id}` |

1. Find every occurrence and replace it:

   ```bash
   git grep -lE "example-app|Example App|com\.example\.app" -- . \
     ':!pnpm-lock.yaml' ':!.agents/skills/*' ':!skills-lock.json'
   ```

   This covers package manifests and imports, `next.config.js`
   `transpilePackages`, the Dockerfile (`turbo prune` / `--filter`),
   `turbo/generators/`, `docker-compose.yml` (compose project + container
   names), `scripts/setup.ts` and `scripts/bugsink-provision.py` (Bugsink team
   and project slugs — keep the two in sync), `apps/expo/app.config.ts`,
   `apps/expo/src/utils/auth.ts` (scheme + storage prefix),
   `packages/auth/src/index.ts` (`trustedOrigins`), env defaults, and every doc
   (`README.md`, `AGENTS.md`, `DEPLOY.md`, `LAUNCH_CHECKLIST.md`,
   `.github/copilot-instructions.md`, the skills under `.agents/skills/` that
   we own: `project-init`, `add-feature`, `testing`).
2. Leave `example.com` email addresses alone unless the user gives a domain
   (they're dev/seed data), and never edit third-party skills.
3. Change the dev Postgres credentials in `docker-compose.yml`, the CI
   Postgres service (`.github/workflows/ci.yml`) and `POSTGRES_URL` in
   `.env.example` together (user/db = slug; any dev password).
4. **Verify**: re-run the `git grep` — it must print nothing. Then
   `pnpm install` (regenerates the lockfile for the new scope).

## Phase 3 — Always-on services

- **Google Analytics**: put the measurement ID in `.env.example` as
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` (IDs are public; committing it is fine) and
  remind the user to set it as a **build** variable in production
  (`DEPLOY.md`). Add `trackEvent(...)` calls for the app's key actions as you
  build features (sign-up, the core "created/completed" events).
- **Error tracking (Bugsink)**: nothing to code — `pnpm setup` provisions the
  local Bugsink and writes the DSNs. For production, add "deploy Bugsink (or
  use an existing one) and set the DSNs" to the post-init checklist.
- **Auth providers**: Google/Apple are already optional and env-driven. To
  remove one entirely: its env vars (`apps/nextjs/src/env.ts`,
  `packages/auth/env.ts`, `.env.example`, `turbo.json` `globalEnv`), its entry
  in `apps/nextjs/src/auth/providers.ts` and `socialProviders` in
  `packages/auth/src/index.ts`, its buttons (`LoginForm.tsx`,
  `apps/expo/src/app/index.tsx`), and on mobile its dependency + config plugin
  (`app.config.ts`) + util (`utils/auth.ts` / `utils/appleAuth.ts`). Let knip
  (`pnpm check:deps`) confirm nothing is left behind.

## Phase 4 — Scaffold the first features

For each core feature, follow the **add-feature** skill end to end: schema +
migration, validators, router **with tests**, web route with `loading.tsx` +
Suspense skeleton and optimistic mutations, mobile screen with skeletons,
i18n in every locale, `trackEvent` calls, navigation entries. Build one slice
completely (green `pnpm check`) before starting the next.

## Phase 5 — Docs

Update `README.md` (name, description, features) and `AGENTS.md` (layout and
reference patterns for the new features). Keep `CLAUDE.md` and
`.github/copilot-instructions.md` as pointers to `AGENTS.md`.

## Phase 6 — Verify

```bash
pnpm install
pnpm setup        # services, migrations, seed, Bugsink — idempotent
pnpm check        # every local gate
pnpm build && pnpm check:bundle
```

Then run the **security-audit** skill in guidance mode over the new routers
and auth configuration, and fix what it finds.

## Phase 7 — Hand-off checklist

Give the user a summary of files changed/created and these manual steps:

- [ ] GA4 property + measurement ID (if it was left as a TODO); set it as a production build variable
- [ ] Production Bugsink (self-host the `bugsink/bugsink` image, or reuse one) → set `NEXT_PUBLIC_SENTRY_DSN` / `EXPO_PUBLIC_SENTRY_DSN`
- [ ] EAS project (`eas init`) → `extra.eas.projectId` in `apps/expo/app.config.ts`
- [ ] Google / Apple sign-in credentials (if kept)
- [ ] Production Postgres, `AUTH_SECRET` (`openssl rand -base64 32`), SMTP provider
- [ ] Make `ci-ok` a required status check (GitHub ruleset or merge queue)
- [ ] Work through `LAUNCH_CHECKLIST.md` (incl. a full security-audit run before launch)

Then: `pnpm dev`, open http://localhost:3000 and sign in as
`admin@example.com` (the code arrives in Mailpit at http://localhost:8025).
