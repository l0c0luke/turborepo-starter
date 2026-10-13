# Launch Checklist

Use this checklist before deploying to production. Each section covers a critical area that needs configuration or verification.

## Environment & Secrets

- [ ] Generate a strong `AUTH_SECRET` (`openssl rand -base64 32`)
- [ ] Set `NEXT_PUBLIC_BASE_URL` to production domain
- [ ] Set `EXPO_PUBLIC_BASE_URL` to production API domain
- [ ] Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` if Google Analytics is enabled
- [ ] Configure production `POSTGRES_URL` (use connection pooling)
- [ ] Configure production SMTP settings (`EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`)
- [ ] Set `EMAIL_FROM` to a verified sender address
- [ ] Set Sentry DSNs to enable error tracking (`NEXT_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_SENTRY_DSN`)
- [ ] Ensure no development secrets are in production env

## Authentication

- [ ] Configure Google OAuth credentials for production redirect URIs
- [ ] Configure Apple Sign In with correct Service ID and redirect URIs
- [ ] Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` and `NEXT_PUBLIC_APPLE_AUTH_ENABLED` as needed
- [ ] Verify OTP email delivery works end-to-end
- [ ] Test all auth flows on production domain

## Database

- [ ] Run `pnpm db:migrate` against production database
- [ ] Verify schema matches expected state
- [ ] Set up database backups and point-in-time recovery
- [ ] Configure connection pooling (PgBouncer or provider-managed)
- [ ] Run `pnpm -F @example-app/db seed` if seed data is needed (do NOT seed production with the dev admin)

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

- [ ] Set Sentry DSNs (error tracking is pre-wired — see `DEPLOY.md`); add `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` in CI for source-map upload
- [ ] Configure uptime monitoring (point it at `/api/health`)
- [ ] Set up log aggregation
- [ ] Configure alerts for error rate spikes
- [ ] Set up database monitoring and slow query alerts

## Security

- [ ] Run `pnpm audit` and resolve critical vulnerabilities
- [ ] Verify CORS configuration for production domains
- [ ] Review rate limiting on auth endpoints
- [ ] Ensure no secrets are committed to the repository
- [ ] Verify `.env` is in `.gitignore`

## Final Verification

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` completes without errors
- [ ] Manual smoke test: sign up, sign in, core features
- [ ] Test on real iOS and Android devices
