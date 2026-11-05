import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { env } from "~/env";

// Social sign-in is optional. Each provider is enabled only when its build-time
// env is set; the server must have the matching provider configured too
// (see .env.example).

// Google: set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (the same web client ID as the
// server's AUTH_GOOGLE_ID). Unset/empty = no Google button, no configure().
const googleWebClientId = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const isGoogleAuthEnabled = !!googleWebClientId;

if (googleWebClientId) {
  GoogleSignin.configure({
    webClientId: googleWebClientId,
  });
}

// Apple (iOS only): set EXPO_PUBLIC_APPLE_AUTH_ENABLED="true" once the server
// has APPLE_CLIENT_ID / APPLE_CLIENT_SECRET / APPLE_APP_BUNDLE_ID configured.
export const isAppleAuthEnabled = env.EXPO_PUBLIC_APPLE_AUTH_ENABLED;

export const authClient = createAuthClient({
  baseURL: env.EXPO_PUBLIC_BASE_URL,
  plugins: [
    expoClient({
      scheme: "example-app",
      storagePrefix: "example-app",
      storage: SecureStore,
    }),
    emailOTPClient(),
  ],
});

export { GoogleSignin };
