import "server-only";

import { env } from "~/env";

/**
 * Social sign-in is opt-in by configuration: a provider is enabled only when
 * all of its credentials are present in the runtime environment. Leave the
 * variables unset (or empty) to disable it — no separate feature flag.
 */
export const socialProviders = {
  google:
    env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? { clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }
      : undefined,
  apple:
    env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
      ? {
          clientId: env.APPLE_CLIENT_ID,
          clientSecret: env.APPLE_CLIENT_SECRET,
          appBundleId: env.APPLE_APP_BUNDLE_ID,
        }
      : undefined,
};

/** Which social buttons the login page should render (no secrets). */
export interface EnabledSocialProviders {
  google: boolean;
  apple: boolean;
}

export const enabledSocialProviders: EnabledSocialProviders = {
  google: !!socialProviders.google,
  apple: !!socialProviders.apple,
};
