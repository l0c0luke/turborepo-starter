# Third-party agent skills

The skills below are vendored from their upstream repositories (pinned in
`skills-lock.json`; refresh with `pnpm skills:update`) and redistributed
unmodified under their upstream licenses (MIT, or MPL-2.0 for HashiCorp's —
the MPL-2.0 files stay under MPL-2.0, and their source is the linked
repository). Do not edit them in place — local changes are overwritten on
update and the conventions check expects them unchanged.

| Skill | Source | License / copyright |
| --- | --- | --- |
| `next-bundle-optimizer` | [vercel/next.js](https://github.com/vercel/next.js) | MIT — Copyright (c) 2025 Vercel, Inc. |
| `security-audit` | [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | MIT — Copyright (c) 2025-2026 Cloudflare, Inc. |
| `vercel-react-best-practices`, `vercel-react-native-skills` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | MIT (declared in each SKILL.md) — Vercel |
| `expo-data-fetching`, `expo-design-system`, `expo-upgrade` | [expo/skills](https://github.com/expo/skills) | MIT — Copyright (c) 2025-present 650 Industries, Inc. (aka Expo) |
| `terraform-style-guide`, `terraform-test` | [hashicorp/agent-skills](https://github.com/hashicorp/agent-skills) | MPL-2.0 — Copyright IBM Corp. (HashiCorp, an IBM company; [license](https://github.com/hashicorp/agent-skills/blob/main/LICENSE)) |

MIT License text: permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation files, to deal
in the Software without restriction, subject to including the above copyright
notice and this permission notice in all copies or substantial portions of the
Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. See
each upstream repository for the full license text.
