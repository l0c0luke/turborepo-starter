# syntax=docker/dockerfile:1
#
# Production image for the Next.js app (standalone output).
# Build from the MONOREPO ROOT so the whole pnpm workspace is in context:
#
#   docker build -f apps/nextjs/Dockerfile -t example-app-web .
#   docker run -p 3000:3000 --env-file .env example-app-web
#
# Stages: `turbo prune --docker` reduces the workspace to @example-app/nextjs
# and the packages it depends on, so the dependency-install layer is keyed
# only on their package.json files + the pruned lockfile and stays cached
# across source-only changes; the runner ships just the standalone server.
# See DEPLOY.md for details.

# Node 24 LTS, pinned by exact version AND digest (Renovate updates both).
# Keep in step with .nvmrc / engines / apps/expo/eas.json.
FROM node:24.22.3-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS base
ENV PNPM_HOME="/pnpm"
# pnpm 11 puts global bins in $PNPM_HOME/bin (and refuses `--global` commands
# when that isn't on PATH).
ENV PATH="$PNPM_HOME/bin:$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
# pnpm comes from corepack, pinned by `packageManager` in package.json.
RUN corepack enable
WORKDIR /app

# --- 1. Prune the workspace to the web app's dependency graph ----------------
FROM base AS pruner
COPY . .
# Run the same turbo version the lockfile pins, so prune output matches it.
RUN TURBO_VERSION="$(sed -n 's/^  turbo@\([0-9][^:(]*\):$/\1/p' pnpm-lock.yaml | head -n 1)" \
    && pnpm dlx "turbo@${TURBO_VERSION:?turbo not found in pnpm-lock.yaml}" \
       prune @example-app/nextjs --docker

# --- 2. Install deps (cached until a pruned manifest/lockfile changes), build -
FROM base AS builder
COPY --from=pruner /app/out/json/ .
# The frozen install below is authoritative. Turn off pnpm's "verify deps
# before run" check for the rest of the build: copying out/full refreshes the
# manifests' mtimes, so on a cached install layer every `pnpm run` (including
# the ones turbo spawns) would otherwise re-install without the store cache.
RUN pnpm config set --global verify-deps-before-run false
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# NEXT_PUBLIC_* values are inlined at BUILD time (browser bundle AND server code) —
# setting them only on the running container is too late (GA would never
# load and browser errors would never be reported). Pass them as build args:
#   docker build --build-arg NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXX ...
# (Coolify: mark these variables "Build Variable"). They are public by design.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
# Server-side env is validated at runtime, not build time.
ENV SKIP_ENV_VALIDATION=1
RUN pnpm turbo run build --filter=@example-app/nextjs

# --- 3. Run the standalone server as a non-root user ------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

# `output: "standalone"` + `outputFileTracingRoot` (next.config.js) emit a
# self-contained server under .next/standalone, preserving the monorepo layout.
COPY --from=builder --chown=nextjs:nodejs /app/apps/nextjs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/nextjs/.next/static ./apps/nextjs/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/nextjs/public ./apps/nextjs/public

USER nextjs
EXPOSE 3000

# Probes GET /api/health (200 when the app can reach Postgres, 503 when not).
# Uses Node's built-in fetch, so it needs no curl/wget in the image. Platforms
# with their own probes (Kubernetes, Cloud Run, Coolify) can point at the
# same path; Docker/Compose/Swarm use this directly.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch(`http://127.0.0.1:${process.env.PORT ?? 3000}/api/health`).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

CMD ["node", "apps/nextjs/server.js"]
