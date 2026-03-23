import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";

import { AnalyticsProvider } from "@example-app/analytics/provider";
import { createMetadata } from "@example-app/seo/metadata";

import { ConditionalLayout } from "~/_components/conditional-layout";
import { Toaster } from "~/_components/ui/sonner";
import { TRPCReactProvider } from "~/trpc/react";

// Force dynamic rendering since we use cookies for locale detection
export const dynamic = "force-dynamic";

export const metadata: Metadata = createMetadata({
  title: "Example App",
  description: "A starter template for your next project",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const messages = await getMessages();

  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        {}
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TRPCReactProvider>
              <ConditionalLayout>{children}</ConditionalLayout>
            </TRPCReactProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Toaster />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
