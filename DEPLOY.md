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
