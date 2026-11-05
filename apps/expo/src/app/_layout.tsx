import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import "react-native-reanimated";

import * as Sentry from "@sentry/react-native";

import { errorTrackingOptions, setErrorReporter } from "@example-app/shared";

import { env } from "~/env";
import { queryClient } from "~/utils/api";

// Error tracking (Sentry SDK → Bugsink locally) — inert unless
// EXPO_PUBLIC_SENTRY_DSN is set; `pnpm setup` fills it in.
const sentryDsn = env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn, ...errorTrackingOptions });
  // Route captureException / log.error from @example-app/shared to Sentry.
  setErrorReporter((error, context) =>
    Sentry.captureException(error, context ? { extra: context } : undefined),
  );
}

// This is the main layout of the app
// It wraps your pages with the providers they need
function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#f8fafc",
          },
          headerTintColor: "#1f2937",
          contentStyle: {
            backgroundColor: "#f8fafc",
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Login",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}

// `Sentry.wrap` adds an error boundary + performance tracking. It is a no-op
// passthrough when Sentry has not been initialized (no DSN).
export default Sentry.wrap(RootLayout);
