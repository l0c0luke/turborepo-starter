#!/usr/bin/env node
/**
 * commit-msg hook (lefthook): enforce Conventional Commits, which this repo's
 * history, Renovate (`:semanticCommits`) and changelogs rely on.
 *
 *   feat(api): add workout router
 *   fix(expo)!: drop the legacy session store
 */
import { readFileSync } from "node:fs";

const TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
];
const pattern = new RegExp(`^(${TYPES.join("|")})(\\([\\w./-]+\\))?!?: \\S.*`);

const file = process.argv[2];
if (!file) {
  console.error("usage: check-commit-msg <commit-msg-file>");
  process.exit(2);
}
const subject = readFileSync(file, "utf8").split("\n")[0]?.trim() ?? "";

// Let git's own generated messages through (merges, reverts, autosquash).
const generated = /^(Merge |Revert "|fixup! |squash! |amend! )/.test(subject);

if (!generated && !pattern.test(subject)) {
  console.error(`✗ Commit subject is not a Conventional Commit:

    ${subject || "(empty)"}

  Expected  <type>(<optional scope>): <summary>
  Types     ${TYPES.join(", ")}
  Example   feat(api): add workout router
`);
  process.exit(1);
}
