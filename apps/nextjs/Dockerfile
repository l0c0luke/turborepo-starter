# syntax=docker/dockerfile:1
#
# Production image for the Next.js app (standalone output).
# Build from the MONOREPO ROOT so the whole pnpm workspace is in context:
#
#   docker build -f apps/nextjs/Dockerfile -t example-app-web .
#   docker run -p 3000:3000 --env-file .env example-app-web
#
# See DEPLOY.md for details.

FROM node:24.22.0-alpine3.24@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# --- Build the app -----------------------------------------------------------
FROM base AS builder
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
# Env is validated at runtime, not build time.
ENV SKIP_ENV_VALIDATION=1
RUN pnpm turbo run build --filter=@example-app/nextjs

# --- Run the standalone server ----------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# `output: "standalone"` + `outputFileTracingRoot` (next.config.js) emit a
# self-contained server under .next/standalone, preserving the monorepo layout.
COPY --from=builder --chown=nextjs:nodejs /app/apps/nextjs/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/nextjs/.next/static ./apps/nextjs/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/nextjs/public ./apps/nextjs/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/nextjs/server.js"]
