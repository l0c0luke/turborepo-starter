import { describe, expect, it } from "vitest";

import { deleteUserSchema, setUserAdminSchema } from "./index";

describe("setUserAdminSchema", () => {
  it("accepts a user id and a boolean flag", () => {
    expect(
      setUserAdminSchema.parse({ userId: "user-1", isAdmin: true }),
    ).toEqual({ userId: "user-1", isAdmin: true });
  });

  it("rejects an empty user id", () => {
    expect(
      setUserAdminSchema.safeParse({ userId: "", isAdmin: true }).success,
    ).toBe(false);
  });

  it("rejects a non-boolean flag", () => {
    expect(
      setUserAdminSchema.safeParse({ userId: "user-1", isAdmin: "yes" })
        .success,
    ).toBe(false);
  });
});

describe("deleteUserSchema", () => {
  it("accepts a user id", () => {
    expect(deleteUserSchema.parse({ userId: "user-1" })).toEqual({
      userId: "user-1",
    });
  });

  it("rejects a missing or empty user id", () => {
    expect(deleteUserSchema.safeParse({}).success).toBe(false);
    expect(deleteUserSchema.safeParse({ userId: "" }).success).toBe(false);
  });
});
