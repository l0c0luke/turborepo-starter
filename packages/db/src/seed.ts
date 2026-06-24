/**
 * Database seed — deterministic development data.
 *
 * Creates a known admin you can sign into immediately. In development, magic
 * links / OTP codes are delivered to MailHog at http://localhost:8025, so you
 * can request a sign-in link for `admin@example.com` and land straight on
 * `/admin`. Re-running clears and recreates these users (idempotent).
 *
 * Edit `SEED_USERS` (and add inserts for your own tables) for your app.
 *
 * Usage:
 *   pnpm seed
 *
 * ⚠️  This clears the `user` table — never run it against production data.
 */

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

  // Clear existing users so re-running is idempotent (dev only).
  await db.delete(user);

  const now = new Date();
  await db
    .insert(user)
    .values(SEED_USERS.map((u) => ({ ...u, createdAt: now, updatedAt: now })));

  console.log(`✅ Seeded ${SEED_USERS.length} users.`);
  console.log(`   Sign in as ${ADMIN_EMAIL} to reach /admin.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
