import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import { callerFor, cleanupTestUsers, createTestUser } from "../test/helpers";

describe("admin router", () => {
  afterAll(cleanupTestUsers);

  it("listUsers returns a page of users without sensitive columns", async () => {
    const admin = await createTestUser({ isAdmin: true });
    const page = await callerFor(admin).admin.listUsers({
      search: admin.email,
    });

    expect(page).toMatchObject({ total: 1, page: 1, pageCount: 1 });
    const [self] = page.items;
    expect(self).toMatchObject({ id: admin.id, isAdmin: true });
    expect(Object.keys(self ?? {}).toSorted()).toEqual(
      ["createdAt", "email", "id", "image", "isAdmin", "name"].toSorted(),
    );
  });

  it("listUsers searches, sorts and pages on the server", async () => {
    const tag = `pager-${randomUUID().slice(0, 8)}`;
    const admin = await createTestUser({ isAdmin: true });
    for (const name of ["Carol", "Alice", "Bob"]) {
      await createTestUser({ name: `${tag} ${name}` });
    }
    const api = callerFor(admin).admin;
    const query = {
      search: tag,
      sort: "name",
      dir: "asc",
      pageSize: 2,
    } as const;

    const first = await api.listUsers(query);
    expect(first.items.map((u) => u.name)).toEqual([
      `${tag} Alice`,
      `${tag} Bob`,
    ]);
    expect(first).toMatchObject({ total: 3, pageCount: 2, nextCursor: 2 });

    const second = await api.listUsers({ ...query, page: 2 });
    expect(second.items.map((u) => u.name)).toEqual([`${tag} Carol`]);
    expect(second.nextCursor).toBeNull();

    // The infinite-query cursor (mobile) selects the same page.
    await expect(api.listUsers({ ...query, cursor: 2 })).resolves.toEqual(
      second,
    );
    // Search is case-insensitive and matches literally (no LIKE wildcards).
    await expect(
      api.listUsers({ search: tag.toUpperCase() }),
    ).resolves.toMatchObject({ total: 3 });
    await expect(
      api.listUsers({ search: `${tag.slice(0, 5)}%` }),
    ).resolves.toMatchObject({ total: 0, items: [] });
  });

  it("listUsers is BAD_REQUEST for an oversized page or unknown sort", async () => {
    const admin = await createTestUser({ isAdmin: true });
    const api = callerFor(admin).admin;
    await expect(api.listUsers({ pageSize: 1000 })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(
      // @ts-expect-error — not a sortable column
      api.listUsers({ sort: "password" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
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
