import { afterAll, describe, expect, it } from "vitest";

import { callerFor, cleanupTestUsers, createTestUser } from "../test/helpers";

describe("admin router", () => {
  afterAll(cleanupTestUsers);

  it("listUsers returns users without sensitive columns", async () => {
    const admin = await createTestUser({ isAdmin: true });
    const users = await callerFor(admin).admin.listUsers();

    const self = users.find((u) => u.id === admin.id);
    expect(self).toMatchObject({ id: admin.id, isAdmin: true });
    expect(Object.keys(self ?? {}).toSorted()).toEqual(
      ["createdAt", "email", "id", "image", "isAdmin", "name"].toSorted(),
    );
  });

  it("setUserAdmin promotes and demotes a user", async () => {
    const admin = await createTestUser({ isAdmin: true });
    const member = await createTestUser();
    const api = callerFor(admin).admin;

    await expect(
      api.setUserAdmin({ userId: member.id, isAdmin: true }),
    ).resolves.toMatchObject({ id: member.id, isAdmin: true });
    await expect(
      api.setUserAdmin({ userId: member.id, isAdmin: false }),
    ).resolves.toMatchObject({ id: member.id, isAdmin: false });
  });

  it("setUserAdmin is NOT_FOUND for an unknown user", async () => {
    const admin = await createTestUser({ isAdmin: true });
    await expect(
      callerFor(admin).admin.setUserAdmin({
        userId: "does-not-exist",
        isAdmin: true,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deleteUser removes another user", async () => {
    const admin = await createTestUser({ isAdmin: true });
    const member = await createTestUser();
    const api = callerFor(admin).admin;

    await expect(api.deleteUser({ userId: member.id })).resolves.toEqual({
      id: member.id,
    });
    await expect(api.deleteUser({ userId: member.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deleteUser refuses to delete the caller's own account", async () => {
    const admin = await createTestUser({ isAdmin: true });
    await expect(
      callerFor(admin).admin.deleteUser({ userId: admin.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
