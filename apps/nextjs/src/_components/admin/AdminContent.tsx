"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
import { useTRPC } from "~/trpc/react";

export function AdminContent({ currentUserId }: { currentUserId: string }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: users } = useSuspenseQuery(trpc.admin.listUsers.queryOptions());

  // Instant feedback (the pattern to copy for every mutation): update the
  // cached list optimistically in onMutate so the UI changes on click, roll
  // back + toast on error, and revalidate against the server once settled.
  const listKey = trpc.admin.listUsers.queryKey();
  type UserList = typeof users;

  const optimisticallyUpdate = async (update: (list: UserList) => UserList) => {
    await queryClient.cancelQueries({ queryKey: listKey });
    const previous = queryClient.getQueryData(listKey);
    queryClient.setQueryData(listKey, (list) => list && update(list));
    return { previous };
  };
  const rollback = (snapshot?: { previous?: UserList }) => {
    if (snapshot?.previous)
      queryClient.setQueryData(listKey, snapshot.previous);
    toast.error(t("actionFailed"));
  };
  const revalidate = () => queryClient.invalidateQueries({ queryKey: listKey });

  const setUserAdmin = useMutation(
    trpc.admin.setUserAdmin.mutationOptions({
      onMutate: ({ userId, isAdmin }) =>
        optimisticallyUpdate((list) =>
          list.map((u) => (u.id === userId ? { ...u, isAdmin } : u)),
        ),
      onError: (_error, _variables, snapshot) => rollback(snapshot),
      onSuccess: () => toast.success(t("userUpdated")),
      onSettled: revalidate,
    }),
  );

  const deleteUser = useMutation(
    trpc.admin.deleteUser.mutationOptions({
      onMutate: ({ userId }) =>
        optimisticallyUpdate((list) => list.filter((u) => u.id !== userId)),
      onError: (_error, _variables, snapshot) => rollback(snapshot),
      onSuccess: () => toast.success(t("userDeleted")),
      onSettled: revalidate,
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

      <div className="bg-background rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("joined")}</TableHead>
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
                  {t("empty")}
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
    </div>
  );
}
