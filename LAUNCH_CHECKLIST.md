# Launch Checklist

Use this checklist before deploying to production. Each section covers a critical area that needs configuration or verification.

## Environment & Secrets

- [ ] Generate a strong `AUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Set `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Set `EXPO_PUBLIC_BASE_URL` to production API domain
- [ ] Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` as a **build** variable (every project ships with GA4 — the server logs a warning at startup if it's missing)
- [ ] Configure production `POSTGRES_URL` (use connection pooling)
- [ ] Configure production SMTP settings (`EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`)
- [ ] Set `EMAIL_FROM` to a verified sender address
- [ ] Deploy Bugsink (see `DEPLOY.md`) and set its DSNs: `NEXT_PUBLIC_SENTRY_DSN` (build variable) and `EXPO_PUBLIC_SENTRY_DSN` (EAS env); trigger a test error and see it arrive
- [ ] Ensure no development secrets are in production env

## Authentication

- [ ] Decide which social providers to offer — each is on only when its credentials are set (leave them unset to disable)
- [ ] Google (if used): `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` with production redirect URIs; `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` for mobile builds
- [ ] Apple (if used): Services ID (`APPLE_CLIENT_ID`), a current `APPLE_CLIENT_SECRET` (expires ≤ 6 months — calendar the rotation), `APPLE_APP_BUNDLE_ID`, redirect URIs; `EXPO_PUBLIC_APPLE_AUTH_ENABLED="true"` for iOS builds
- [ ] Verify OTP email delivery works end-to-end
- [ ] Test all auth flows on production domain

## Database

- [ ] Run `pnpm db:migrate` against production database
- [ ] Verify schema matches expected state
- [ ] Set up database backups and point-in-time recovery
- [ ] Configure connection pooling (PgBouncer or provider-managed)
- [ ] Run `pnpm -F @example-app/db seed` if seed data is needed (do NOT seed production with the dev admin)

## Infrastructure (cloud provider only)

- [ ] Every cloud resource is in Terraform under `infra/` — nothing created by hand in a console (compare the account against `terraform state list`)
- [ ] Remote state bucket is versioned, encrypted and private; state locking is on
- [ ] CI deploys through OIDC with a least-privilege role; no long-lived cloud keys exist in GitHub secrets or anywhere else
- [ ] Production applies go through CI behind a GitHub Environment with required reviewers
- [ ] `pnpm check:infra` passes (no HIGH/CRITICAL trivy findings) and the weekly drift plan is clean
- [ ] Backups / point-in-time recovery for managed databases and buckets are defined in Terraform

## Mobile (Expo / EAS)

- [ ] Update `app.config.ts` with production bundle identifier
- [ ] Configure EAS project ID in `eas.json`
- [ ] Set up EAS Build profiles (development, preview, production)
- [ ] Configure push notification credentials (APNs, FCM)
- [ ] Submit iOS build to App Store Connect
- [ ] Submit Android build to Google Play Console
- [ ] Verify deep linking and universal links

## Web (Next.js)

- [ ] Configure production domain and DNS
- [ ] Set up SSL/TLS certificate
- [ ] Verify `next.config.js` security headers
- [ ] Test all pages render correctly in production build (`pnpm build`)
- [ ] Build/run the Docker image (`apps/nextjs/Dockerfile`) or configure your host — see `DEPLOY.md`
- [ ] Wire the `GET /api/health` endpoint into your platform's health probe
- [ ] Verify i18n translations are complete

## Email

- [ ] Verify production SMTP provider is configured (SendGrid, AWS SES, Postmark, etc.)
- [ ] Test OTP and magic link email delivery
- [ ] Check email templates render correctly across clients
- [ ] Set up SPF, DKIM, and DMARC records for sender domain

## Monitoring & Observability

- [ ] Bugsink receives errors from web (browser + server) and mobile; alert emails reach the team; optional source maps via `SENTRY_URL` / `SENTRY_AUTH_TOKEN` in CI (see `DEPLOY.md`)
- [ ] Google Analytics shows real-time traffic and the key `trackEvent` events
- [ ] Configure uptime monitoring (point it at `/api/health`)
- [ ] Set up log aggregation
- [ ] Configure alerts for error rate spikes
- [ ] Set up database monitoring and slow query alerts

## Security

- [ ] **Full security audit** with the `security-audit` agent skill ("security audit this codebase"); fix every confirmed finding and resolve the needs-validation ones
- [ ] `pnpm check:audit` passes (no high/critical advisories)
- [ ] Set `TRUSTED_ORIGINS` only to origins that really need cross-origin API/auth access (empty = same-origin only; it is the `/api/trpc` CORS allow-list)
- [ ] Review rate limiting on auth endpoints (counters live in the Postgres `rate_limit` table, created by the baseline migration) and that the client-IP header your proxy sets is one Better Auth reads
- [ ] Confirm the 5-minute session cookie cache is acceptable (role changes / revocations take up to 5 min) — see README "Security defaults"
- [ ] Ensure no secrets are committed to the repository (CI `secret-scan` job runs gitleaks over the full history; locally: `gitleaks git --redact .`)
- [ ] Verify `.env` is in `.gitignore`

## Final Verification

- [ ] `pnpm check` passes and CI (`ci-ok`) is green on the release commit
- [ ] Bundle budgets hold (`pnpm check:bundle`); run the `next-bundle-optimizer` skill once on the key routes
- [ ] `ci-ok` is a required status check on `main`
- [ ] Manual smoke test: sign up, sign in, core features
- [ ] Test on real iOS and Android devices
