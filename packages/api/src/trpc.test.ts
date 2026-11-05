import { afterAll, describe, expect, it } from "vitest";

import { callerFor, cleanupTestUsers, createTestUser } from "./test/helpers";

/**
 * The procedure guards are the API's authorization boundary — every protected
 * or admin route relies on them, so they are tested directly.
 */
describe("procedure guards", () => {
  afterAll(cleanupTestUsers);

  it("publicProcedure: lets anonymous callers through", async () => {
    await expect(callerFor().auth.getSession()).resolves.toBeNull();
  });

  it("protectedProcedure: rejects anonymous callers with UNAUTHORIZED", async () => {
    await expect(callerFor().auth.getProfile()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("adminProcedure: rejects anonymous callers with UNAUTHORIZED", async () => {
    await expect(callerFor().admin.listUsers()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("adminProcedure: rejects signed-in non-admins with FORBIDDEN", async () => {
    const member = await createTestUser();
    await expect(callerFor(member).admin.listUsers()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("returns flattened Zod errors for invalid input", async () => {
    const admin = await createTestUser({ isAdmin: true });
    await expect(
      callerFor(admin).admin.deleteUser({ userId: "" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
