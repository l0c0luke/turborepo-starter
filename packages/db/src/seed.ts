/**
 * Database seed — deterministic development data.
 *
 * Creates a known admin you can sign into immediately. In development, magic
 * links / OTP codes are delivered to MailHog at http://localhost:8025, so you
 * can request a sign-in link for `admin@example.com` and land straight on
 * `/admin`.
 *
 * Idempotent and non-destructive: each seed user is inserted only if no user
 * with that email exists yet, and nothing is ever deleted — so it is safe to
 * re-run, including against a database that already holds real data.
 *
 * Edit `SEED_USERS` (and add inserts for your own tables) for your app.
 *
 * Usage:
 *   pnpm seed
 */

import { eq } from "drizzle-orm";

import { db } from "./client";
import { user } from "./schema";

const ADMIN_EMAIL = "admin@example.com";

const SEED_USERS = [
  {
    id: "seed-admin",
    name: "Admin User",
    email: ADMIN_EMAIL,
    emailVerified: true,
    isAdmin: true,
  },
  {
    id: "seed-user-1",
    name: "Alex Example",
    email: "alex@example.com",
    emailVerified: true,
    isAdmin: false,
  },
  {
    id: "seed-user-2",
    name: "Sam Example",
    email: "sam@example.com",
    emailVerified: true,
    isAdmin: false,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  const now = new Date();
  let created = 0;

  // Upsert (check-then-insert): existing users are left untouched, so this
  // never destroys data.
  for (const seedUser of SEED_USERS) {
    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, seedUser.email))
      .limit(1);

    if (existing.length === 0) {
      await db
        .insert(user)
        .values({ ...seedUser, createdAt: now, updatedAt: now });
      created += 1;
    }
  }

  console.log(
    `✅ Seeded ${created} users (${SEED_USERS.length - created} already existed).`,
  );
  console.log(`   Sign in as ${ADMIN_EMAIL} to reach /admin.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
