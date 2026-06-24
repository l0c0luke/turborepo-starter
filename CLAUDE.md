# CLAUDE.md

Canonical agent guidance for this repo lives in **[AGENTS.md](./AGENTS.md)** —
read it first.

@AGENTS.md

## Notes for Claude Code

- Safe commands (typecheck, lint, build, test, db push, docker compose) are
  pre-approved in `.claude/settings.json`.
- To rename + scaffold this skeleton for a new app, run the **project-init** skill
  (`.claude/skills/project-init/`).
- Run `pnpm typecheck` after edits. The skeleton is intentionally minimal — add
  features, don't expect demo pages to delete.
