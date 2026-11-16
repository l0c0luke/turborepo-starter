import { describe, expect, it } from "vitest";

import {
  DEFAULT_PAGE_SIZE,
  listInputFromSearchParams,
  listInputToSearchParams,
  listQuerySchema,
  MAX_PAGE_SIZE,
} from "./list";

const schema = listQuerySchema(["createdAt", "name"]);
/** Minimal URLSearchParams stand-in (this package has no DOM/Node types). */
const urlParams = (query: string) => {
  const entries = new Map(
    query.split("&").map((pair) => pair.split("=") as [string, string]),
  );
  return { get: (name: string) => entries.get(name) ?? null };
};
const defaults = schema.parse({});

describe("listQuerySchema", () => {
  it("fills defaults: first page, default size, no search, first sort column, desc", () => {
    expect(defaults).toEqual({
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      search: "",
      sort: "createdAt",
      dir: "desc",
    });
  });

  it("honours a default direction", () => {
    expect(listQuerySchema(["name"], { dir: "asc" }).parse({}).dir).toBe("asc");
  });

  it("trims the search term", () => {
    expect(schema.parse({ search: "  ada  " }).search).toBe("ada");
  });

  it("rejects pages above the max size, page 0, and unknown sort columns", () => {
    expect(schema.safeParse({ pageSize: MAX_PAGE_SIZE + 1 }).success).toBe(
      false,
    );
    expect(schema.safeParse({ page: 0 }).success).toBe(false);
    expect(schema.safeParse({ sort: "password" }).success).toBe(false);
    expect(schema.safeParse({ search: "x".repeat(201) }).success).toBe(false);
  });
});

describe("listInputFromSearchParams", () => {
  it("reads URLSearchParams-like objects and Next.js searchParams records alike", () => {
    const expected = { ...defaults, page: 3, search: "ada", sort: "name" };
    expect(
      listInputFromSearchParams(
        schema,
        urlParams("page=3&search=ada&sort=name"),
      ),
    ).toEqual(expected);
    expect(
      listInputFromSearchParams(schema, {
        page: "3",
        search: ["ada", "ignored"],
        sort: "name",
      }),
    ).toEqual(expected);
  });

  it("falls back to defaults for invalid values but keeps the valid ones", () => {
    expect(
      listInputFromSearchParams(
        schema,
        urlParams("page=abc&pageSize=5000&sort=password&search=ada"),
      ),
    ).toEqual({ ...defaults, search: "ada" });
  });
});

describe("listInputToSearchParams", () => {
  it("writes only non-default values and round-trips", () => {
    const input = { ...defaults, page: 2, dir: "asc" as const };
    const params = listInputToSearchParams(input, defaults);
    expect(params).toEqual({ page: "2", dir: "asc" });
    expect(listInputFromSearchParams(schema, params)).toEqual(input);
    expect(listInputToSearchParams(defaults, defaults)).toEqual({});
  });
});
