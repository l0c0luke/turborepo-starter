import { sendGAEvent } from "@next/third-parties/google";

/** GA4 event parameter values (GA drops nested objects). */
type EventParams = Record<string, string | number | boolean>;

/**
 * Record a product event in Google Analytics 4 — the one way features should
 * emit analytics, so event names stay consistent and greppable.
 *
 *   trackEvent("sign_up", { method: "email_otp" });
 *
 * Use GA4's recommended event names where one fits
 * (https://support.google.com/analytics/answer/9267735), otherwise
 * snake_case. Never put PII (emails, names, free text) in params. A no-op
 * until <AnalyticsProvider> has loaded GA (e.g. no measurement ID in dev), and
 * client-only: call it from event handlers / effects, not during render.
 */
export function trackEvent(name: string, params: EventParams = {}): void {
  sendGAEvent("event", name, params);
}
