#!/usr/bin/env node
/**
 * Repo conventions gate (`pnpm check:conventions`; runs in CI and pre-push).
 *
 * Mechanically enforces the rules AGENTS.md states, so the agent docs can't
 * drift from what the repo actually does. Each rule names the AGENTS.md
 * section it backs. To exempt a single file from a file-level rule, add a
 * comment with the rule id and a reason, e.g.:
 *
 *   // conventions-ignore: mutation-feedback — fire-and-forget analytics ping
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const exists = (path: string) => existsSync(join(root, path));

/** Tracked + untracked-but-not-ignored files, repo-relative. */
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { cwd: root, encoding: "utf8" },
)
  .split("\n")
  .filter((file) => file && exists(file));

const failures: string[] = [];
const fail = (rule: string, message: string) =>
  failures.push(`[${rule}] ${message}`);
/** Source without comments, so rule checks don't match code in docs. */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const ignored = (source: string, rule: string) =>
  new RegExp(`conventions-ignore:\\s*${rule}\\b`).test(source);

// --- pnpm only (AGENTS.md → Conventions → Package manager) -------------------
for (const file of files) {
  if (
    /(^|\/)(package-lock\.json|yarn\.lock|bun\.lockb?|npm-shrinkwrap\.json)$/.test(
      file,
    )
  ) {
    fail("pnpm-only", `${file}: only pnpm-lock.yaml is allowed`);
  }
}
const forbiddenRunner = /(^|[\s;&|(`"'])(npm|npx|yarn|bunx?)\s/;
const commandFiles = files.filter(
  (file) =>
    /(^|\/)package\.json$/.test(file) ||
    /^\.github\/(workflows|actions)\/.*\.ya?ml$/.test(file) ||
    /^tooling\/github\/.*\.ya?ml$/.test(file) ||
    /(^|\/)Dockerfile$/.test(file) ||
    file === "lefthook.yml",
);
for (const file of commandFiles) {
  const source = read(file);
  if (file.endsWith("package.json")) {
    const scripts = (JSON.parse(source) as { scripts?: Record<string, string> })
      .scripts;
    for (const [name, command] of Object.entries(scripts ?? {})) {
      if (forbiddenRunner.test(` ${command}`)) {
        fail(
          "pnpm-only",
          `${file} script "${name}" runs npm/npx/yarn/bun: ${command}`,
        );
      }
    }
  } else {
    source.split("\n").forEach((line, index) => {
      if (!line.trim().startsWith("#") && forbiddenRunner.test(` ${line}`)) {
        fail("pnpm-only", `${file}:${index + 1} runs npm/npx/yarn/bun`);
      }
    });
  }
}

// --- One version per dependency (AGENTS.md → Conventions → Package manager) --
if (!/^catalogMode:\s*strict\s*$/m.test(read("pnpm-workspace.yaml"))) {
  fail("catalog", "pnpm-workspace.yaml must set `catalogMode: strict`");
}
for (const file of files.filter((f) => /(^|\/)package\.json$/.test(f))) {
  const manifest = JSON.parse(read(file)) as Record<string, unknown>;
  // peerDependencies are ranges we accept, not versions we install.
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ]) {
    const deps = (manifest[field] ?? {}) as Record<string, string>;
    for (const [name, spec] of Object.entries(deps)) {
      if (!/^(catalog|workspace):/.test(spec)) {
        fail(
          "catalog",
          `${file} ${field}.${name} is "${spec}" — use \`catalog:\` (pnpm add puts it in the catalog)`,
        );
      }
    }
  }
}

// --- Mobile app stays in apps/expo (AGENTS.md → Layout) ----------------------
if (!exists("apps/expo/package.json") || !exists("apps/expo/app.config.ts")) {
  fail("expo-location", "the mobile app must live in apps/expo");
}
for (const file of files) {
  if (
    /(^|\/)(app\.json|app\.config\.[cm]?[jt]s|metro\.config\.[cm]?js|eas\.json)$/.test(
      file,
    ) &&
    !file.startsWith("apps/expo/")
  ) {
    fail(
      "expo-location",
      `${file}: Expo/React Native config outside apps/expo`,
    );
  }
}

