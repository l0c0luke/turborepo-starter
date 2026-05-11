"use client";

import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/_components/ui/card";

export function DashboardContent() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col gap-8">
      <Card className="w-full rounded-lg shadow">
        <CardHeader>
          <CardTitle>{t("welcome")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("description")}</p>
        </CardContent>
      </Card>

      <Card className="w-full rounded-lg shadow">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground list-disc space-y-2 pl-4">
            <li>Update the database schema in packages/db/src/schema.ts</li>
            <li>Add new API routes in packages/api/src/router/</li>
            <li>Build your UI components in apps/nextjs/src/_components/</li>
            <li>Check out the Expo app in apps/expo/ for mobile development</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
