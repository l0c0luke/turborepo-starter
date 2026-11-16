/**
 * Contextual help for every screen (AGENTS.md → UX → Command palette +
 * contextual help). Each screen passes its entry to `<NavigationBar help>`
 * (or renders `<HelpModal help>` itself when it has no navigation bar); the
 * "?" button opens it. `check:conventions` (contextual-help) fails a screen
 * in `src/app/` that doesn't. Explain what the screen is for and how to use
 * what's on it, in the user's words — not how it's built.
 */
export interface ScreenHelp {
  title: string;
  intro: string;
  tips: readonly string[];
}

export const screenHelp = {
  signIn: {
    title: "Signing in",
    intro: "There's no password to remember: you sign in with your email.",
    tips: [
      "Enter your email and we'll send a 6-digit code. Type it here to sign in.",
      "The email also has a sign-in link: opening it on this phone signs you in directly.",
      "No email after a minute? Check your spam folder, then request a new code.",
    ],
  },
  home: {
    title: "Home",
    intro: "This is your start screen once you're signed in.",
    tips: [
      "The menu (top right) is where you sign out.",
      "You stay signed in on this device until you sign out.",
    ],
  },
} as const satisfies Record<string, ScreenHelp>;
