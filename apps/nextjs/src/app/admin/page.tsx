import { Suspense } from "react";
import { redirect } from "next/navigation";

import {
  listInputFromSearchParams,
  listUsersSchema,
} from "@example-app/validators";

import { AdminContent } from "~/_components/admin/AdminContent";
import { AdminSkeleton } from "~/_components/admin/AdminSkeleton";
import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Redirect to the home landing if the user is not an admin
  if (!session.user.isAdmin) {
    redirect("/");
  }

  // The same input the client derives from the URL (useListParams), so the
  // first page is hydrated and the table renders without a request.
  prefetch(
    trpc.admin.listUsers.queryOptions(
      listInputFromSearchParams(listUsersSchema, await searchParams),
    ),
  );

  return (
    <HydrateClient>
      <Suspense fallback={<AdminSkeleton />}>
        <AdminContent currentUserId={session.user.id} />
      </Suspense>
    </HydrateClient>
  );
}
