import { z } from "zod/v4";

/**
 * Shared Zod validators.
 *
 * Put schemas here when the SAME validation needs to run on both the server
 * (tRPC inputs in `@example-app/api`) and the client (forms in the apps). For
 * schemas derived directly from your database tables, prefer `drizzle-zod` in
 * `@example-app/db`. The admin schemas below are the reference example — the
 * `admin` tRPC router consumes them.
 */

export const setUserAdminSchema = z.object({
  userId: z.string().min(1),
  isAdmin: z.boolean(),
});
export type SetUserAdminInput = z.infer<typeof setUserAdminSchema>;

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
});
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
