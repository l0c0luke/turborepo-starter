import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod/v4";

export function authEnv() {
  return createEnv({
    server: {
      AUTH_GOOGLE_ID: z.string().min(1),
      AUTH_GOOGLE_SECRET: z.string().min(1),
      AUTH_SECRET:
        process.env.NODE_ENV === "production"
          ? z.string().min(1)
          : z.string().min(1).optional(),
      NODE_ENV: z.enum(["development", "production"]).optional(),

      // Apple Sign In (optional)
      APPLE_CLIENT_ID: z.string().min(1).optional(),
      APPLE_TEAM_ID: z.string().min(1).optional(),
      APPLE_KEY_ID: z.string().min(1).optional(),
      APPLE_PRIVATE_KEY: z.string().min(1).optional(),
      APPLE_PRIVATE_KEY_PATH: z.string().optional(),
    },
    experimental__runtimeEnv: {},
    // SKIP_ENV_VALIDATION must skip here too (not just in apps/nextjs/src/env):
    // the auth package calls authEnv() at runtime, so Docker/CI builds that run
    // `SKIP_ENV_VALIDATION=1 pnpm build` without real secrets would otherwise
    // fail validation the moment this module is evaluated.
    skipValidation:
      !!process.env.SKIP_ENV_VALIDATION ||
      !!process.env.CI ||
      process.env.npm_lifecycle_event === "lint",
    // Treat empty strings as unset, matching apps/nextjs/src/env.ts — e.g. an
    // empty AUTH_SECRET in a dev .env should behave as "not configured", not
    // fail min(1).
    emptyStringAsUndefined: true,
  });
}
