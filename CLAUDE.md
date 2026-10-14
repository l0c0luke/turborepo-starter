# CLAUDE.md

Canonical agent guidance for this repo lives in **[AGENTS.md](./AGENTS.md)** —
read it first.

@AGENTS.md

## Notes for Claude Code

- Safe commands (typecheck, lint, build, test, db push, docker compose) are
  pre-approved in `.claude/settings.json`.
- **Always use `pnpm`** (never `npm`, `yarn`, `bun`, or raw `npx`). All dependency management,
  script execution, and commands must run through `pnpm`.
- **Mobile app must stay in `apps/`**: The mobile app lives strictly at `apps/expo`.
  Never move it to the repository root, never extract it outside `apps/`, and never scaffold
  mobile screens/features outside `apps/expo`.
- To rename + scaffold this skeleton for a new app, run the **project-init** skill
  (`.claude/skills/project-init/`).
- Run `pnpm typecheck` after edits. The skeleton is intentionally minimal — add
  features, don't expect demo pages to delete.
