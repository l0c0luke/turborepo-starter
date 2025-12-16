/**
 * Database Seeding Script for Example App
 *
 * This script generates test data for development purposes.
 * Customize this file to seed your own tables.
 *
 * Usage:
 *   pnpm seed - Run the seed script
 *
 * ⚠️  WARNING: This script may clear existing data!
 */

import { faker } from "@faker-js/faker";

import { db } from "./client";
import { user } from "./schema";

// Configuration for seed data
const SEED_CONFIG = {
  users: 5,
};

/**
 * Main seed function
 */
async function seed() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data (be careful in production!)
  console.log("🗑️  Clearing existing data...");
  await db.delete(user);

  // Seed users
  console.log(`\n👤 Creating ${SEED_CONFIG.users} users...`);
  const users = await seedUsers(SEED_CONFIG.users);
  console.log(`   ✓ Created ${users.length} users`);

  console.log("\n✅ Seed completed successfully!");
  console.log(`   Total users: ${users.length}`);

  process.exit(0);
}

/**
 * Seed users with realistic data
 */
async function seedUsers(count: number) {
  const usersData = Array.from({ length: count }, () => ({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    emailVerified: faker.datatype.boolean(),
    image: faker.image.avatar(),
    yearOfBirth: faker.number.int({ min: 1960, max: 2005 }),
    isAdmin: false,
    createdAt: faker.date.past(),
    updatedAt: new Date(),
  }));

  // Add an admin user
  usersData.push({
    id: faker.string.uuid(),
    name: "Admin User",
    email: "admin@example.com",
    emailVerified: true,
    image: faker.image.avatar(),
    yearOfBirth: 1990,
    isAdmin: true,
    createdAt: faker.date.past(),
    updatedAt: new Date(),
  });

  const insertedUsers = await db.insert(user).values(usersData).returning();
  return insertedUsers;
}

// Run the seed
seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
