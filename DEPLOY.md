# Deploying

This skeleton ships a production-ready Next.js web build and a standard Expo
mobile pipeline. Before deploying, work through `LAUNCH_CHECKLIST.md`.

## Web (Next.js)

The app builds to a self-contained server via Next.js
[`output: "standalone"`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
(configured in `apps/nextjs/next.config.js`).

### Option A — Docker

A multi-stage `apps/nextjs/Dockerfile` is included. Build from the **monorepo root**
(the whole pnpm workspace must be in the build context):

```bash
docker build -f apps/nextjs/Dockerfile -t example-app-web .
docker run -p 3000:3000 --env-file .env example-app-web
```

The image runs `node apps/nextjs/server.js` as a non-root user on port 3000.
Provide real environment variables at runtime (see `.env.example`). Note: Docker's
`--env-file` expects plain `KEY=VALUE` lines (no inline `#` comments) — the bundled
`.env.example` is already compatible, or pass `-e` flags / your platform's secrets UI.

### Option B — Vercel / Netlify / Render

Point the platform at this repo and set the project root to `apps/nextjs`.
Add the environment variables from `.env.example`. These platforms detect Next.js
and the `standalone` output automatically.

### Option C — Coolify (self-hosted PaaS)

Coolify can build and run the included Dockerfile directly from your Git repo.

1. **App resource** — create an Application from your Git repository. Set the
   build pack to **Dockerfile**, the Dockerfile location to
   `apps/nextjs/Dockerfile`, and keep the **build context at the repository
   root** (the whole pnpm workspace must be in the build context). Exposed
   port: `3000`.
2. **Database** — add a Coolify-managed PostgreSQL resource. Pin a major
   version (e.g. `postgres:17` to match `docker-compose.yml`) rather than
   `latest` — an unplanned major bump will refuse to start against the old
   data volume. Point `POSTGRES_URL` at the internal connection URL Coolify
   shows for the database.
3. **Environment variables** — enter the values from `.env.example` in the
   application's *Environment Variables* tab (mark secrets like `AUTH_SECRET`
   as build-time hidden/runtime only). The image builds with
   `SKIP_ENV_VALIDATION=1`; env vars are validated when the container starts.
4. **Migrations on start** — run pending migrations before the server boots.
   Replace the container start command with a small wrapper (or bake a
   `start.sh` into the image):

   ```sh
   #!/bin/sh
   set -e
   pnpm --filter @example-app/db migrate   # runs packages/db/src/migrate.ts
   exec node apps/nextjs/server.js
   ```

   Note the runtime image only contains the standalone server output — if you
   use this pattern, copy `packages/db` (and its `drizzle/` folder) into the
   runner stage, or run migrations as a separate deploy step/one-off command
   (`MIGRATIONS_DIR` lets `migrate.ts` find the folder wherever you copy it).
5. **Health check** — set the health check path to `/api/health`. It returns
   `503` when the database is unreachable, so Coolify will hold traffic until
   the app can actually serve it.
6. **Persistent storage** — the app itself is stateless (sessions live in
   Postgres). If you add user uploads, write them to a directory backed by a
   Coolify **persistent volume** (or better, object storage) — anything else
   on the container filesystem is lost on every redeploy.

### Health check

`GET /api/health` returns `{ status, db }` and a `503` when the database is
unreachable — wire it into your platform's health probe / uptime monitor.

## Mobile (Expo)

Use EAS Build (`apps/expo/eas.json`). Set the EAS project id and bundle ids in
`apps/expo/app.config.ts`, then:

```bash
pnpm --filter @example-app/expo exec eas build --platform ios
pnpm --filter @example-app/expo exec eas build --platform android
```

## Error tracking (Sentry)

Sentry is wired but inert until you set a DSN. For production:

- Web: set `NEXT_PUBLIC_SENTRY_DSN` (and `SENTRY_DSN`).
- Mobile: set `EXPO_PUBLIC_SENTRY_DSN`.
- Source-map upload at build time: set `SENTRY_ORG`, `SENTRY_PROJECT`, and
  `SENTRY_AUTH_TOKEN` (CI only).

## Dependencies

`renovate.json` opens grouped dependency-update PRs. Enable Renovate on the repo
to keep the catalog current. Expo SDK packages are grouped and should be bumped
together with `expo install --fix`.
