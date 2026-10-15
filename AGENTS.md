# AGENTS.md — Hearsay (read this first, every session)

You are a coding agent working on **Hearsay**, a persistent, explainable memory layer for game NPCs, built on **FalkorDB** for the Graph Hacks hackathon (Track 02: Agent Memory and Coordination). The hackathon ends **Oct 18, 2026, 11:59 PM IST (7:29 PM WAT)**. We aim to win. Quality and correctness matter more than feature count.

## 0. Before you write any code

1. Identify which human you are working for (Goodness or DuroT). Read `docs/goodness/README.md` or `docs/duro/README.md`. That file is your scope.
2. Read all of `docs/shared/` in numeric order. Do not skip `04-tool-contract.md` and `06-behaviour-specs.md`; they are the source of truth.
3. Look at `docs/requests.md` for open cross-owner requests.
4. Work only on the task you were given. Do not start stretch items.

## 1. What the product is (one paragraph)

Hearsay stores each player's world as a FalkorDB graph (`player:{id}`, copied from `world_template`). NPCs witness events, spread them as gossip along TRUSTS edges (credibility decays per hop), form attitudes toward the player, and reply in dialogue using only what they know. Every answer can be explained with the exact path through the graph. It ships as a TypeScript library + MCP server, with a small playable demo town ("Hollowbrook") as proof.

## 2. Hard rules (violating these can disqualify us or break the demo)

