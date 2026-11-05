import { afterAll, describe, expect, it } from "vitest";

import { callerFor, cleanupTestUsers, createTestUser } from "../test/helpers";

describe("auth router", () => {
  afterAll(cleanupTestUsers);

  it("getSession returns the caller's session", async () => {
    const member = await createTestUser();
    const session = await callerFor(member).auth.getSession();
    expect(session?.user.id).toBe(member.id);
  });

  it("getProfile returns the signed-in user's row", async () => {
    const member = await createTestUser({ name: "Profile Owner" });
    await expect(callerFor(member).auth.getProfile()).resolves.toMatchObject({
      id: member.id,
      name: "Profile Owner",
    });
  });

  it("getProfile is NOT_FOUND when the session's user no longer exists", async () => {
    const member = await createTestUser();
    await cleanupTestUsers(); // delete the row, keep the (now stale) session
    await expect(callerFor(member).auth.getProfile()).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
