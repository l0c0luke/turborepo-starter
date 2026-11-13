#!/usr/bin/env node
/**
 * Terraform gate (`pnpm check:infra`; part of `pnpm check`, and the CI
 * `infra` job). AGENTS.md → Infrastructure.
 *
 * Does nothing until the repo has Terraform under infra/. Then, in order:
 *   1. terraform fmt -check       (formatting)
 *   2. terraform init + validate  (every root module in infra/envs/*, every
 *                                  module in infra/modules/*; no backend, so
 *                                  no cloud credentials needed)
 *   3. terraform test             (every module — tests use mock providers)
 *   4. tflint                     (provider-aware lint; infra/.tflint.hcl)
 *   5. trivy config               (misconfigurations: HIGH/CRITICAL fail)
 *
 * Locally a missing tool is a warning (CI installs pinned versions); in CI
 * it is a failure. Structure rules (layout, backends, lock files, no other
 * IaC tools) live in scripts/check-conventions.ts (rule `terraform`).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const infra = join(root, "infra");
const inCi = process.env.CI === "true";

// In a git pathspec `*` also matches `/`, so this finds infra/envs/*/… and
// infra/modules/*/… files too.
const tfFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "infra/*.tf"],
  { cwd: root, encoding: "utf8" },
)
  .split("\n")
  .filter(Boolean);
if (tfFiles.length === 0) {
  console.log("✓ No Terraform under infra/ — nothing to check.");
  process.exit(0);
}

const has = (tool: string) =>
  spawnSync(tool, ["--version"], { stdio: "ignore" }).status === 0;
const missing: string[] = [];
const failures: string[] = [];

/** Runs a step, streaming its output; records a failure instead of throwing. */
function step(label: string, tool: string, args: string[], cwd = root): void {
  console.log(`\n▸ ${label}`);
  const result = spawnSync(tool, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) failures.push(label);
}

/** Module directories (containing .tf files) under infra/<group>/. */
const modulesIn = (group: string): string[] => {
  const base = join(infra, group);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `infra/${group}/${entry.name}`)
    .filter((dir) => tfFiles.some((file) => file.startsWith(`${dir}/`)));
};

if (has("terraform")) {
  step("terraform fmt", "terraform", [
    "fmt",
    "-check",
    "-recursive",
    "-diff",
    "infra",
  ]);
  for (const dir of modulesIn("envs")) {
    // Root modules commit .terraform.lock.hcl; CI must not rewrite it.
    step(`init ${dir}`, "terraform", [
      `-chdir=${dir}`,
      "init",
      "-backend=false",
      "-input=false",
      "-lockfile=readonly",
    ]);
    step(`validate ${dir}`, "terraform", [`-chdir=${dir}`, "validate"]);
  }
  for (const dir of modulesIn("modules")) {
    step(`init ${dir}`, "terraform", [
      `-chdir=${dir}`,
      "init",
      "-backend=false",
      "-input=false",
    ]);
    step(`validate ${dir}`, "terraform", [`-chdir=${dir}`, "validate"]);
    if (existsSync(join(root, dir, "tests"))) {
      step(`test ${dir}`, "terraform", [`-chdir=${dir}`, "test"]);
    }
  }
} else {
  missing.push("terraform");
}

if (has("tflint")) {
  const config = existsSync(join(infra, ".tflint.hcl"))
    ? [`--config=${join(infra, ".tflint.hcl")}`]
    : [];
  step("tflint --init", "tflint", ["--init", ...config], infra);
  step("tflint", "tflint", ["--recursive", ...config], infra);
} else {
  missing.push("tflint");
}

if (has("trivy")) {
  step("trivy config (HIGH/CRITICAL)", "trivy", [
    "config",
    "--exit-code=1",
    "--severity=HIGH,CRITICAL",
    "--skip-dirs=**/.terraform",
    "infra",
  ]);
} else {
  missing.push("trivy");
}

if (missing.length > 0) {
  const message = `not installed: ${missing.join(", ")} (install them — DEPLOY.md → Infrastructure)`;
  if (inCi) failures.push(message);
  else console.warn(`\n⚠ Skipped steps — ${message}. CI runs them.`);
}

if (failures.length > 0) {
  console.error(
    `\n✗ Infrastructure checks failed:\n${failures.map((f) => `  - ${f}`).join("\n")}`,
  );
  process.exit(1);
}
console.log("\n✓ Infrastructure checks passed.");
