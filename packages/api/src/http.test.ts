import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { afterAll, describe, expect, it } from "vitest";

import type { Auth } from "@example-app/auth";

import { appRouter } from "./root";
import { cleanupTestUsers, createTestUser } from "./test/helpers";
import { createTRPCContext } from "./trpc";

/** Stand-in for Better Auth: only `api.getSession` is used by the context. */
function fakeAuth(session: unknown): Auth {
  return { api: { getSession: () => Promise.resolve(session) } } as Auth;
}

/** Queries go over GET (`?input=`), mutations over POST — as the clients do. */
async function call(
  type: "query" | "mutation",
  path: string,
  input: unknown,
  auth: Auth,
) {
  const payload = JSON.stringify({ json: input });
  const req =
    type === "query"
      ? new Request(
          `http://localhost/api/trpc/${path}?input=${encodeURIComponent(payload)}`,
        )
      : new Request(`http://localhost/api/trpc/${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
        });
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: ({ req: request }) =>
      createTRPCContext({ headers: request.headers, auth }),
  });
  return {
    status: response.status,
    body: (await response.json()) as {
      error?: { json: { data: { code: string; zodError: unknown } } };
    },
  };
}

/** The HTTP contract clients rely on (status codes, error shape). */
describe("tRPC over HTTP", () => {
  afterAll(cleanupTestUsers);

  it("resolves the session through Better Auth and rejects anonymous callers", async () => {
    const { status, body } = await call(
      "query",
      "auth.getProfile",
      null,
      fakeAuth(null),
    );
    expect(status).toBe(401);
    expect(body.error?.json.data.code).toBe("UNAUTHORIZED");
  });

  it("returns field-level zodError details for invalid input", async () => {
    const admin = await createTestUser({ isAdmin: true });
    const { status, body } = await call(
      "mutation",
      "admin.deleteUser",
      { userId: "" },
      fakeAuth({ user: admin, session: { userId: admin.id } }),
    );
    expect(status).toBe(400);
    expect(body.error?.json.data.zodError).toMatchObject({
      fieldErrors: { userId: expect.any(Array) as unknown },
    });
  });
});
