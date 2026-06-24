#!/usr/bin/env node
/**
 * One-command project bootstrap.
 *
 *   pnpm install && pnpm setup
 *
 * Creates .env (from .env.example), starts Postgres + MailHog via Docker,
 * waits for the database, pushes the schema, and seeds dev data. Idempotent —
 * safe to re-run.
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd) => execSync(cmd, { stdio: "inherit", cwd: root });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 1. Environment file
if (existsSync(join(root, ".env"))) {
  console.log("• .env already exists — leaving it untouched");
} else {
  copyFileSync(join(root, ".env.example"), join(root, ".env"));
  console.log("✓ Created .env from .env.example");
}

// 2. Local services
console.log("\n▶ Starting Postgres + MailHog (docker compose up -d)...");
run("docker compose up -d");

// 3. Wait for Postgres to accept connections
process.stdout.write("\n▶ Waiting for Postgres");
let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    execSync("docker compose exec -T postgres pg_isready -U example", {
      stdio: "ignore",
      cwd: root,
    });
    ready = true;
    break;
  } catch {
    process.stdout.write(".");
    await sleep(1000);
  }
}
console.log("");
if (!ready) {
  console.error("✗ Postgres did not become ready in time.");
  process.exit(1);
}
console.log("✓ Postgres is ready");

// 4. Schema + seed
console.log("\n▶ Pushing database schema (pnpm db:push)...");
run("pnpm db:push");
console.log("\n▶ Seeding the database...");
run("pnpm -F @example-app/db seed");

console.log(
  "\n✅ Setup complete.\n" +
    "   Run `pnpm dev`, open http://localhost:3000, and sign in as\n" +
    "   admin@example.com — the magic link appears in MailHog at\n" +
    "   http://localhost:8025.",
);
