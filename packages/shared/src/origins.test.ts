import { describe, expect, it } from "vitest";

import { matchAllowedOrigin, parseOriginList } from "./origins";

describe("parseOriginList", () => {
  it("returns an empty list when unset or blank", () => {
    expect(parseOriginList(undefined)).toEqual([]);
    expect(parseOriginList(null)).toEqual([]);
    expect(parseOriginList("")).toEqual([]);
    expect(parseOriginList(" , ,")).toEqual([]);
  });

  it("splits, trims and de-duplicates", () => {
    expect(
      parseOriginList(
        " https://a.example.com ,https://b.example.com,https://a.example.com",
      ),
    ).toEqual(["https://a.example.com", "https://b.example.com"]);
  });

  it("strips a bare trailing slash from http(s) origins only", () => {
    expect(
      parseOriginList("https://a.example.com/,http://localhost:8081/"),
    ).toEqual(["https://a.example.com", "http://localhost:8081"]);
    expect(parseOriginList("myapp://,https://*.example.com")).toEqual([
      "myapp://",
      "https://*.example.com",
    ]);
  });
});

describe("matchAllowedOrigin", () => {
  const allowed = ["https://app.example.com", "http://localhost:8081"];

  it("echoes an allowed origin", () => {
    expect(matchAllowedOrigin("https://app.example.com", allowed)).toBe(
      "https://app.example.com",
    );
  });

  it("rejects missing, unknown and look-alike origins", () => {
    expect(matchAllowedOrigin(null, allowed)).toBeNull();
    expect(matchAllowedOrigin(undefined, allowed)).toBeNull();
    expect(matchAllowedOrigin("https://evil.example.com", allowed)).toBeNull();
    expect(
      matchAllowedOrigin("https://app.example.com.evil.com", allowed),
    ).toBeNull();
    expect(matchAllowedOrigin("http://app.example.com", allowed)).toBeNull();
  });
});
