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

How the image is built:

1. **Prune** — `turbo prune @example-app/nextjs --docker` (same turbo version as
   the lockfile) reduces the workspace to the web app and the packages it
   depends on: `out/json` (manifests + pruned lockfile) and `out/full` (sources).
2. **Install, then build** — `pnpm install --frozen-lockfile` runs on the
   manifests alone, so that layer stays cached until a dependency changes
   (source-only edits skip straight to the build); then
   `turbo run build --filter=@example-app/nextjs`. Packages the web app doesn't
   use (e.g. `apps/expo`) never enter the image.
3. **Run** — only the standalone server, static assets and `public/`, on a
   Node 24 LTS Alpine base pinned by version **and digest** (Renovate bumps
   both). Runs as the non-root `nextjs` user (uid 1001) on port 3000, with a
   `HEALTHCHECK` that probes `GET /api/health` using Node's built-in `fetch`
   (no curl/wget needed) — the container reports `unhealthy` while the
   database is unreachable.

Building on Apple Silicon for an amd64 host (most cloud runtimes)? Add
`--platform linux/amd64` to `docker build`.

The image runs `node apps/nextjs/server.js`.
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
   version (e.g. `postgres:18` to match `docker-compose.yml`) rather than
   `latest` — an unplanned major bump will refuse to start against the old
   data volume. Point `POSTGRES_URL` at the internal connection URL Coolify
   shows for the database.
3. **Environment variables** — enter the values from `.env.example` in the
   application's _Environment Variables_ tab (mark secrets like `AUTH_SECRET`
   as build-time hidden/runtime only). The image builds with
   `SKIP_ENV_VALIDATION=1`; env vars are validated when the container starts.
   **`NEXT_PUBLIC_*` variables are different**: Next.js inlines them into the
   browser bundle at build time, so mark `NEXT_PUBLIC_BASE_URL`,
   `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_SENTRY_DSN` as **Build
   Variables** (they become `--build-arg`s for `apps/nextjs/Dockerfile`).
   Set only at runtime, Google Analytics never loads and browser errors are
   never reported. (They're public values — that's fine.)
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
unreachable — wire it into your platform's health probe / uptime monitor. The
Docker image's `HEALTHCHECK` uses the same endpoint (interval 30 s, 30 s start
period, 3 retries). If your orchestrator restarts unhealthy containers and you
don't want a database outage to cause restart loops, point its liveness probe
at a path that doesn't touch the database and keep `/api/health` for readiness.

## Mobile (Expo)

Use EAS Build (`apps/expo/eas.json` — pins the same Node 24 and pnpm versions
as `.nvmrc` / `packageManager`; keep them in step). Set the EAS project id and
bundle ids in `apps/expo/app.config.ts`, then:

```bash
pnpm --filter @example-app/expo exec eas build --platform ios
pnpm --filter @example-app/expo exec eas build --platform android
```

## Error tracking (Bugsink)

Both apps report errors with the Sentry SDKs; the default backend is
[Bugsink](https://www.bugsink.com), a self-hosted, Sentry-compatible tracker
(the same one `docker-compose.yml` runs locally). Reporting is inert until a
DSN is set.

- **Run Bugsink**: deploy the `bugsink/bugsink` image (Coolify: a Docker
  image resource) with a persistent volume on `/data` (or `DATABASE_URL` for
  an external database), `SECRET_KEY` (50+ random chars), `BASE_URL` (its
  public URL), `BEHIND_HTTPS_PROXY=true`, and SMTP settings for alert emails.
  Create a team plus a web and a mobile project in its UI; each project page
  shows its DSN.
- **Web**: set `NEXT_PUBLIC_SENTRY_DSN` as a **build** variable (browser) —
  the server falls back to it; set `SENTRY_DSN` to override server-side.
- **Mobile**: set `EXPO_PUBLIC_SENTRY_DSN` in the EAS build environment.
- **Source maps** (optional, CI only): `SENTRY_URL` (your Bugsink),
  `SENTRY_AUTH_TOKEN` (a Bugsink API token), `SENTRY_ORG`, `SENTRY_PROJECT`.
- Prefer hosted Sentry? Point the DSNs at it instead — no code changes. To
  use tracing there, raise `tracesSampleRate` in `errorTrackingOptions`
  (`packages/shared/src/log.ts`) and set `excludeTracing: false` in
  `apps/nextjs/next.config.js`.

## Dependencies

`renovate.json` opens grouped dependency-update PRs. Enable Renovate on the repo
to keep the catalog current (it waits 3 days after a release and pins GitHub
Actions to digests). Expo SDK packages are grouped and should be bumped
together with `pnpm -F @example-app/expo exec expo install --fix` — CI's
`check:expo` fails on drift. Agent skills are not covered by Renovate: run
`pnpm skills:update` periodically.
