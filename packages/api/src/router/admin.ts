import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

import { user } from "@example-app/db/schema";
import { deleteUserSchema, setUserAdminSchema } from "@example-app/validators";

import { adminProcedure } from "../trpc";

/**
 * Admin router — the reference example of a protected, role-gated feature.
 *
 * Every procedure here uses `adminProcedure`, which rejects non-admins. It pairs
 * with the `/admin` page in the Next.js app. Copy this shape when building your
 * own protected routers.
 */
export const adminRouter = {
  listUsers: adminProcedure.query(({ ctx }) => {
    return ctx.db.query.user.findMany({
      orderBy: desc(user.createdAt),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }),

  setUserAdmin: adminProcedure
    .input(setUserAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(user)
        .set({ isAdmin: input.isAdmin, updatedAt: new Date() })
        .where(eq(user.id, input.userId))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return updated;
    }),

  deleteUser: adminProcedure
    .input(deleteUserSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      const [deleted] = await ctx.db
        .delete(user)
        .where(eq(user.id, input.userId))
        .returning({ id: user.id });

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return deleted;
    }),
} satisfies TRPCRouterRecord;
