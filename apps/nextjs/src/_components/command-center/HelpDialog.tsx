"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Lightbulb, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { trackEvent } from "@example-app/analytics";

import type { RouteKey } from "~/navigation/routes";
import { Button } from "~/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/_components/ui/dialog";
import { routeForPath } from "~/navigation/routes";
import { useCommandCenter } from "./CommandCenter";

/**
 * Contextual help: what the page on screen does and how to use it, from
 * `help.pages.<route key>` in the locale files (every route has one —
 * `check:conventions` contextual-help).
 */
export function HelpDialog({
  route,
  onClose,
}: {
  /** Defaults to the page on screen. */
  route?: RouteKey;
  onClose: () => void;
}) {
  const t = useTranslations("help");
  const pathname = usePathname();
  const { paletteEnabled, openPalette } = useCommandCenter();
  const key = route ?? routeForPath(pathname)?.key ?? "home";

  useEffect(() => trackEvent("help_open", { page: key }), [key]);

  const tips = Object.keys(
    t.raw(`pages.${key}.tips`) as Record<string, string>,
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(`pages.${key}.title`)}</DialogTitle>
          <DialogDescription>{t(`pages.${key}.intro`)}</DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-3 text-sm">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-3">
              <Lightbulb
                aria-hidden
                className="text-primary mt-0.5 size-4 shrink-0"
              />
              <span>{t(`pages.${key}.tips.${tip}`)}</span>
            </li>
          ))}
        </ul>

        <div className="border-t pt-4">
          <h3 className="mb-2 text-sm font-medium">{t("shortcuts")}</h3>
          <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            {paletteEnabled && (
              <>
                <dt>
                  <kbd className="bg-muted rounded border px-1.5 font-mono text-xs">
                    ⌘K / Ctrl K
                  </kbd>
                </dt>
                <dd>{t("shortcutPalette")}</dd>
              </>
            )}
            <dt>
              <kbd className="bg-muted rounded border px-1.5 font-mono text-xs">
                ?
              </kbd>
            </dt>
            <dd>{t("shortcutHelp")}</dd>
          </dl>
        </div>

        {paletteEnabled && (
          <Button variant="outline" className="w-fit" onClick={openPalette}>
            <Search aria-hidden />
            {t("searchEverything")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
