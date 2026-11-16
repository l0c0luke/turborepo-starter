"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  createContext,
  lazy,
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CircleHelp, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { trackEvent } from "@example-app/analytics";

import type { RouteKey } from "~/navigation/routes";
import { Button } from "~/_components/ui/button";
import { Skeleton } from "~/_components/ui/skeleton";

/**
 * ⌘K command palette + contextual help (AGENTS.md → UX → Command palette +
 * contextual help). Mounted once in `ConditionalLayout`:
 *
 * - ⌘K / Ctrl+K (or the navbar search button) opens the palette: pages from
 *   `~/navigation/routes`, the current page's commands (`usePageCommands`),
 *   people (server-side search, admins), help topics and preferences.
 * - `?` (or the help button) opens help for the current page, from
 *   `help.pages.<route key>` in the locale files.
 *
 * Both dialogs are lazy chunks (they stay out of every route's initial
 * bundle) and are fetched while the browser is idle, so the first ⌘K opens
 * instantly; a skeleton covers a cold load.
 */

export interface PageCommand {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Extra words to match on, e.g. synonyms. */
  keywords?: string;
  run: () => void;
}

interface CommandCenterValue {
  paletteEnabled: boolean;
  openPalette: () => void;
  /** Help for `route`, or for the current page. */
  openHelp: (route?: RouteKey) => void;
  /** The current page's commands (read when the palette opens). */
  getPageCommands: () => PageCommand[];
  registerPageCommands: (get: () => PageCommand[]) => () => void;
}

const CommandCenterContext = createContext<CommandCenterValue | null>(null);

export function useCommandCenter(): CommandCenterValue {
  const value = use(CommandCenterContext);
  if (!value) throw new Error("useCommandCenter needs <CommandCenterProvider>");
  return value;
}

/**
 * Adds commands for the current page to the palette's "On this page" group
 * while the calling component is mounted. Pass a fresh array every render;
 * the palette reads the latest one when it opens.
 */
export function usePageCommands(commands: PageCommand[]): void {
  const { registerPageCommands } = useCommandCenter();
  const latest = useRef(commands);
  useEffect(() => {
    latest.current = commands;
  });
  useEffect(
    () => registerPageCommands(() => latest.current),
    [registerPageCommands],
  );
}

const loadPalette = () => import("./CommandPalette");
const loadHelp = () => import("./HelpDialog");

function DialogSkeleton() {
  return (
    <div className="bg-background/80 fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="bg-background w-full max-w-lg space-y-3 rounded-lg border p-4 shadow-lg">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// React.lazy rather than next/dynamic: it's already in React, so the lazy
// boundary adds nothing to every route's initial JS (check:bundle). The
// dialogs only render after a click or key press, so there's no SSR to skip.
const CommandPalette = lazy(() =>
  loadPalette().then((module) => ({ default: module.CommandPalette })),
);
const HelpDialog = lazy(() =>
  loadHelp().then((module) => ({ default: module.HelpDialog })),
);

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function CommandCenterProvider({
  children,
  paletteEnabled,
}: {
  children: ReactNode;
  /** Off on public pages (no session to search with); help always works. */
  paletteEnabled: boolean;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  // null = closed; "current" = whatever page is on screen.
  const [helpRoute, setHelpRoute] = useState<RouteKey | "current" | null>(null);
  const commandSources = useRef(new Set<() => PageCommand[]>());

  const openPalette = useCallback(() => {
    if (!paletteEnabled) return;
    setHelpRoute(null);
    setPaletteOpen(true);
    trackEvent("command_palette_open");
  }, [paletteEnabled]);

  const openHelp = useCallback((route?: RouteKey) => {
    setPaletteOpen(false);
    setHelpRoute(route ?? "current");
  }, []);

  const registerPageCommands = useCallback((get: () => PageCommand[]) => {
    commandSources.current.add(get);
    return () => {
      commandSources.current.delete(get);
    };
  }, []);

  const getPageCommands = useCallback(
    () => [...commandSources.current].flatMap((get) => get()),
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (paletteOpen) setPaletteOpen(false);
        else openPalette();
      } else if (
        event.key === "?" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !isTyping(event.target)
      ) {
        event.preventDefault();
        openHelp();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen, openPalette, openHelp]);

  // Warm both chunks once the page is idle: the first open is instant.
  useEffect(() => {
    const warm = () => {
      if (paletteEnabled) void loadPalette();
      void loadHelp();
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm);
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(warm, 1500);
    return () => clearTimeout(timer);
  }, [paletteEnabled]);

  const value = useMemo(
    () => ({
      paletteEnabled,
      openPalette,
      openHelp,
      getPageCommands,
      registerPageCommands,
    }),
    [
      paletteEnabled,
      openPalette,
      openHelp,
      getPageCommands,
      registerPageCommands,
    ],
  );

  return (
    <CommandCenterContext value={value}>
      {children}
      <Suspense fallback={<DialogSkeleton />}>
        {paletteOpen && <CommandPalette open onOpenChange={setPaletteOpen} />}
        {helpRoute !== null && (
          <HelpDialog
            route={helpRoute === "current" ? undefined : helpRoute}
            onClose={() => setHelpRoute(null)}
          />
        )}
      </Suspense>
    </CommandCenterContext>
  );
}

const isMac = () =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform);

/** Navbar button that opens the palette, showing its shortcut. */
export function CommandPaletteButton() {
  const t = useTranslations("commandPalette");
  const { openPalette } = useCommandCenter();
  const [shortcut, setShortcut] = useState("Ctrl K");
  useEffect(() => setShortcut(isMac() ? "⌘K" : "Ctrl K"), []);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={openPalette}
      className="text-muted-foreground w-40 justify-between font-normal sm:w-56"
    >
      <span className="flex items-center gap-2">
        <Search aria-hidden className="size-4" />
        {t("button")}
      </span>
      <kbd className="bg-muted rounded border px-1.5 font-mono text-[10px]">
        {shortcut}
      </kbd>
    </Button>
  );
}

/** Opens help for the current page. */
export function HelpButton({ className }: { className?: string }) {
  const t = useTranslations("help");
  const { openHelp } = useCommandCenter();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => openHelp()}
      aria-label={t("button")}
      title={`${t("button")} (?)`}
      className={className}
    >
      <CircleHelp aria-hidden className="size-5" />
    </Button>
  );
}
