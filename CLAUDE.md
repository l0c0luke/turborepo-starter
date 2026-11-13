# CLAUDE.md

Canonical agent guidance for this repo lives in **[AGENTS.md](./AGENTS.md)** —
read it first. Rules change there, once.

@AGENTS.md

## Notes for Claude Code

- Done means `pnpm check` passes (the pre-push hook runs it; CI runs it plus
  build, bundle budget, Docker, audit and secret scan).
- `.claude/settings.json` pre-approves the safe commands (check, test, lint,
  typecheck, db, docker compose) and **denies** `npm`/`npx`/`yarn`/`bun` and
  hook bypasses (`--no-verify`) — use `pnpm`, and fix failing hooks.
- Project skills are in `.agents/skills/` (symlinked into `.claude/skills/`):
  `add-feature` for any feature work, `testing` for tests, `security-audit`
  for auth/API/data changes, `next-bundle-optimizer` when the bundle budget
  fails, `infrastructure` (+ `terraform-style-guide`, `terraform-test`) for
  any cloud resource, `project-init` to start a new app from this skeleton.
- The mobile app lives strictly at `apps/expo` — never move it.
