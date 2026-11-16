"use client";

import { usePathname } from "next/navigation";

import {
  CommandCenterProvider,
  HelpButton,
} from "~/_components/command-center/CommandCenter";
import { Navbar } from "~/_components/navbar";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// Routes that should not have the default layout container
const PUBLIC_ROUTES = ["/login"];

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isPublicRoute) {
    // Public routes: no navbar or container; help still works (no palette —
    // there's no session to search with).
    return (
      <CommandCenterProvider paletteEnabled={false}>
        <HelpButton className="fixed top-4 right-4 z-40" />
        {children}
      </CommandCenterProvider>
    );
  }

  // For authenticated routes, render with navbar and container
  return (
    <CommandCenterProvider paletteEnabled>
      <Navbar />
      <div className="bg-muted flex min-h-screen justify-center py-8">
        <div className="flex w-full max-w-4xl flex-col gap-4 px-6">
          {children}
        </div>
      </div>
    </CommandCenterProvider>
  );
}
