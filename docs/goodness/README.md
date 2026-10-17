# Goodness — scope: graph, core library, MCP, load test

You own the engine. If the graph does not do real work, we do not qualify; that is your area. Your teammate DuroT owns the UI and content and builds against the contract on a mock until your tools land, so **contract-first and fast first merges** matter more than anything.

## You own

`packages/contract/src/schemas.ts` (source of truth) · `packages/hearsay/**` · `packages/mcp/**` · `queries/` · `loadtest/` · `docker-compose.yml` · `.env.example` · `docs/shared/05-queries.md` and `06-behaviour-specs.md` (keep accurate).

You do not edit `apps/web/**`, `seed/hollowbrook.json` content, or `packages/contract/src/fixtures.ts|mock.ts` (DuroT's). Ask via `docs/requests.md`.

## Starter prompt for your coding agent

> Read AGENTS.md, then docs/shared/01 to 09 in order, then docs/goodness/README.md. I am Goodness. Work only on task <ID> from docs/goodness/README.md. Follow its acceptance criteria. Do not change files owned by DuroT. Test every Cypher query in FalkorDB Browser first and note surprises in docs/goodness/spike-results.md. Run `pnpm typecheck && pnpm test` and show the output before saying you are done. Keep the code simple enough that I can explain it to a judge.

## Tasks (in order; each with acceptance criteria)

### G1 — Monorepo bootstrap and contract (Day 1, about 1 h) **do this first, merge fast**
- pnpm workspace: `packages/contract`, `packages/hearsay`, `packages/mcp`, `apps/web` (empty placeholder; DuroT scaffolds Next.js in it), root `tsconfig` (strict), scripts: `typecheck`, `test`, `dev`, `mcp`, `loadtest`.
- Copy the schemas from `docs/shared/04-tool-contract.md` into `packages/contract/src/schemas.ts`, export from `index.ts`.
- `docker-compose.yml` from `08-deployment.md`; `.env.example` from `02-architecture.md`; `.gitignore` (incl. `.env`).
- Git hooks from `docs/shared/07-workflow.md` (`.githooks/pre-commit`, `.githooks/commit-msg`, the `prepare` script) and tell DuroT to run `pnpm i` once to activate them. Read `AGENTS.md` section 3b: commit early and often is mandatory.
- **Accept:** `pnpm i && pnpm typecheck` passes on a clean clone; `docker compose up -d falkordb` works; Browser at http://localhost:3000. Merge to `main` and tell DuroT immediately.

### G2 — Query spike and DB helper (Day 1, 1.5 h)
- `packages/hearsay/src/db.ts`: connect (host/port/password from env, using the official `falkordb` Node client), a `run(graph, queryId, query, params)` and `ro(...)` helper that records a `TraceStep` (queryId, args, rows, ms) and wraps errors into `DB_UNAVAILABLE`/`INTERNAL`. Check the client's actual API and result shape at https://docs.falkordb.com/getting-started/clients and write the helper once so nothing else touches raw results.
- In Browser, on a scratch graph with the seed, run and note pass/fail for: Q30 (UNWIND after WITH), Q40 (`NOT (b)-[:KNOWS]->(e)`), Q41 (UNWIND of a list of maps), Q61 (`all(r IN relationships(path) ...)`, list comprehensions), Q70 (`algo.pageRank`), Q90 label predicates, index DDL, **`GRAPH.COPY` carries indexes?**, parameters from the Node client (including list-of-maps).
- Write `docs/goodness/spike-results.md`: for each, PASS/FAIL, the working syntax, and the fallback chosen. Update `05-queries.md` with any changed syntax.
- **Accept:** spike file committed; `db.ts` has a passing test that runs a trivial query and returns a trace step.

### G3 — World seed loader, newPlayer, resetPlayer, getWorld (Day 1 evening / Day 2 morning, 2 h)
- `world.ts`: `ensureWorld()` (idempotent; uses `GRAPH.LIST`; seeds `world_template` from `seed/hollowbrook.json`, validating with zod and failing loudly on bad references), `getWorld` (Q10, Q11, Q12), `newPlayer` (Q01 `GRAPH.COPY` + Q22; `created:false` if it exists), `resetPlayer` (Q02 + copy + Q22).
- Until DuroT delivers the full seed (task D1), use a 3-NPC stub in `seed/hollowbrook.json` and swap later; the loader must not change.
- **Accept:** tests: `ensureWorld` twice is a no-op; `newPlayer` twice returns `created:false`; two players are isolated; `resetPlayer` restores tick 0; `world_template` unchanged after play.

### G4 — recordEvent, recall, whoKnows, snapshot (Day 2 morning, 2 h)
- Tools per contract. Validate ids against the graph first (return `UNKNOWN_NPC`, `UNKNOWN_PLACE`, `UNKNOWN_PLAYER`). Event ids: `ev_` + base36.
- `recall` returns `status: 'not_in_graph'` with `items: []` when nothing is known (not an error).
- `snapshot` maps FalkorDB entities to `GraphNode`/`GraphEdge` using our own `id` property. Node ids `NPC:brom`, edge ids as in the contract. Exclude Utterance/Conversation/EventType nodes.
- **Accept:** golden test: after `recordEvent(stole, forge, [brom])`, Brom's `recall` shows 1 item (`learnedFrom: 'witness'`, confidence 1.0); Garrick's `recall` is `not_in_graph`; `whoKnows` lists `brom` as witness and the other five as `unaware`; `snapshot` contains the Event node and a KNOWS edge.

### G5 — Gossip: advanceTime and spread (Day 2 midday, 3 h) **the headline feature**
- Implement exactly `06-behaviour-specs.md` section 1 in `gossip.ts` (Q40, Q40b, selection rule in TypeScript, Q41). Unit-test the selection rule separately.
- **Accept:** the golden table in `03-graph-model.md` passes exactly (tick 1: mira 0.9 + ayla 0.5; tick 2: fenn 0.72 + garrick 0.63; tick 3: tilda 0.36 via fenn; tick 4: nothing). `spread` with `maxHops:1` reaches {mira, ayla}; with `3` reaches all five. `advanceTime` increments the tick. `spread` does not. No duplicate KNOWS edges. **Checkpoint C2 requires this.**

### G6 — attitude and explain (Day 2 afternoon, 2.5 h)
- `opinion.ts` as pure functions per section 2 (with unit tests for the worked examples: Garrick -0.5625 `wary`, Brom -0.7632 `hostile`, boundaries). `attitude` tool uses Q51.
- `explain` per section 3 using Q60 + Q61 (fallback: walk `via`). Return `edgeIds` for UI highlighting.
- **Accept:** `explain(garrick, event)` returns chain `[brom, mira, garrick]`, confidences `[0.9, 0.63]`; `explain(tilda...)` before she hears returns `status:'not_in_graph'`; `explain(brom, event)` returns chain `[brom]`.

### G7 — LLM wrapper, firewall, say (Day 2 evening, 3.5 h)
- `llm.ts`: Gemini via Google's official Gen AI SDK for JS/TS (check npm for the current package name) or plain `fetch` to the REST API if the SDK is troublesome. Model from `GEMINI_MODEL`. JSON output. Timeout (8 s), one retry on 5xx, exponential backoff with jitter on 429, cache keyed by prompt hash (60 s). Returns a typed failure instead of throwing. Honour `HEARSAY_LLM=off`.
- `firewall.ts` pure functions per section 4 + unit tests (event id leak, keyword leak, player-introduced event, clean reply).
- `templates.ts` deterministic picker.
- `say` per the 9-step pipeline, using Q95/Q96/Q97, with a fake LLM injected in tests.
- **Accept:** with a fake LLM that returns a leaking reply, `say` retries then falls back to a template and reports `firewall.passed:false` with violations; a clean reply passes with `source:'llm'`; before gossip Garrick's reply cannot mention the theft even if the player does; `HEARSAY_LLM=off` yields templates only; Utterances persist and appear in the next prompt.

### G8 — adaptPolicy and gossipHubs (Day 3 morning, 1.5 h)
- Section 5 formulas with Q80/Q81. `gossipHubs` with Q70.
- **Accept:** three `lowballed` calls move Tilda's markup 0.10 -> 0.25 (cap 0.30 on a fourth and fifth); `fair` lowers by 0.02 with floor 0.05; `gossipHubs` returns the top N NPCs by PageRank on the seed (record the actual order in a test; Mira should rank high).

### G9 — MCP server (Day 3, 2 h) **SHOULD**
- `packages/mcp`: register every tool from `TOOLS` with the zod input schema and the descriptions in `04-tool-contract.md` (official `@modelcontextprotocol/sdk`). stdio transport; HTTP transport if time allows. `pnpm mcp` starts it.
- **Accept:** an MCP client (e.g. the MCP inspector, or a coding agent configured with the server) can list tools and call `newPlayer`, `recordEvent`, `advanceTime`, `explain`. Add a README snippet showing how to connect.

### G10 — Load test (Day 3, 2 h) **SHOULD**
- `loadtest/`: simulate N players (try 10, 50, 100) each: `newPlayer`, `recordEvent`, a few `advanceTime`, `recall`, `attitude`, `snapshot`, with concurrency K. `HEARSAY_LLM=off`. Report ops/sec and p50/p95/p99 for reads and writes separately, and the machine (CPU, RAM, Docker settings).
- **Accept:** `pnpm loadtest` prints a table and writes `loadtest/results.md` with real numbers. **Do not invent or round up numbers.** Report errors honestly.

### G11 — Persistence and Cloud smoke (Day 3, 1 h)
- Verify: record events, `docker compose restart falkordb`, `recall` still returns them. Document the exact steps (and whether `SAVE`/AOF was needed) in `08-deployment.md`.
- With DuroT, point the app at the FalkorDB Cloud free instance; confirm `ensureWorld()` self-heals after the instance is empty.
- **Accept:** written, reproducible steps; both checks pass.

### G12 — Judge notes and query mirror (Day 3 night, 1 h)
- Make `queries/*.cypher` match the code exactly (a small script that dumps the constants is fine). Update `05-queries.md` with final syntax. Add your "I can explain this" notes (5 items) to the bottom of this file.
- **Accept:** a diff between `queries/` and the code constants shows nothing; you can explain Q40, Q41 and Q61 line by line.

### G13 — Control NPC `sayNaive` (Day 3, 1.5 h) **SHOULD; do after G7; needed by UI task U12**
- Implement `sayNaive` per `06-behaviour-specs.md` section 8 with Q98. Not registered in MCP. Add the zod entry exactly as in `04-tool-contract.md`.
- **Accept:** with a fake LLM, the prompt sent by `sayNaive` contains **every** event the player did (including ones the NPC does not know), while `say`'s prompt contains only known events; `leaked` is true when the reply contains an unknown event's keyword and false otherwise; no Utterances are written; with `HEARSAY_LLM=off` it returns a `templates.naive` line with `source:'template_fallback'`.

### Day 4
Bugs only. Support DuroT on integration issues. Review the README graph sections. Verify the fresh-clone setup on a clean machine or container.

## Done list you maintain

Add a line per finished task: `G5 done <date/time> <commit>`.

G2 done 2026-10-17 04:06 WAT ff6e1bf (helper: 142ca76). Live helper and query spike pass; Browser-first exception approved by Goodness. See `spike-results.md` for the Q61 correction and test evidence.

G3 done 2026-10-17 04:25 WAT 1563afc (seed validation: e9b2e23). World initialization, reads, isolated player creation/reset and publication races pass live tests. Uses the explicitly allowed three-NPC seed pending D1; see `G3-world.md` and R-003.

G4 done 2026-10-17 04:42 WAT 94ef432 (record/recall: 9e8f377). Four live memory tools, stable snapshots and the six-NPC golden witness check pass. Full workspace: typecheck and 57 tests pass. Production content remains the three-NPC stub; UI integration remains pending. See `G4-memory.md`.

G5 done 2026-10-17 04:56 WAT 46e8ce9 (engine: 00f7d90; selection: 9e33b61). Live advanceTime/spread match golden ticks, confidence decay, depth limits and duplicate prevention. Typecheck and 69 workspace tests pass. Production seed and live UI integration remain pending; one setup failure correlated with background-save/fork contention. See `G5-gossip.md` for evidence and concurrency limits.

G6 done 2026-10-17 05:07 WAT 7de8bf8 (scoring: 7ef8267). Live attitude/explain tools return exact scores, actual event-specific telling paths and snapshot highlight IDs; five-hop fallback verified. Typecheck and 91 workspace tests pass. Arithmetic examples corrected without changing the formula (R-004). See `G6-opinion.md` for real/mock boundaries and the recurring reset-copy infrastructure issue.

G7 done 2026-10-17 05:24 WAT 7f7a719 (pipeline: 2f12bac; REST wrapper: 431b6bc; firewall/templates: 157b654). Graph-scoped say prompts, leak retry/fallback, saved conversation history and Gemini transport safeguards pass typecheck and 113 workspace tests. Database tests are real; generation/HTTP cases use injected fakes. No key/model is configured, so live Gemini remains unverified. See `G7-dialogue.md` for API usage, known firewall limits and the recurring copy/background-save failure.

G8 done 2026-10-17 05:37 WAT 65eafb9 (copy contention mitigation cb8e57a). Typecheck and 115 tests pass. Live Tilda policy sequence/floor/counters and PageRank order verified; see G8-policy.md and copy-retry.md. Full production seed/UI remain pending.

G9 done 2026-10-17 05:55 WAT c23c727. Typecheck and 117 tests pass, including actual stdio client/server calls on live FalkorDB. See packages/mcp/README.md and G9-mcp.md. sayNaive is excluded; optional HTTP transport is not implemented.

G10 done 2026-10-17 06:01 WAT d0597f8. All 1,280 measured tool calls pass at N=10/50/100, concurrency=5, with zero cleanup errors. Raw samples, machine and p50/p95/p99 are committed in loadtest/. Typecheck and 117 workspace tests pass. Current production stub has three NPCs; this is not a final-town capacity claim.

G11 local verification 2026-10-17 06:05 WAT f9b9272. Actual container restart preserves event, gossip, tick and conversation; local template self-healing passes. Typecheck and 117 tests pass. Full G11 remains pending Cloud/app validation under R-005; see G11-persistence.md and G11-results.json.

G11 Cloud core verified 2026-10-17 08:27 WAT (username support a9e9caf). Actual empty Cloud instance initialization, template recreation, event roundtrip and fresh-connection recall pass; cleanup returns zero graphs. Typecheck, 125 tests and 49 query mirrors pass. See G11-cloud.md and G11-cloud-results.json. Only live website integration/recovery remains under R-005; full G11 is still partial.

G12 done 2026-10-17 06:12 WAT 77a3817. All 48 query mirrors and their hashes match canonical source, intentional drift is rejected, typecheck and 117 tests pass. See G12-judge-notes.md for line-by-line explanations.

G13 done 2026-10-17 06:16 WAT 650923a (plain-text wrapper 9a63ffc). Control dialogue reads all player events, measures leaks without blocking, writes no conversation history and remains excluded from MCP. Typecheck, 124 tests and all 49 query mirrors pass. See G13-control.md and G8-G13-results.md for the final handoff and remaining external checks.

## My "I can explain this" notes

- G2: Node client `data` already contains alias-keyed rows. The helper normalizes missing write-only data to `[]` and measures the whole explicit operation.
- G2: Reads call `roQuery`; a live test proves an attempted write is rejected without adding a node. Database errors return safe envelopes and traces rather than raw Cypher or credentials.
- G2: Q61 sorts and limits `path` in a WITH clause before converting it into lists. Sorting by a dropped path alias after RETURN fails on the tested FalkorDB image.
- G2: The golden gossip spike chooses one best candidate per listener between read/write rounds. New knowers cannot spread until the next round; the production implementation remains G5.
- G2: GRAPH.COPY preserved all four operational ID range indexes on the recorded image digest. PageRank ranks Mira highest in the locked trust network.
- G3: Validate references before writing, then publish a fully seeded temporary graph. Existing template graphs are never silently replaced when seed content changes.
- G3: Initialize the Player node in a temporary template copy before publishing `player:{id}`. Another creator sees a complete save, and gameplay never writes the template.
- G3: Reset rebuilds one player's graph from template values. The tests change tick, events, traits and a policy in A, prove B/template unchanged, then verify reset restores the defaults.
- G4: Validate all witness/place IDs before Q30. The query binds values and creates the Event and its direct-witness KNOWS edges; duplicate witnesses are removed first.
- G4: Successful empty recall means this NPC has no graph knowledge of this player's events. An unknown NPC is a separate error, not empty knowledge.
- G4: Graph snapshots use `kind:id` from our properties; KNOWS/TOLD edge IDs include the event ID. Metadata nodes and their incident edges stay hidden. Separate reads are not a transactional snapshot during concurrent writes.
- G5: TRUSTS points from listener to teller. Credibility is teller confidence times that edge's weight. Tilda hears Fenn's 0.36 rather than Garrick's 0.315 because the stronger candidate wins.
- G5: Read all candidates before writing a round. Newly informed NPCs wait until the next round; advanceTime runs one round and increments the clock, while spread runs bounded rounds without changing time.
- G5: Q41 skips listeners already aware at write time and reports actual additions. A per-service player queue orders gossip calls, but independent services and resets require stronger coordination; gossip writes and clock updates are not one transaction.
- G6: Attitude reads only this NPC's known player events. Multiply event weight, confidence, recency and trait factor; clamp the summed score. Garrick is -0.562464/wary and Brom -0.7632/hostile at tick 2.
- G6: Explain traverses actual TOLD edges for one event and original witness. Its IDs match snapshot. An unaware NPC gets not_in_graph; missing/corrupt provenance is an explicit error, not a generated justification.
- G6: Repeated advanceTime can exceed four hops. The fallback follows via pointers while checking each actual TOLD link, decreasing hop and consistent root; it cannot invent a missing edge or follow a cycle indefinitely.
- G7: Only NPC-known events and their BELIEVES facts become authoritative prompt context. Player claims remain unverified speech. Unknown-event data stays server-side for the firewall, never in the known-event section.
- G7: Reject unknown event IDs, keywords and subject words; retry once, then choose a checked seed template. Save accepted replies only. This is a lexical firewall with documented limits, not a semantic guarantee against every paraphrase.
- G7: Conversation ownership is scoped through Player/STARTED/Conversation/BETWEEN/NPC. History is real Utterance data; off mode bypasses even an injected model, and default Gemini generation has an 8-second request/retry budget.
- G12: Q40 reads KNOWS and listener-to-teller TRUSTS; select a complete round before writing. Credibility is multiplied, never invented.
- G12: Q41 binds selected maps, rechecks awareness and writes KNOWS plus TOLD with event/root provenance. The single write does not make a tick transactional.
- G12: Q61 keeps path in WITH while sorting and filters every telling edge by event/root. G12-judge-notes.md explains each line and the checked long-chain fallback.
- G12: Generated .cypher files come from literal source constants, with hashes and a drift check; they are not another hand-maintained implementation.
- G12: State evidence limits: real local database/MCP/restart/load checks, fake model tests, unverified Gemini/Cloud, pending full production seed and website integration.
