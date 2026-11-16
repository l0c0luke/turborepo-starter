"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CircleHelp,
  Globe,
  LogOut,
  MoonStar,
  UserRound,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { trackEvent } from "@example-app/analytics";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/_components/ui/command";
import { Skeleton } from "~/_components/ui/skeleton";
import { authClient } from "~/auth/client";
import { useSignOut } from "~/auth/use-sign-out";
import { useLocaleSwitch } from "~/hooks/useLocaleSwitch";
import { languages } from "~/i18n/languages";
import { navigableRoutes, routeForPath } from "~/navigation/routes";
import { useTRPC } from "~/trpc/react";
import { useCommandCenter } from "./CommandCenter";

const PEOPLE_MIN_CHARS = 2;
const PEOPLE_DEBOUNCE_MS = 250;
const PEOPLE_LIMIT = 5;

/** The palette itself — lazy-loaded by `CommandCenterProvider`. */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("commandPalette");
  const tRoutes = useTranslations("routes");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { resolvedTheme, setTheme } = useTheme();
  const { switchLocale } = useLocaleSwitch();
  const signOut = useSignOut();
  const { openHelp, getPageCommands } = useCommandCenter();
  const { data: session } = authClient.useSession();
  const isAdmin = session?.user.isAdmin === true;

  const [search, setSearch] = useState("");
  const [peopleSearch, setPeopleSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(
      () => setPeopleSearch(search.trim()),
      PEOPLE_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  // People are searched on the server (never a whole table in the browser).
  const trpc = useTRPC();
  const people = useQuery({
    ...trpc.admin.listUsers.queryOptions({
      search: peopleSearch,
      pageSize: PEOPLE_LIMIT,
    }),
    enabled: isAdmin && peopleSearch.length >= PEOPLE_MIN_CHARS,
    placeholderData: keepPreviousData,
  });
  const searchingPeople =
    isAdmin &&
    search.trim().length >= PEOPLE_MIN_CHARS &&
    (people.isPending || search.trim() !== peopleSearch);

  const run = (id: string, action: () => unknown) => {
    onOpenChange(false);
    trackEvent("command_run", { command: id });
    void action();
  };

  const pageCommands = getPageCommands();
  const currentRoute = routeForPath(pathname);
  const routes = navigableRoutes(isAdmin);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      description={t("placeholder")}
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder={t("placeholder")}
      />
      <CommandList>
        <CommandEmpty>{searchingPeople ? null : t("empty")}</CommandEmpty>

        {pageCommands.length > 0 && (
          <CommandGroup heading={t("thisPage")}>
            {pageCommands.map(
              ({ id, label, icon: Icon = Zap, keywords, run: action }) => (
                <CommandItem
                  key={id}
                  value={`page-command ${id} ${label}`}
                  keywords={keywords ? [keywords] : undefined}
                  onSelect={() => run(id, action)}
                >
                  <Icon aria-hidden />
                  {label}
                </CommandItem>
              ),
            )}
          </CommandGroup>
        )}

        <CommandGroup heading={t("pages")}>
          {routes.map(({ key, href, icon: Icon }) => (
            <CommandItem
              key={key}
              value={`page ${key} ${tRoutes(`${key}.title`)}`}
              keywords={[
                tRoutes(`${key}.description`),
                tRoutes(`${key}.keywords`),
              ]}
              onSelect={() => run(`go_${key}`, () => router.push(href))}
            >
              <Icon aria-hidden />
              <div className="flex flex-col">
                <span>{tRoutes(`${key}.title`)}</span>
                <span className="text-muted-foreground text-xs">
                  {tRoutes(`${key}.description`)}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        {isAdmin && search.trim().length >= PEOPLE_MIN_CHARS && (
          <CommandGroup heading={t("users")}>
            {searchingPeople && !people.data
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2 py-3"
                  >
                    <Skeleton className="size-5 rounded-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))
              : (people.data?.items ?? []).map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`person ${user.id} ${user.name} ${user.email}`}
                    onSelect={() =>
                      run("open_user", () =>
                        router.push(
                          `/admin?search=${encodeURIComponent(user.email)}`,
                        ),
                      )
                    }
                  >
                    <UserRound aria-hidden />
                    <div className="flex flex-col">
                      <span>
                        {t("viewUser", { name: user.name || user.email })}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {user.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
          </CommandGroup>
        )}

        <CommandGroup heading={t("help")}>
          {[...(currentRoute ? [currentRoute] : []), ...routes]
            .filter(
              (route, index, all) =>
                all.findIndex((other) => other.key === route.key) === index,
            )
            .map(({ key }) => (
              <CommandItem
                key={key}
                value={`help ${key} ${tRoutes(`${key}.title`)}`}
                keywords={["help", "how", "?", tRoutes(`${key}.keywords`)]}
                onSelect={() => run(`help_${key}`, () => openHelp(key))}
              >
                <CircleHelp aria-hidden />
                {t("helpFor", { page: tRoutes(`${key}.title`) })}
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandGroup heading={t("preferences")}>
          <CommandItem
            value="toggle theme dark light mode"
            onSelect={() =>
              run("toggle_theme", () =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark"),
              )
            }
          >
            <MoonStar aria-hidden />
            {t("toggleTheme")}
          </CommandItem>
          {languages
            .filter((language) => language.code !== locale)
            .map((language) => (
              <CommandItem
                key={language.code}
                value={`language ${language.code} ${language.name}`}
                keywords={["language", "idioma", "locale"]}
                onSelect={() =>
                  run(`language_${language.code}`, () =>
                    switchLocale(language.code),
                  )
                }
              >
                <Globe aria-hidden />
                {t("language", { name: language.name })}
              </CommandItem>
            ))}
          <CommandItem
            value="sign out log out logout"
            onSelect={() => run("sign_out", signOut)}
          >
            <LogOut aria-hidden />
            {t("signOut")}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