// --- Agent docs (AGENTS.md is canonical) --------------------------------------
const agentsMd = read("AGENTS.md");
for (const pointer of ["CLAUDE.md", ".github/copilot-instructions.md"]) {
  if (!exists(pointer) || !read(pointer).includes("AGENTS.md")) {
    fail("agent-docs", `${pointer} must point to AGENTS.md`);
  }
}
const rootScripts = Object.keys(
  (JSON.parse(read("package.json")) as { scripts: Record<string, string> })
    .scripts,
);
const pnpmBuiltins = new Set([
  "install",
  "add",
  "remove",
  "exec",
  "dlx",
  "why",
  "audit",
  "outdated",
  "update",
  "-F",
  "--filter",
  "peers",
  "run",
]);
for (const [, command] of agentsMd.matchAll(/`pnpm ([\w:-]+)/g)) {
  if (command && !pnpmBuiltins.has(command) && !rootScripts.includes(command)) {
    fail(
      "agent-docs",
      `AGENTS.md mentions \`pnpm ${command}\`, which is not a root script`,
    );
  }
}
for (const [, path] of agentsMd.matchAll(
  /`((?:apps|packages|tooling|scripts|\.agents|\.github)\/[\w./[\]-]+?)`/g,
)) {
  if (path && !path.includes("*") && !exists(path.replace(/\/$/, ""))) {
    fail(
      "agent-docs",
      `AGENTS.md references \`${path}\`, which does not exist`,
    );
  }
}

// --- Agent skills (AGENTS.md → Agent skills) ----------------------------------
const FIRST_PARTY_SKILLS = [
  "project-init",
  "add-feature",
  "testing",
  "infrastructure",
];
const lock = JSON.parse(read("skills-lock.json")) as {
  skills: Record<string, unknown>;
};
const expectedSkills = [...Object.keys(lock.skills), ...FIRST_PARTY_SKILLS];
const skillDirs = readdirSync(join(root, ".agents/skills"));
for (const skill of expectedSkills) {
  if (!exists(`.agents/skills/${skill}/SKILL.md`)) {
    fail(
      "skills",
      `.agents/skills/${skill}/SKILL.md is missing (pnpm skills:install)`,
    );
  }
  const link = join(root, ".claude/skills", skill);
  if (
    !existsSync(link) ||
    !lstatSync(link).isSymbolicLink() ||
    readlinkSync(link) !== `../../.agents/skills/${skill}`
  ) {
    fail(
      "skills",
      `.claude/skills/${skill} must be a symlink to ../../.agents/skills/${skill}`,
    );
  }
}
for (const dir of skillDirs) {
  if (!expectedSkills.includes(dir)) {
    fail(
      "skills",
      `.agents/skills/${dir} is neither in skills-lock.json nor a first-party skill`,
    );
  }
}

// --- Testing policy (AGENTS.md → Testing policy) ------------------------------
/**
 * Packages that predate the policy and have no tests yet. Known debt: do not
 * add to this list — remove entries as packages gain tests.
 */
const UNTESTED_PACKAGES_DEBT = new Set([
  "packages/analytics",
  "packages/auth",
  "packages/db",
  "packages/email",
  "packages/seo",
]);
for (const dir of readdirSync(join(root, "packages"))) {
  const pkgDir = `packages/${dir}`;
  if (!exists(`${pkgDir}/package.json`) || !exists(`${pkgDir}/src`)) continue;
  const scripts =
    (
      JSON.parse(read(`${pkgDir}/package.json`)) as {
        scripts?: Record<string, string>;
      }
    ).scripts ?? {};
  const hasTests = files.some(
    (file) => file.startsWith(`${pkgDir}/src/`) && /\.test\.tsx?$/.test(file),
  );
  if (UNTESTED_PACKAGES_DEBT.has(pkgDir)) {
    if (hasTests && scripts.test) {
      fail(
        "testing",
        `${pkgDir} has tests now — remove it from UNTESTED_PACKAGES_DEBT`,
      );
    }
  } else if (!scripts.test || !hasTests) {
    fail(
      "testing",
      `${pkgDir} needs a "test" script and at least one src/**/*.test.ts`,
    );
  }
}
for (const file of files) {
  if (
    /^packages\/api\/src\/router\/[^/]+\.ts$/.test(file) &&
    !file.endsWith(".test.ts") &&
    !exists(file.replace(/\.ts$/, ".test.ts"))
  ) {
    fail("testing", `${file} has no sibling ${basename(file, ".ts")}.test.ts`);
  }
}

