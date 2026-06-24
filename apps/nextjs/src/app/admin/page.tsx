import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AdminContent } from "~/_components/admin/AdminContent";
import { AdminSkeleton } from "~/_components/admin/AdminSkeleton";
import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

export default async function AdminPage() {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect to the home landing if the user is not an admin
  if (!session.user.isAdmin) {
    redirect("/");
  }

  prefetch(trpc.admin.listUsers.queryOptions());

  return (
    <HydrateClient>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent currentUserId={session.user.id} />
      </Suspense>
    </HydrateClient>
  );
}