1. **The graph must do real work.** If a feature would still work with FalkorDB removed, it does not count. Gossip, explain-path, per-player isolation and the knowledge firewall must be driven by graph queries.
2. **The LLM never writes Cypher and never receives Cypher.** All Cypher lives in `packages/hearsay/src/queries/` as named, parameterised constants. Never build queries by string concatenation with user or LLM input. Always pass `$params`.
3. **The LLM only writes dialogue**, from a prompt containing only facts the NPC knows. Never put events an NPC does not know into its prompt.
4. **Resolve names against the graph** (NPC id, event id, place id) before running a query. Unknown ids return `UNKNOWN_NPC` / `UNKNOWN_EVENT` / `UNKNOWN_PLACE` and run nothing else.
5. **Reads use `roQuery`**. Writes are deliberate and live in the tools that own them.
6. **The contract is law.** Shapes in `packages/contract` (zod) are shared by the HTTP API, MCP server, UI and tests. Change them only via `docs/requests.md` and Goodness's approval. Bump `CONTRACT_VERSION` on any change.
7. **Do not invent FalkorDB or Cypher features.** FalkorDB implements a subset of OpenCypher. Do not assume Neo4j-only syntax or procedures work. If unsure, test the query in FalkorDB Browser (http://localhost:3000) or read https://docs.falkordb.com (pages: `cypher/cypher-support`, `cypher/known-limitations`, `algorithms`, `getting-started/clients`). Record surprises in `docs/goodness/spike-results.md`.
8. **No map-valued properties.** Store scalars or arrays on nodes and edges. Use flat properties or a JSON string.
9. **No secrets in git.** Use `.env` (gitignored) and keep `.env.example` current.
10. **Synthetic data only.** The hackathon forbids private or personal data in the graph.
11. **Tests hit a real FalkorDB** (`docker compose up -d falkordb`), never a mocked database. Every query has at least one test.
12. **Do not add dependencies casually.** Prefer what is already in the stack. Justify any new dependency in the PR description.

## 2b. Fixed tech stack (do not substitute)

- Node LTS (>= 20), TypeScript `strict`, pnpm workspaces
- `packages/contract` — zod schemas, types, error codes, fixtures, `MockHearsay`
- `packages/hearsay` — core library (FalkorDB, tools, gossip, opinion, firewall, LLM wrapper)
- `packages/mcp` — MCP server exposing the same tools (`@modelcontextprotocol/sdk`)
- `apps/web` — Next.js (App Router) + Tailwind + shadcn/ui, themed from `DESIGN.md`; graph panel with `react-force-graph-2d`; API routes call `packages/hearsay` directly
- DB: FalkorDB, official Node client `falkordb`. Local Docker with a volume is primary. FalkorDB Cloud free tier is for the optional live demo only.
- LLM: Google Gemini (Flash model, free tier) behind `packages/hearsay/src/llm.ts`. Model name comes from the `GEMINI_MODEL` env var; never hardcode it.
- Tests: `vitest`. Format: `prettier`. Typecheck: `pnpm typecheck` must pass before every commit.

## 3. Conventions

- TypeScript: no `any`, no non-null assertions without a comment, named exports, small functions, files under ~250 lines.
- Every tool returns the envelope from `docs/shared/04-tool-contract.md`: `{ ok: true, data, trace }` or `{ ok: false, error: { code, message } }`. Tools never throw to callers; they return the error envelope.
- Every tool records a `TraceStep` per query (agent, tool, queryId, args, rows, ms). The UI renders this.
- Query ids look like `Q40_gossip_candidates`. Keep them stable; docs and tests refer to them.
- Comments explain **why**, not what. Every query has a one-line comment saying what question it answers (judges will ask).
- Commits and branches: follow section 3b exactly. Branches: `goodness/<topic>`, `duro/<topic>`.
- `pnpm typecheck && pnpm test` must pass before you say a task is done.

## 3b. Commit discipline (mandatory for every agent and human)

Goal: history that lets us roll back anything, shows steady progress inside the event window, and makes each teammate's work visible within minutes.

1. **Commit early, commit often.** Commit after every green micro-step: a query verified in Browser, a function plus its test, a component rendered on the styleguide, a doc updated. Target 15 to 30 minutes between commits. Never go more than 45 minutes of work without one. If you have changed more than ~150 lines or touched more than ~5 files without committing, stop and commit now (split by intent).
2. **One logical change per commit.** No "misc fixes", no "updates". Do not mix formatting with behaviour, or a refactor with a feature.
3. **Every commit compiles.** `pnpm typecheck` must pass at each commit (and `pnpm check:design` for anything in `apps/web`). The `pre-commit` hook enforces this; never bypass it with `--no-verify`. Tests for what you touched must pass before you push; the full suite must pass before you merge to `main`. Work-in-progress commits are allowed on your own branch only if they compile, and are prefixed `wip`.
4. **Message format (enforced by the `commit-msg` hook):** `<area>(<task>): <imperative summary>`, at most 72 characters.
   - Areas: `contract`, `hearsay`, `mcp`, `web`, `seed`, `docs`, `infra`, `loadtest`, `chore`, `wip`.
   - Task: the id from your README (`G5`, `D8`, `U8`) or a short topic.
   - Examples: `hearsay(G5): add gossip candidates query`, `web(U8): highlight rumor path in graph`, `docs(G2): record query spike results`.
   - Add a body when the why is not obvious: what problem, what you verified (test names, query ids, screenshot path). Keep lines under 100 characters.
   - **AI disclosure trailer** on every agent-written commit: `Assisted-by: <tool and model>` (for example `Assisted-by: Claude Code`). This feeds the README's AI-usage section.
5. **Stage deliberately.** Use `git add <paths>` or `git add -p`. Read `git status` and `git diff --staged` before every commit. Never commit `.env`, keys, `node_modules`, build output or large binaries. Do not use `git add -A` without checking what it will add.
6. **Push often.** Push after every commit, and no less than every three commits or every hour. Run `git pull --rebase origin main` at least hourly and before starting any task. On conflict keep both sides' intent and never discard a teammate's change. If the conflict is in `packages/contract/src/schemas.ts` or in `docs/shared/`, stop and ask the owner.
7. **Merge to `main`** as soon as a task's acceptance criteria pass (typecheck + tests). Do not leave a finished task unmerged overnight. `main` must always run the demo.
8. **Checkpoint tags.** At each checkpoint (C1 to C4) tag `main` (`git tag c1 && git push --tags`). Tag `final` just before submission. Never move or delete a tag.
9. **Never rewrite shared history.** No force-push to `main`. Never amend, squash or rebase commits that are already pushed. On your own unpushed branch you may amend or rebase freely.
10. **Before risky operations** (dependency upgrades, large refactors, query or schema rewrites, mass renames, deleting files) commit the clean state first so rollback is one command.
11. **Commit what you describe.** Spike results, screenshots, doc edits and fixtures go in the same commit as the change they document.
12. **End-of-session ritual (agents):** before you stop, run `pnpm typecheck && pnpm test`, commit every intended change, push, then reply with three lines: what changed, what you verified, what is next. Leave no uncommitted work behind.

Hooks live in `.githooks/` (created in task G1; contents in `docs/shared/07-workflow.md`). `pnpm i` runs `git config core.hooksPath .githooks` through the `prepare` script.

## 3c. UI work in `apps/web`: the design system is mandatory

- Read `DESIGN.md` (repo root, the design system) and `docs/duro/ui-spec.md` (layout, components, copy, states) completely before touching any UI. `DESIGN.md` wins on colour, type, shape, depth, motion and craft rules; `ui-spec.md` wins on layout and behaviour.
- If you change `DESIGN.md`, run `npx @google/design.md lint DESIGN.md` and fix findings; regenerate tokens instead of hand-typing values.
- Use only shadcn/ui components, Tailwind semantic classes and the tokens defined there. No hard-coded colours, sizes or fonts; no new UI, icon or animation libraries.
- Every new or changed component must appear on the `/styleguide` page in all its states, in the same commit.
- `pnpm check:design` must pass before every commit in `apps/web`.
- Save a 1440x900 screenshot to `docs/duro/screens/` after each UI task and commit it.

## 4. Definition of done (for any task)

- Acceptance criteria in your task are all met and demonstrated (test output or screenshot).
- Typecheck and tests pass, and the work is committed and pushed following section 3b.
- New queries documented in `docs/shared/05-queries.md` (Goodness) or UI behaviour reflected in `docs/duro/README.md` (DuroT).
- The human owner can explain what you wrote. Keep code simple enough that they can. If you used a non-obvious trick, add a short comment.
- Nothing from section 2 is violated.

## 5. AI-use disclosure

The hackathon requires AI coding assistant use to be disclosed and requires every participant to understand and explain the code. Do not generate large opaque blocks. Prefer clear, boring code. The README contains an "AI usage" section maintained by the humans.

## 6. When you are stuck

1. Re-read the relevant shared doc.
2. Test the query in FalkorDB Browser.
3. Check the FalkorDB docs. 
4. If the contract or the docs are wrong or ambiguous, do **not** improvise: write the problem in `docs/requests.md` and tell your human.

## 7. Commands (set up by task G1)

```
docker compose up -d falkordb     # FalkorDB on 6379, Browser on 3000
pnpm i
pnpm typecheck
pnpm check:design                # UI design-system guard (apps/web)
pnpm test                         # needs FalkorDB running
pnpm dev                          # Next.js demo (apps/web)
pnpm mcp                          # MCP server
pnpm loadtest                     # concurrent-player benchmark (no LLM)
```
