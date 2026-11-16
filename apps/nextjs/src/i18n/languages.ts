/**
 * The locales this app ships — one list for the server (cookie validation in
 * `~/lib/locale`) and every language picker. Adding a locale = an entry here
 * plus `src/languages/<code>.json` with the same keys as `en.json`
 * (`check:conventions` compares them).
 */
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
] as const satisfies readonly { code: Locale; name: string; flag: string }[];
