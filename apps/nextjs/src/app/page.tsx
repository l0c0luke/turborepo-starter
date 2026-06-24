import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Button } from "~/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/_components/ui/card";
import { getSession } from "~/auth/server";

/**
 * Home — the authenticated landing page.
 *
 * This is the skeleton's single "you're signed in" screen. The proxy middleware
 * (`src/proxy.ts`) sends unauthenticated visitors to `/login`; this server
 * component double-checks the session and is the place to start building your app.
 */
export default async function Home() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const t = await getTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("home.welcome")}</CardTitle>
        <CardDescription>
          {t("home.signedInAs", { email: session.user.email })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          {t("home.startBuilding")}
        </p>
        {session.user.isAdmin && (
          <Button asChild className="w-fit">
            <Link href="/admin">{t("home.openAdmin")}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
