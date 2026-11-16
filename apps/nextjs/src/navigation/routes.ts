import type { LucideIcon } from "lucide-react";
import { House, LogIn, Users } from "lucide-react";

import { findRoute } from "@example-app/shared";

/**
 * Every page of the web app — the single list the ⌘K command palette and the
 * contextual help read (AGENTS.md → UX → Command palette + contextual help).
 *
 * Adding a page = an entry here plus, in every `src/languages/*.json`:
 *   routes.<key>      { title, description, keywords }  → palette "Pages"
 *   help.pages.<key>  { title, intro, tips: { … } }     → the page's help
 * `check:conventions` (contextual-help) fails a `page.tsx` with no entry, or
 * an entry with missing messages.
 *
 * `access`: "public" pages (sign-in) get help but aren't listed in the
 * palette; "admin" pages are listed only for admins.
 */
export type RouteAccess = "public" | "user" | "admin";

export interface AppRoute {
  key: string;
  href: string;
  icon: LucideIcon;
  access: RouteAccess;
}

export const appRoutes = [
  { key: "home", href: "/", icon: House, access: "user" },
  { key: "admin", href: "/admin", icon: Users, access: "admin" },
  { key: "login", href: "/login", icon: LogIn, access: "public" },
] as const satisfies readonly AppRoute[];

export type RouteKey = (typeof appRoutes)[number]["key"];

/** The registered route for a pathname (exact, else closest ancestor). */
export const routeForPath = (pathname: string) =>
  findRoute(appRoutes, pathname);

/** Routes to offer a signed-in user in the palette. */
export const navigableRoutes = (isAdmin: boolean) =>
  appRoutes.filter(
    (route) => route.access === "user" || (route.access === "admin" && isAdmin),
  );
