import type { BetterAuthOptions } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, magicLink } from "better-auth/plugins";

import * as schema from "@example-app/db";
import { db } from "@example-app/db/client";
import { EmailSender, MagicLinkService, OTPService } from "@example-app/email";
import { log } from "@example-app/shared";

import { authEnv } from "../env";

const isProduction = () => authEnv().NODE_ENV === "production";

export function initAuth(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  /**
   * Extra origins trusted for auth callbacks/redirects and the CSRF origin
   * check, in addition to `baseUrl` (always trusted) and the mobile app
   * scheme. Comes from the `TRUSTED_ORIGINS` env var. Supports Better Auth
   * wildcard patterns (e.g. "https://*.example.com").
   */
  trustedOrigins?: string[];

  /**
   * Social providers are optional: each is registered only when its config
   * is passed (apps/nextjs/src/auth/providers.ts passes it only when the
   * provider's credentials are set). Email OTP / magic link are always on.
   */
  google?: {
    clientId: string;
    clientSecret: string;
  };
  apple?: {
    clientId: string;
    clientSecret: string;
    /** iOS bundle id — required to verify ID tokens from the native app */
    appBundleId?: string;
  };

  // Email configuration for magic links
  emailFrom: string;
  emailApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}) {
  // Initialize email service if SMTP is configured
  let magicLinkService: MagicLinkService | null = null;
  let otpService: OTPService | null = null;

  if (options.smtpHost && options.smtpPort && options.emailFrom) {
    const emailSender = new EmailSender({
      smtpHost: options.smtpHost,
      smtpPort: Number(options.smtpPort),
      smtpUser: options.smtpUser,
      smtpPassword: options.smtpPassword,
      emailFrom: options.emailFrom,
    });

    magicLinkService = new MagicLinkService(emailSender);
    otpService = new OTPService(emailSender);
  }

  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    user: {
      additionalFields: {
        // `isAdmin` is the reference example of a custom user field. It powers
        // the admin route + adminProcedure. Add your own fields alongside it.
        isAdmin: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: false, // Users cannot set this themselves
        },
      },
    },
    session: {
      // The cookie cache lets getSession() skip the database while the signed
      // cache cookie is fresh. Keep it short: while it is valid, a revoked
      // session, a deleted user or a changed role (e.g. `isAdmin`, which
      // `adminProcedure` trusts) is NOT re-read from the database. 5 minutes
      // bounds that window; set `enabled: false` if changes must apply on the
      // very next request, or bump `version` to invalidate every cache at once.
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    rateLimit: {
      // Better Auth only rate-limits in production by default. Store counters
      // in Postgres (the `rate_limit` table in packages/db) rather than
      // process memory, so limits are shared by every server instance and
      // survive restarts/deploys. Default window/max apply, plus Better Auth's
      // stricter built-in rules for sign-in/sign-up/OTP endpoints.
      storage: "database",
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          try {
            if (magicLinkService) {
              await magicLinkService.sendMagicLink({
                email,
                url,
                productName: "Example App",
              });
              log.info("Magic link sent");
            } else if (!isProduction()) {
              // Dev-only fallback when no email service is configured (e.g.
              // before Mailpit/SMTP is set up). Magic-link URLs are sign-in
              // credentials — they must never reach production logs.
              log.warn(
                `Email service not configured. Magic link for ${email}: ${url}`,
              );
            } else {
              throw new Error(
                "Email service is not configured. Refusing to log a magic link in production — set EMAIL_SERVER_HOST/EMAIL_SERVER_PORT/EMAIL_FROM.",
              );
            }
          } catch (error) {
            log.error("Failed to send magic link:", error);
            throw error;
          }
        },
      }),
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          try {
            if (otpService) {
              await otpService.sendOTP({
                email,
                otp,
                productName: "Example App",
              });
              log.info(`OTP (${type}) sent`);
            } else if (!isProduction()) {
              // Dev-only fallback when no email service is configured (e.g.
              // before Mailpit/SMTP is set up). OTPs are credentials — they
              // must never reach production logs.
              log.warn(
                `Email service not configured. OTP for ${email}: ${otp}`,
              );
            } else {
              throw new Error(
                "Email service is not configured. Refusing to log an OTP in production — set EMAIL_SERVER_HOST/EMAIL_SERVER_PORT/EMAIL_FROM.",
              );
            }
          } catch (error) {
            log.error("Failed to send OTP:", error);
            throw error;
          }
        },
        // Enable OTP storage and validation to prevent accepting any OTP
        storeOTP: "hashed",
        // Set reasonable limits
        expiresIn: 300, // 5 minutes
        allowedAttempts: 3, // Max 3 attempts per OTP
        otpLength: 6, // 6-digit OTP
      }),
      expo(),
    ],
    socialProviders: {
      ...(options.google && {
        google: {
          clientId: options.google.clientId,
          clientSecret: options.google.clientSecret,
        },
      }),
      ...(options.apple && {
        apple: {
          clientId: options.apple.clientId,
          clientSecret: options.apple.clientSecret,
          redirectURI: `${options.baseUrl}/api/auth/callback/apple`,
          // Required for native iOS apps
          ...(options.apple.appBundleId && {
            appBundleIdentifier: options.apple.appBundleId,
          }),
        },
      }),
    },
    // Better Auth always trusts `baseURL`. Everything else is explicit: the
    // mobile deep-link scheme (must match `scheme` in apps/expo/app.config.ts),
    // Apple's form_post callback origin when Apple is enabled, and any extra
    // origins from TRUSTED_ORIGINS. (The Expo plugin adds `exp://` in dev.)
    trustedOrigins: [
      "example-app://",
      "example-app://*",
      ...(options.apple ? ["https://appleid.apple.com"] : []),
      ...(options.trustedOrigins ?? []),
    ],
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
