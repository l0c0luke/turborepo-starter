import "server-only";

import { headers } from "next/headers";

import { initAuth } from "@example-app/auth";
import { parseOriginList } from "@example-app/shared";

import { env } from "~/env";
import { socialProviders } from "./providers";

const baseUrl = env.NEXT_PUBLIC_BASE_URL;

export const auth = initAuth({
  baseUrl,
  productionUrl: env.NEXT_PUBLIC_BASE_URL,
  secret: env.AUTH_SECRET,
  trustedOrigins: parseOriginList(env.TRUSTED_ORIGINS),
  // Optional social providers — only registered when their env vars are set.
  google: socialProviders.google,
  apple: socialProviders.apple,

  emailFrom: env.EMAIL_FROM,
  // Add email service configuration here if needed
  smtpHost: env.EMAIL_SERVER_HOST,
  smtpPort: Number(env.EMAIL_SERVER_PORT),
  smtpUser: env.EMAIL_SERVER_USER,
  smtpPassword: env.EMAIL_SERVER_PASSWORD,
});

export const getSession = async () =>
  auth.api.getSession({ headers: await headers() });
