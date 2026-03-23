"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

import { keys } from "./keys";

export function AnalyticsProvider() {
  const gaId = keys.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  if (!gaId) {
    return null;
  }

  return <GoogleAnalytics gaId={gaId} />;
}