// --- Instant feedback (AGENTS.md → UX: skeletons + instant feedback) ----------
for (const file of files.filter((f) => f.endsWith(".tsx"))) {
  const raw = read(file);
  const source = code(raw);

  // Web: a page that prefetches data streams it behind a skeleton.
  if (
    /^apps\/nextjs\/src\/app\/.*\/page\.tsx$/.test(file) &&
    source.includes("prefetch(")
  ) {
    if (!ignored(raw, "route-skeleton")) {
      if (!exists(join(dirname(file), "loading.tsx"))) {
        fail(
          "route-skeleton",
          `${file} fetches data but has no sibling loading.tsx skeleton`,
        );
      }
      if (!/<Suspense\s+fallback=/.test(source)) {
        fail(
          "route-skeleton",
          `${file} fetches data but renders no <Suspense fallback={…Skeleton}>`,
        );
      }
    }
  }

  // Mobile: a screen that loads data renders a Skeleton while pending.
  if (
    file.startsWith("apps/expo/src/app/") &&
    /\b(useQuery|useSuspenseQuery|useInfiniteQuery|useSession)\(/.test(
      source,
    ) &&
    !source.includes("Skeleton") &&
    !ignored(raw, "screen-skeleton")
  ) {
    fail(
      "screen-skeleton",
      `${file} loads data but never renders a <Skeleton> while pending`,
    );
  }

  // Both apps: every mutation gives immediate feedback and handles failure.
  if (/\buseMutation\(/.test(source) && !ignored(raw, "mutation-feedback")) {
    if (!/\bonMutate\b|\bisPending\b/.test(source)) {
      fail(
        "mutation-feedback",
        `${file}: useMutation without an optimistic update (onMutate) or pending state (isPending)`,
      );
    }
    if (!/\bonError\b/.test(source)) {
      fail(
        "mutation-feedback",
        `${file}: useMutation without onError feedback`,
      );
    }
  }
}

// --- i18n: every locale has the same keys (AGENTS.md → Conventions → i18n) ----
const flatten = (value: unknown, prefix = ""): string[] =>
  value && typeof value === "object"
    ? Object.entries(value).flatMap(([key, child]) =>
        flatten(child, prefix ? `${prefix}.${key}` : key),
      )
    : [prefix];
const localeDir = "apps/nextjs/src/languages";
const locales = readdirSync(join(root, localeDir)).filter((f) =>
  f.endsWith(".json"),
);
const keysByLocale = new Map(
  locales.map((locale) => [
    locale,
    new Set(flatten(JSON.parse(read(`${localeDir}/${locale}`)))),
  ]),
);
const allKeys = new Set<string>();
for (const keys of keysByLocale.values()) {
  for (const key of keys) allKeys.add(key);
}
for (const [locale, keys] of keysByLocale) {
  const missing = [...allKeys].filter((key) => !keys.has(key));
  if (missing.length > 0) {
    fail(
      "i18n",
      `${localeDir}/${locale} is missing: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? ", …" : ""}`,
    );
  }
}

// --- Infrastructure is Terraform (AGENTS.md → Infrastructure) ----------------
// Tool runs (fmt/validate/test/tflint/trivy) live in scripts/check-infra.ts.
const isTerraform = (file: string) => /\.(tf|tftest\.hcl)$/.test(file);
const otherIac: [RegExp, string][] = [
  [/(^|\/)cdk\.json$/, "AWS CDK"],
  [/(^|\/)cdktf\.json$/, "CDK for Terraform"],
  [/(^|\/)Pulumi(\.[\w-]+)?\.ya?ml$/, "Pulumi"],
  [/(^|\/)serverless\.(ya?ml|ts|js|json)$/, "Serverless Framework"],
  [/(^|\/)samconfig\.toml$/, "AWS SAM"],
  [/\.bicep$/, "Azure Bicep"],
];
for (const file of files) {
  if (
    /(^|\/)\.terraform\//.test(file) ||
    /\.tfstate(\.|$)|\.tfplan$/.test(file)
  ) {
    fail(
      "terraform",
      `${file}: Terraform state/plans/.terraform must never be committed`,
    );
  }
  if (isTerraform(file) && !/^infra\/(envs|modules)\/[^/]+\//.test(file)) {
    fail(
      "terraform",
      `${file}: Terraform lives in infra/envs/<env>/ or infra/modules/<name>/`,
    );
  }
  for (const [pattern, tool] of otherIac) {
    if (pattern.test(file)) {
      fail(
        "terraform",
        `${file}: ${tool} — cloud infrastructure is Terraform only`,
      );
    }
  }
  if (
    /\.(ya?ml|json)$/.test(file) &&
    file !== "pnpm-lock.yaml" &&
    !file.startsWith(".agents/") &&
    /AWSTemplateFormatVersion|Transform:\s*AWS::Serverless/.test(read(file))
  ) {
    fail(
      "terraform",
      `${file}: CloudFormation/SAM — cloud infrastructure is Terraform only`,
    );
  }
}
// Creating cloud resources from automation bypasses Terraform (and its state).
const imperativeInfra =
  /\b(?:(?:aws|gcloud|az|doctl|hcloud|linode-cli|vultr-cli)\b[^#\n]*?\b(?:create|delete)|aws\s+cloudformation|sam\s+deploy|cdk\s+(?:deploy|destroy)|pulumi\s+(?:up|destroy)|(?:serverless|sls)\s+(?:deploy|remove)|az\s+deployment|gcloud\s+deployment-manager)\b/;
for (const file of commandFiles) {
  read(file)
    .split("\n")
    .forEach((line, index) => {
      if (
        !line.trim().startsWith("#") &&
        imperativeInfra.test(line) &&
        !ignored(line, "terraform")
      ) {
        fail(
          "terraform",
          `${file}:${index + 1} creates/deletes cloud resources outside Terraform`,
        );
      }
    });
}
const terraformDirs = new Set(
  files.filter(isTerraform).map((file) => dirname(file)),
);
if (terraformDirs.size > 0 && !exists("infra/.terraform-version")) {
  fail(
    "terraform",
    "infra/.terraform-version must pin the Terraform version (CI installs it)",
  );
}
for (const dir of terraformDirs) {
  const hcl = files
    .filter((file) => file.startsWith(`${dir}/`) && file.endsWith(".tf"))
    .map((file) => read(file))
    .join("\n");
  if (
    /\b(access_key|secret_key|token|password|client_secret)\s*=\s*"[^"$]/.test(
      hcl,
    )
  ) {
    fail(
      "terraform",
      `${dir}: literal credential in Terraform — use variables marked sensitive (TF_VAR_* / secrets manager)`,
    );
  }
  if (/^infra\/envs\/[^/]+$/.test(dir)) {
    const backend = /backend\s+"(\w+)"/.exec(hcl)?.[1];
    if ((!backend || backend === "local") && !/\bcloud\s*\{/.test(hcl)) {
      fail(
        "terraform",
        `${dir}: root module needs a remote backend (state never lives on a laptop)`,
      );
    }
    if (!exists(`${dir}/.terraform.lock.hcl`)) {
      fail(
        "terraform",
        `${dir}/.terraform.lock.hcl must be committed (terraform init, then commit it)`,
      );
    }
  }
  if (
    /^infra\/modules\/[^/]+$/.test(dir) &&
    !files.some(
      (file) =>
        file.startsWith(`${dir}/tests/`) && file.endsWith(".tftest.hcl"),
    )
  ) {
    fail(
      "testing",
      `${dir} needs tests/*.tftest.hcl (terraform-test skill; mock providers)`,
    );
  }
}

// --- Report -------------------------------------------------------------------
if (failures.length > 0) {
  console.error(`✗ ${failures.length} convention violation(s):\n`);
  for (const failure of failures) console.error(`  ${failure}`);
  console.error(
    `\nSee AGENTS.md. Checked from ${relative(process.cwd(), root) || "."}.`,
  );
  process.exit(1);
}
console.log(
  "✓ Repo conventions hold (pnpm-only, catalog, expo location, agent docs, skills, testing, instant feedback, i18n, terraform).",
);
