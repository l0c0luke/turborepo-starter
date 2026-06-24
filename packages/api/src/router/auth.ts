import type { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";

import { user } from "@example-app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  /** Current session (or null). Used by the apps to read auth state. */
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  /** Reference example of a protected "fetch the current user" query. */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userProfile = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
    });

    if (!userProfile) {
      throw new Error("User not found");
    }

    return userProfile;
  }),
} satisfies TRPCRouterRecord;
