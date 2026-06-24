import { describe, expect, it } from "vitest";

import { parseError } from "./parse-error";

describe("parseError", () => {
  it("returns a string as-is", () => {
    expect(parseError("boom")).toBe("boom");
  });

  it("reads the message from an Error", () => {
    expect(parseError(new Error("kaboom"))).toBe("kaboom");
  });

  it("reads a message property from a plain object", () => {
    expect(parseError({ message: "nope" })).toBe("nope");
  });

  it("falls back for unknown values", () => {
    expect(parseError(undefined)).toBe("An unknown error occurred");
    expect(parseError(42)).toBe("An unknown error occurred");
  });
});
