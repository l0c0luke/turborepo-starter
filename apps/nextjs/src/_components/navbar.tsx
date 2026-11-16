// Navbar for authenticated users
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, LogOut, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { log } from "@example-app/shared";

import { Avatar, AvatarFallback, AvatarImage } from "~/_components/ui/avatar";
import { Button } from "~/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/_components/ui/dropdown-menu";
import { Switch } from "~/_components/ui/switch";
import { authClient } from "~/auth/client";
import { useLocaleSwitch } from "~/hooks/useLocaleSwitch";
import { languages } from "~/i18n/languages";

export function Navbar() {
  const t = useTranslations("navigation");
  const { data: session, isPending } = authClient.useSession();
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { switchLocale } = useLocaleSwitch();

  // Get current locale from cookie - only on client side
  const [currentLocale, setCurrentLocale] = useState("en");

  useEffect(() => {
    const updateLocaleFromCookie = () => {
      if (typeof window === "undefined") return;
      const cookieLocale = /locale=([^;]+)/.exec(document.cookie)?.[1];
      if (cookieLocale) {
        setCurrentLocale(cookieLocale);
      }
    };

    // Initial load
    updateLocaleFromCookie();

    // Poll for cookie changes for a short period after component mounts
    const pollInterval = setInterval(updateLocaleFromCookie, 100);

    // Stop polling after 2 seconds
    setTimeout(() => clearInterval(pollInterval), 2000);

    // Also listen for focus events (when user comes back to tab)
    const handleFocus = () => updateLocaleFromCookie();
    window.addEventListener("focus", handleFocus);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleLocaleSwitch = (locale: string) => {
    setCurrentLocale(locale); // Update immediately for better UX
    switchLocale(locale);
  };

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle dark mode using next-themes
  const handleToggleDark = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Handle logout with proper redirect
  const handleLogout = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Redirect to login page after successful logout
            window.location.href = "/login";
          },
        },
      });
    } catch (error) {
      log.error("Logout failed:", error);
      // Even if logout fails, redirect to login to be safe
      window.location.href = "/login";
    }
  };

  // Don't render if we're still loading session or not mounted
  if (!mounted || isPending) {
    return null;
  }

  // Don't render navbar if no session
  if (!session) return null;

  return (
    <div className="bg-background sticky top-0 z-50 w-full border-b">
      <nav className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="sr-only">Example App</span>
          {/* App title */}
          <div className="relative flex h-8 items-center">
            <span className="text-xl font-bold">Example App</span>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage
                  src={session.user.image ?? undefined}
                  alt={session.user.name || session.user.email}
                  className="bg-muted"
                />
                <AvatarFallback className="bg-muted text-foreground">
                  {(session.user.name || session.user.email || "U")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="text-muted-foreground px-2 py-2 text-xs font-semibold">
              {session.user.name || session.user.email}
            </div>
            {session.user.isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 hover:cursor-pointer"
                  >
                    <Shield className="h-4 w-4" />
                    <span>{t("admin")}</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{t("language")}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => handleLocaleSwitch(language.code)}
                    className="flex items-center gap-2 hover:cursor-pointer"
                  >
                    <span className="text-lg">{language.flag}</span>
                    <span>{language.name}</span>
                    {language.code === currentLocale && (
                      <span className="text-primary ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="flex w-full items-center justify-between">
                {t("darkMode")}
                <Switch
                  className="ml-2 hover:cursor-pointer"
                  checked={theme === "dark"}
                  onCheckedChange={handleToggleDark}
                />
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive flex items-center gap-2 hover:cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
