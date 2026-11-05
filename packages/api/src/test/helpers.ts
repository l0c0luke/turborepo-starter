import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";

import type { Session } from "@example-app/auth";
import { db } from "@example-app/db/client";
import { user } from "@example-app/db/schema";

import { appRouter } from "../root";
import { createCallerFactory } from "../trpc";

const createCaller = createCallerFactory(appRouter);

type TestUser = Session["user"];

const createdUserIds: string[] = [];

/** Insert a real user row (cleaned up by `cleanupTestUsers`). */
export async function createTestUser(
  overrides: Partial<Pick<TestUser, "name" | "isAdmin">> = {},
): Promise<TestUser> {
  const id = `test-${randomUUID()}`;
  const now = new Date();
  const [row] = await db
    .insert(user)
    .values({
      id,
      name: overrides.name ?? "Test User",
      email: `${id}@test.example.com`,
      emailVerified: true,
      isAdmin: overrides.isAdmin ?? false,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("Failed to insert test user");
  createdUserIds.push(id);
  return row;
}

export async function cleanupTestUsers(): Promise<void> {
  if (createdUserIds.length === 0) return;
  await db.delete(user).where(inArray(user.id, createdUserIds));
  createdUserIds.length = 0;
}

function sessionFor(testUser: TestUser): Session {
  const now = new Date();
  return {
    user: testUser,
    session: {
      id: `session-${testUser.id}`,
      token: `token-${testUser.id}`,
      userId: testUser.id,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
      ipAddress: null,
      userAgent: null,
    },
  };
}

/** A tRPC caller as an anonymous visitor, or signed in as `asUser`. */
export function callerFor(asUser?: TestUser) {
  return createCaller({
    db,
    session: asUser ? sessionFor(asUser) : null,
  });
}
