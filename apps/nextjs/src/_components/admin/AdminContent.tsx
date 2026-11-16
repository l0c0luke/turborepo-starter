"use client";

import {
  noop,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { listUsersSchema } from "@example-app/validators";

import {
  DataTablePagination,
  DataTableSearch,
  SortableHead,
} from "~/_components/data-table/DataTable";
import { useListParams } from "~/_components/data-table/use-list-params";
import { useOptimisticPages } from "~/_components/data-table/use-optimistic-pages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/_components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/_components/ui/avatar";
import { Badge } from "~/_components/ui/badge";
import { Button } from "~/_components/ui/button";
import { Switch } from "~/_components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/_components/ui/table";
import { cn } from "~/lib/utils";
import { useTRPC } from "~/trpc/react";

export function AdminContent({ currentUserId }: { currentUserId: string }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tdt = useTranslations("dataTable");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Server-side table: page, search and sort live in the URL and run in SQL.
  const table = useListParams(listUsersSchema);
  const { data } = useSuspenseQuery(
    trpc.admin.listUsers.queryOptions(table.query),
  );
  const users = data.items;
  // Hovering "next"/"previous" warms that page so the click is instant.
  const prefetchPage = (page: number) =>
    queryClient
      .query(trpc.admin.listUsers.queryOptions({ ...table.query, page }))
      .catch(noop);

  // Instant feedback (the pattern to copy for every mutation): update every
  // cached page optimistically in onMutate so the UI changes on click, roll
  // back + toast on error, and revalidate against the server once settled.
  const pages = useOptimisticPages<(typeof users)[number]>(
    trpc.admin.listUsers.pathFilter(),
    t("actionFailed"),
  );

  const setUserAdmin = useMutation(
    trpc.admin.setUserAdmin.mutationOptions({
      onMutate: ({ userId, isAdmin }) =>
        pages.update((list) =>
          list.map((u) => (u.id === userId ? { ...u, isAdmin } : u)),
        ),
      onError: (_error, _variables, snapshot) => pages.rollback(snapshot),
      onSuccess: () => toast.success(t("userUpdated")),
      onSettled: pages.revalidate,
    }),
  );

  const deleteUser = useMutation(
    trpc.admin.deleteUser.mutationOptions({
      onMutate: ({ userId }) =>
        pages.update((list) => list.filter((u) => u.id !== userId)),
      onError: (_error, _variables, snapshot) => pages.rollback(snapshot),
      onSuccess: () => toast.success(t("userDeleted")),
      onSettled: pages.revalidate,
    }),
  );

  // Only the row being changed is locked while its request is in flight.
  const isRowPending = (userId: string) =>
    (setUserAdmin.isPending && setUserAdmin.variables.userId === userId) ||
    (deleteUser.isPending && deleteUser.variables.userId === userId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <DataTableSearch
        value={table.searchText}
        onChange={table.setSearchText}
        placeholder={t("searchPlaceholder")}
        isUpdating={table.isUpdating}
      />

      <div
        aria-busy={table.isUpdating}
        className={cn(
          "bg-background rounded-md border transition-opacity",
          table.isUpdating && "opacity-60",
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead
                column="name"
                sort={table.sort}
                dir={table.dir}
                onSort={table.toggleSort}
              >
                {t("name")}
              </SortableHead>
              <TableHead>{t("role")}</TableHead>
              <SortableHead
                column="createdAt"
                sort={table.sort}
                dir={table.dir}
                onSort={table.toggleSort}
              >
                {t("joined")}
              </SortableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-8 text-center"
                >
                  {table.query.search
                    ? tdt("noResults", { search: table.query.search })
                    : t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const isSelf = u.id === currentUserId;
                const rowPending = isRowPending(u.id);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={u.image ?? undefined}
                            alt={u.name}
                          />
                          <AvatarFallback>
                            {(u.name || u.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2 font-medium">
                            {u.name}
                            {isSelf && (
                              <Badge variant="outline">{t("you")}</Badge>
                            )}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isAdmin ? "default" : "secondary"}>
                        {u.isAdmin ? t("roleAdmin") : t("roleUser")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-4">
                        <Switch
                          checked={u.isAdmin}
                          disabled={isSelf || rowPending}
                          onCheckedChange={(checked) =>
                            setUserAdmin.mutate({
                              userId: u.id,
                              isAdmin: checked,
                            })
                          }
                          aria-label={
                            u.isAdmin ? t("removeAdmin") : t("makeAdmin")
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isSelf || rowPending}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{tc("delete")}</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("deleteTitle")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("deleteDescription", { name: u.name })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {tc("cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90 text-white"
                                onClick={() =>
                                  deleteUser.mutate({ userId: u.id })
                                }
                              >
                                {tc("delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={data}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        onPrefetch={prefetchPage}
      />
    </div>
  );
}
