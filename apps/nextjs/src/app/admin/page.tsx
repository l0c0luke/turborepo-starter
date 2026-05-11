import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AdminContent } from "~/_components/admin/AdminContent";
import { AdminSkeleton } from "~/_components/admin/AdminSkeleton";
import { getSession } from "~/auth/server";
import { HydrateClient } from "~/trpc/server";

export default async function AdminPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect to dashboard if user is not an admin
  if (!session.user.isAdmin) {
    redirect("/dashboard");
  }

  return (
    <HydrateClient>
      <div className="mx-auto flex w-full flex-col gap-6">
        <Suspense fallback={<AdminSkeleton />}>
          <AdminContent />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
