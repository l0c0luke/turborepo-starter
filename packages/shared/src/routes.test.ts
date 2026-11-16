import { describe, expect, it } from "vitest";

import { findRoute, matchesRoute } from "./routes";

describe("matchesRoute", () => {
  it("matches static, dynamic and catch-all segments exactly", () => {
    expect(matchesRoute("/", "/")).toBe(true);
    expect(matchesRoute("/admin", "/admin")).toBe(true);
    expect(matchesRoute("/admin", "/admin/")).toBe(true);
    expect(matchesRoute("/users/[id]", "/users/42")).toBe(true);
    expect(matchesRoute("/docs/[...slug]", "/docs/a/b")).toBe(true);
    expect(matchesRoute("/caf%C3%A9", "/caf%C3%A9")).toBe(false);
    expect(matchesRoute("/café", "/caf%C3%A9")).toBe(true);
  });

  it("rejects ancestors, descendants and different paths", () => {
    expect(matchesRoute("/admin", "/")).toBe(false);
    expect(matchesRoute("/admin", "/admin/users")).toBe(false);
    expect(matchesRoute("/admin", "/administrator")).toBe(false);
    expect(matchesRoute("/users/[id]", "/users")).toBe(false);
    expect(matchesRoute("/docs/[...slug]", "/docs")).toBe(false);
  });
});

describe("findRoute", () => {
  const routes = [
    { href: "/", key: "home" },
    { href: "/admin", key: "admin" },
    { href: "/users/[id]", key: "user" },
  ];

  it("prefers the exact route, then the closest ancestor", () => {
    expect(findRoute(routes, "/admin")?.key).toBe("admin");
    expect(findRoute(routes, "/admin/settings")?.key).toBe("admin");
    expect(findRoute(routes, "/users/42")?.key).toBe("user");
    expect(findRoute(routes, "/somewhere/else")?.key).toBe("home");
  });

  it("returns undefined when nothing matches", () => {
    expect(findRoute([{ href: "/admin" }], "/login")).toBeUndefined();
  });
});
