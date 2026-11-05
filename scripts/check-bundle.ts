#!/usr/bin/env node
/**
 * Bundle budget gate for the Next.js app (`pnpm check:bundle`; runs in CI).
 *
 * Runs Turbopack's analyzer (`next analyze --output`), exports its module
 * graph (`next analyze export`) and sums the compressed size of the JS each
 * route loads up front — the bootstrap + render-dependent chunk groups, not
 * lazily loaded ones. Fails if any route exceeds its budget in
 * apps/nextjs/bundle-budget.json.
 *
 * When it fails: run the `next-bundle-optimizer` agent skill to find what got
 * pulled into the initial load (and how to defer it) before raising a budget.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "../apps/nextjs");

interface Budget {
  defaultKb: number;
  routes: Record<string, number>;
}
type GraphRecord =
  | { type: "group"; route: string; kind: string; outputs: string[] }
  | {
      type: "part";
      route: string;
      filename: string;
      compressed_size: number;
    }
  | { type: "meta" | "module" | "route" | "output" };

const budget = JSON.parse(
  readFileSync(join(appDir, "bundle-budget.json"), "utf8"),
) as Budget;

console.log("▶ Analyzing the production bundle (next analyze)…");
execFileSync(
  "pnpm",
  ["with-env", "next", "analyze", "--output", "--snapshot", "budget-check"],
  {
    cwd: appDir,
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, SKIP_ENV_VALIDATION: "1" },
  },
);
const graph = execFileSync(
  "pnpm",
  ["exec", "next", "analyze", "export", "--snapshot", "budget-check"],
  { cwd: appDir, encoding: "utf8", maxBuffer: 512 * 1024 * 1024 },
);

// Initial client chunks per route, then their compressed size.
const initialChunks = new Map<string, Set<string>>();
const records = graph
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line) as GraphRecord);
for (const record of records) {
  if (record.type !== "group" || record.kind === "async") continue;
  const chunks = initialChunks.get(record.route) ?? new Set<string>();
  for (const output of record.outputs) {
    if (output.startsWith("[client-fs]") && output.endsWith(".js")) {
      chunks.add(output);
    }
  }
  initialChunks.set(record.route, chunks);
}
const routeBytes = new Map<string, number>();
for (const record of records) {
  if (record.type !== "part") continue;
  if (!initialChunks.get(record.route)?.has(record.filename)) continue;
  routeBytes.set(
    record.route,
    (routeBytes.get(record.route) ?? 0) + record.compressed_size,
  );
}

let failed = false;
console.log("\n  Route                 Initial JS     Budget");
for (const [route, bytes] of [...routeBytes].toSorted(([a], [b]) =>
  a.localeCompare(b),
)) {
  const kb = bytes / 1024;
  const limit = budget.routes[route] ?? budget.defaultKb;
  const over = kb > limit;
  failed ||= over;
  console.log(
    `${over ? "✗" : "✓"} ${route.padEnd(20)} ${kb.toFixed(1).padStart(8)} KB  ${String(limit).padStart(6)} KB${budget.routes[route] === undefined ? " (default)" : ""}`,
  );
}

if (routeBytes.size === 0) {
  console.error(
    "\n✗ The analyzer reported no client routes — check the build.",
  );
  process.exit(1);
}
if (failed) {
  console.error(
    "\n✗ Over budget. Run the next-bundle-optimizer skill to find what entered the initial load and defer it; only raise a budget (apps/nextjs/bundle-budget.json) with a reason in the PR.",
  );
  process.exit(1);
}
console.log("\n✓ All routes within budget.");
