import type { TRPCRouterRecord } from "@trpc/server";
import type { AnyColumn } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";

import type { ListUsersInput } from "@example-app/validators";
import { user } from "@example-app/db/schema";
import {
  deleteUserSchema,
  listUsersSchema,
  setUserAdminSchema,
} from "@example-app/validators";

import { paginate, searchAny, sortBy } from "../pagination";
import { adminProcedure } from "../trpc";

const SORT_COLUMNS = {
  createdAt: user.createdAt,
  name: user.name,
  email: user.email,
} satisfies Record<NonNullable<ListUsersInput["sort"]>, AnyColumn>;

/**
 * Admin router — the reference example of a protected, role-gated feature.
 *
 * Every procedure here uses `adminProcedure`, which rejects non-admins. It pairs
 * with the `/admin` page in the Next.js app. Copy this shape when building your
 * own protected routers.
 */
export const adminRouter = {
  /** One page of users, searched by name/email and sorted on the server. */
  listUsers: adminProcedure.input(listUsersSchema).query(({ ctx, input }) => {
    const where = searchAny(input.search, [user.name, user.email]);
    return paginate(input, {
      rows: (limit, offset) =>
        ctx.db.query.user.findMany({
          where,
          // The id tiebreaker keeps pages stable when sort values are equal.
          orderBy: [sortBy(SORT_COLUMNS[input.sort], input.dir), asc(user.id)],
          limit,
          offset,
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
            isAdmin: true,
            createdAt: true,
          },
        }),
      count: () => ctx.db.$count(user, where),
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
