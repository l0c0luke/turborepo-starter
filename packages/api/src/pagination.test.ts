import { describe, expect, it } from "vitest";

import { user } from "@example-app/db/schema";

import { likePattern, paginate, searchAny } from "./pagination";

const input = {
  page: 2,
  pageSize: 10,
  search: "",
  sort: "name",
  dir: "asc",
} as const;

describe("paginate", () => {
  it("asks for the right slice and shapes the page", async () => {
    const calls: [number, number][] = [];
    const page = await paginate(input, {
      rows: (limit, offset) => {
        calls.push([limit, offset]);
        return Promise.resolve(["k", "l"]);
      },
      count: () => Promise.resolve(25),
    });
    expect(calls).toEqual([[10, 10]]);
    expect(page).toEqual({
      items: ["k", "l"],
      total: 25,
      page: 2,
      pageSize: 10,
      pageCount: 3,
      nextCursor: 3,
    });
  });

  it("prefers the infinite-query cursor and ends with a null cursor", async () => {
    const page = await paginate(
      { ...input, cursor: 3 },
      { rows: () => Promise.resolve([]), count: () => Promise.resolve(25) },
    );
    expect(page).toMatchObject({ page: 3, nextCursor: null });
  });

  it("reports one page for an empty result", async () => {
    const page = await paginate(
      { ...input, page: 1 },
      { rows: () => Promise.resolve([]), count: () => Promise.resolve(0) },
    );
    expect(page).toMatchObject({ total: 0, pageCount: 1, nextCursor: null });
  });
});

describe("search helpers", () => {
  it("escapes LIKE wildcards", () => {
    expect(likePattern("50%_a\\b")).toBe("%50\\%\\_a\\\\b%");
  });

  it("returns no filter for an empty term", () => {
    expect(searchAny("", [user.name])).toBeUndefined();
    expect(searchAny("ada", [user.name, user.email])).toBeDefined();
  });
});
