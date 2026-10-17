# 07 — Workflow, timeline, checkpoints

## Timeline (all times WAT; deadline is Oct 18, 7:29 PM WAT)

| When | Goal | Exit check |
| --- | --- | --- |
| **Day 1, Thu Oct 15** | Foundation. Monorepo, contract, docker, spike of risky queries, seed content, UI skeleton on mock | **C1**: `pnpm typecheck` green; `docker compose up -d falkordb` works; spike results written; mock UI renders the town and a chat |
| **Day 2, Fri Oct 16** | Core loop on live data | **C2 (midday)**: recordEvent, recall, whoKnows, snapshot, advanceTime/spread live and tested; UI on live for these. **C3 (night)**: attitude, explain, say with firewall live; chat works end to end |
| **Day 3, Sat Oct 17** | Wow and proof | Graph panel highlights rumor path; procedural memory; trace panel; persistence restart demo; load test numbers; MCP server; Vercel/Cloud spike result. **C4 (night): FEATURE FREEZE** |
| **Day 4, Sun Oct 18** | Ship | Bugs only. Demo video recorded by 1 PM. README and blog done. **Submit by 3 PM WAT** (4+ hours of buffer). Do not start new features |

If a checkpoint slips by more than 3 hours, cut from SHOULD (see `01-product-and-rules.md`), never from MUST.

## Branching and merging

- `main` is always demo-able. Never push broken typecheck to `main`.
- Branches: `goodness/<topic>`, `duro/<topic>`. Short-lived (hours, not days). Merge to `main` at least every few hours.
- Each owner reviews the other's PR **only for contract compatibility** (a quick look, not a full review). Goodness reviews anything touching `packages/*`; DuroT reviews anything touching `apps/web`.
- Commit rules (frequency, size, message format, pushing, tags, end-of-session ritual) are in `AGENTS.md` section 3b. They are mandatory.
- No force-push to `main`. No large formatting-only commits.

## Git hooks (created in task G1)

`.githooks/pre-commit` (make it executable):

```sh
#!/bin/sh
set -e
pnpm -s typecheck
if [ -f scripts/check-design.mjs ]; then node scripts/check-design.mjs; fi
# lint the design system when DESIGN.md is part of the commit (needs network the first time)
if git diff --cached --name-only | grep -qx 'DESIGN.md'; then npx -y @google/design.md lint DESIGN.md; fi
# block obvious secrets in staged changes
if git diff --cached -U0 | grep -E 'AIza[0-9A-Za-z_-]{20,}|FALKORDB_PASSWORD=.+|GEMINI_API_KEY=.+' >/dev/null; then
  echo "Possible secret staged. Remove it and use .env."; exit 1
fi
```

`.githooks/commit-msg` (make it executable):

```sh
#!/bin/sh
msg=$(head -n1 "$1")
case "$msg" in Merge*|Revert*) exit 0 ;; esac
echo "$msg" | grep -Eq '^(contract|hearsay|mcp|web|seed|docs|infra|loadtest|chore|wip)(\([A-Za-z0-9_.-]+\))?: .{3,72}$' || {
  echo "Commit message must look like: area(task): summary"
  echo "  e.g. hearsay(G5): add gossip candidates query"
  exit 1
}
```

Root `package.json`: `"prepare": "git config core.hooksPath .githooks || true"`. A fresh clone gets the hooks after `pnpm i`.

## Contract changes

1. Write an entry in `docs/requests.md`.
2. Goodness approves, edits `schemas.ts`, bumps `CONTRACT_VERSION`, tells DuroT.
3. DuroT updates fixtures/mock and any UI.
4. A contract change after C3 needs Ayo's approval.

## Working with coding agents

- Start every session with: "Read AGENTS.md, then docs/shared/* in order, then docs/<your-name>/README.md. Work on task <ID> only."
- One task per agent session. Paste the task's acceptance criteria into the prompt.
- Agents must run `pnpm typecheck && pnpm test` and show the result before claiming done.
- Humans read every diff before merging. You must be able to explain it to a judge.
- Keep a running list of "things I would explain to a judge" in your personal README section (see the Judge Q&A in `09-demo-and-submission.md`).

## Testing strategy

- **Unit (pure):** `opinion.ts`, `firewall.ts`, gossip selection rule, template picker, zod schemas, fixtures.
- **Integration (real FalkorDB):** every tool, golden gossip test, isolation tests, persistence smoke (`resetPlayer`, `newPlayer` twice).
- **LLM:** tests use a fake LLM (`HEARSAY_LLM=off` or an injected stub). Never call Gemini in CI/tests.
- **UI:** run in `mock` mode for development; manual checklist in `docs/duro/README.md` for live mode. No heavy UI test framework needed.
- Tests create players with unique ids (`test_<random>`) and delete their graphs in `afterAll`.

## Secrets and accounts

- Each person creates their own free Gemini API key in Google AI Studio and keeps it in their local `.env`.
- FalkorDB Cloud (free tier) instance and Vercel project are created by DuroT (deployment owner); credentials go into Vercel env vars, never into git. Share them with teammates through a password manager or a private message, not in the repo.

## Communication

- Blocked for more than 20 minutes: ask your teammate, then Ayo.
- Cross-owner changes: `docs/requests.md`.
- Daily at the end of Days 1 to 3: each person posts "done / next / blocked" in the team chat.
