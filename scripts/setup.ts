#!/usr/bin/env node
/**
 * One-command project bootstrap:
 *
 *   pnpm install && pnpm setup
 *
 * 1. Creates .env from .env.example (and a random AUTH_SECRET).
 * 2. Starts Postgres, Mailpit and Bugsink and waits for their healthchecks.
 * 3. Applies the committed migrations and seeds a dev admin.
 * 4. Provisions Bugsink (team + web/mobile projects), writes the DSNs into
 *    .env, and sends a test event so you can see error tracking working.
 *
 * Idempotent: safe to re-run at any time. Values you've already set in .env
 * are never overwritten.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

const BUGSINK_URL = "http://localhost:8000";
const MAILPIT_URL = "http://localhost:8025";
const WEB_URL = "http://localhost:3000";
const ADMIN_EMAIL = "admin@example.com";

// --- output helpers ----------------------------------------------------------
const color = (code: number) => (text: string) =>
  process.stdout.isTTY ? `\u001B[${code}m${text}\u001B[0m` : text;
const green = color(32);
const red = color(31);
const dim = color(2);
const bold = color(1);

const step = (title: string) => console.log(`\n${bold("▶")} ${title}`);
const ok = (message: string) => console.log(`  ${green("✓")} ${message}`);
const info = (message: string) => console.log(`  ${dim("•")} ${message}`);
// A function declaration (not an arrow) so `never` narrows at call sites.
function fail(message: string, hint?: string): never {
  console.error(`\n${red("✗")} ${message}`);
  if (hint) console.error(`  ${hint}`);
  process.exit(1);
}

const run = (command: string, args: string[]) => {
  const result = spawnSync(command, args, { stdio: "inherit", cwd: root });
  if (result.status !== 0) {
    fail(`\`${[command, ...args].join(" ")}\` failed.`);
  }
};

// --- .env helpers ------------------------------------------------------------
/**
 * Current value of KEY in .env, or undefined when absent/commented/empty.
 * Handles `KEY=value`, `KEY="value"` and trailing `# comments`.
 */
const readEnv = (key: string): string | undefined => {
  const match = new RegExp(`^${key}=\\s*(?:"([^"]*)"|([^\\s#]*))`, "m").exec(
    readFileSync(envPath, "utf8"),
  );
  const value = match?.[1] ?? match?.[2];
  return value === "" ? undefined : value;
};

/** Set KEY in .env unless it already has a value. Returns true if written. */
const setEnvIfEmpty = (key: string, value: string): boolean => {
  if (readEnv(key) !== undefined) return false;
  const content = readFileSync(envPath, "utf8");
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^#?\\s*${key}=.*$`, "m");
  writeFileSync(
    envPath,
    pattern.test(content)
      ? content.replace(pattern, line)
      : `${content.trimEnd()}\n${line}\n`,
  );
  return true;
};

// --- 0. Prerequisites --------------------------------------------------------
step("Checking prerequisites");
try {
  execFileSync("docker", ["info"], { stdio: "ignore" });
  ok("Docker is running");
} catch {
  fail(
    "Docker is not running (or not installed).",
    "Start Docker Desktop / the Docker daemon, then re-run `pnpm setup`.",
  );
}

// --- 1. Environment file -----------------------------------------------------
step("Environment (.env)");
if (existsSync(envPath)) {
  info(".env already exists — only filling in values that are still empty");
} else {
  copyFileSync(join(root, ".env.example"), envPath);
  ok("Created .env from .env.example");
}
if (setEnvIfEmpty("AUTH_SECRET", randomBytes(32).toString("base64"))) {
  ok("Generated a random AUTH_SECRET");
}

// --- 2. Local services -------------------------------------------------------
step("Starting Postgres, Mailpit and Bugsink (docker compose)");
run("docker", ["compose", "up", "--detach", "--wait", "--wait-timeout", "180"]);
ok("All services are healthy");

// --- 3. Database ---------------------------------------------------------------
step("Database");
run("pnpm", ["db:migrate"]);
ok("Migrations applied");
run("pnpm", ["-F", "@example-app/db", "seed"]);
ok("Dev data seeded");

// --- 4. Error tracking (Bugsink) ---------------------------------------------
step("Error tracking (Bugsink)");
const provision = spawnSync(
  "docker",
  ["compose", "exec", "-T", "bugsink", "bugsink-manage", "shell"],
  {
    cwd: root,
    input: readFileSync(join(root, "scripts/bugsink-provision.py")),
    encoding: "utf8",
  },
);
if (provision.status !== 0) {
  fail("Could not provision Bugsink.", provision.stderr);
}
const dsns = new Map<string, string>();
for (const line of provision.stdout.split("\n")) {
  const [, slug, dsn] = /^([\w-]+)=(https?:\/\/\S+)$/.exec(line.trim()) ?? [];
  if (slug && dsn) dsns.set(slug, dsn);
}
const webDsn = dsns.get("example-app-web");
const mobileDsn = dsns.get("example-app-mobile");
if (!webDsn || !mobileDsn) {
  fail("Bugsink did not return DSNs.", provision.stdout);
}
ok("Projects ready: example-app-web, example-app-mobile");
if (setEnvIfEmpty("NEXT_PUBLIC_SENTRY_DSN", webDsn)) {
  ok("Wrote NEXT_PUBLIC_SENTRY_DSN (web) to .env");
}
if (setEnvIfEmpty("EXPO_PUBLIC_SENTRY_DSN", mobileDsn)) {
  ok("Wrote EXPO_PUBLIC_SENTRY_DSN (mobile) to .env");
}

// Prove the pipeline end to end: send one event through the web DSN.
const { username: publicKey, pathname } = new URL(webDsn);
const projectId = pathname.replace("/", "");
const eventId = randomUUID().replaceAll("-", "");
const envelope = [
  JSON.stringify({ event_id: eventId, dsn: webDsn }),
  JSON.stringify({ type: "event" }),
  JSON.stringify({
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: "info",
    message: { formatted: "Setup check: Bugsink is receiving events" },
    tags: { source: "pnpm-setup" },
  }),
].join("\n");
const response = await fetch(`${BUGSINK_URL}/api/${projectId}/envelope/`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-sentry-envelope",
    "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=pnpm-setup/1.0`,
  },
  body: envelope,
}).catch(() => undefined);
if (response?.ok) {
  ok("Test event accepted — it's waiting for you in Bugsink");
} else {
  info("Could not send a test event (Bugsink still starting?) — not fatal");
}

// --- Done ----------------------------------------------------------------------
console.log(`
${green(bold("✅ Setup complete."))} Run ${bold("pnpm dev")}, then:

  ${bold("App")}       ${WEB_URL}   sign in as ${ADMIN_EMAIL}
  ${bold("Email")}     ${MAILPIT_URL}   magic links + OTP codes land here
  ${bold("Errors")}    ${BUGSINK_URL}   Bugsink — ${ADMIN_EMAIL} / admin
  ${bold("Database")}  pnpm db:studio

  Before you push: ${bold("pnpm check")} runs every gate CI runs.
`);
