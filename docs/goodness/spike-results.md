# G2 live FalkorDB spike — 2026-10-17

Goodness approved using the official Node client/CLI against the live local database instead of the Browser-first workflow after both browser automation paths timed out. These are real database checks, not mocked or Browser UI checks.

Test environment: Node 24.16.0; `falkordb@6.8.0`; local `falkordb/falkordb:latest` image digest `sha256:b0bdcac2cbaff989e77cb0610439b7a9289e86de033ccbbd4368b66fb680ae7a`; Redis `MODULE LIST` reports graph module version integer `42201`. Results describe this pinned image digest, not every FalkorDB release.

## Client and helper

- Official client: `falkordb@6.8.0`, selected from the [official client list](https://docs.falkordb.com/getting-started/clients) and inspected in the installed package.
- Connection: `FalkorDB.connect({socket: {host, port, connectTimeout, reconnectStrategy: false}, password?})`. Host, port and password default to `FALKORDB_*` environment variables.
- Queries: `selectGraph(name).query(query, {params, TIMEOUT})`; reads use `roQuery`.
- Results: the client already returns `data: [{alias: value}]`; write-only replies omit `data`, normalized to `[]` by the helper. No second row decoder is needed.
- Entity shapes verified by the live snapshot tests: nodes have internal `id`, `labels`, `properties`; edges have internal `id`, `sourceId`, `destinationId`, `relationshipType`, `properties`. Application IDs must come from `properties.id`.
- Entity decoding may issue internal client metadata reads (`db.labels`, `db.relationshipTypes`, `db.propertyKeys`). A helper trace measures the whole explicit operation, not each internal metadata command.
- Graph operations use the official `list()`, `selectGraph(source).copy(destination)` and `selectGraph(name).delete()` methods; none needs raw Cypher interpolation.
- Six live helper tests pass: bound strings containing quotes/newlines, trace fields/timing, empty reads, read-only write rejection without mutation, sanitized server errors and nested credential redaction, closed/refused connection handling. Write-only setup is also verified.
- No automatic write retries. Errors return the shared envelope with `DB_UNAVAILABLE` or `INTERNAL`, including failure traces; raw driver messages/Cypher are not returned.

Run: `pnpm --filter @hearsay/core test`. Tests create uniquely named `test_*` graphs and delete only their own graphs on completion. They require the real Compose database.

## Query results

The spike seeds all six locked NPC IDs/traits and all 13 locked TRUSTS edges, plus a synthetic player, forge, event, and excluded metadata nodes. It does not create the production seed/content or world loader (G3).

| Check | Result | Evidence / decision |
| --- | --- | --- |
| Q30 `WITH e` then `UNWIND $witnesses` | PASS | Brom becomes the sole witness with confidence 1, via `witness`, hop 0. No per-witness fallback needed. |
| Q40 `NOT (b)-[:KNOWS]->(e)` | PASS | Golden rounds reach Ayla/Mira, Fenn/Garrick, Tilda, then nobody. No OPTIONAL MATCH fallback needed. |
| Q40b event/depth parameters | PASS | Depth 1 yields Ayla and Mira; a different event yields no candidates. |
| Q41 UNWIND list-of-map parameters | PASS | Multiple candidate maps write correct KNOWS/TOLD edges. An empty list writes nothing. |
| Q61 original projected RETURN + `ORDER BY length(path)` | FAIL | Server: `_AR_EXP_UpdateEntityIdx: Unable to locate a value with alias path within the record`. It can appear to work when no path exists; a real nonempty path exposed it. |
| Q61 revised `WITH path, length(path) AS hops ORDER BY hops LIMIT 1 RETURN ...` | PASS | Garrick returns `[brom,mira,garrick]`, names and confidences `[0.9,0.63]`. Unknown event and pre-gossip Tilda return no rows. Same output shape; no via-walk fallback needed. |
| `all(r IN relationships(path) ...)`, node/edge list comprehensions | PASS | Explanation excludes TOLD chains for other events and returns the expected lists. |
| Q70 `algo.pageRank('NPC','TRUSTS')` | PASS | Works through `roQuery`. Observed order: Mira, Tilda, Fenn, Garrick, Brom, Ayla. Full order asserted in regression test. |
| Q90 `NOT n:Label` predicates | PASS | Returns 9 visible nodes (6 NPCs, Player, Place, Event), excludes Conversation/Utterance/EventType. TRUSTS edge decodes with weight 0.9. |
| Index DDL | PASS | `CREATE INDEX FOR (...) ON (...id)` creates NPC, Event, Player, Place range indexes. |
| GRAPH.COPY carries indexes | PASS | Copy contains all four `NODE` indexes, each with properties `[id]` and status `OPERATIONAL`; lookup returns Garrick. No index recreation needed on the tested version. |
| Scalar/list/map binding from Node | PASS | Quote/backslash/newline payload round-trips literally; witness lists and candidate maps work via `{params}`. |

Golden credibilities (asserted with 1e-9 tolerance): tick 1 Ayla 0.5, Mira 0.9; tick 2 Fenn 0.72, Garrick 0.63; tick 3 Tilda 0.36 via Fenn (beats Garrick's 0.315); tick 4 none. Exactly six KNOWS edges remain, including Brom's witness edge.

Regression commands: `pnpm typecheck && pnpm test`; detailed spike output: `pnpm --filter @hearsay/core test --reporter=verbose`. Query constants live in `packages/hearsay/src/queries/spike.ts`; the corrected Q61 also replaces the planned query in `docs/shared/05-queries.md`. Query mirrors for submission remain G12.

Final verification: typecheck passes across the workspace; 29 tests pass (13 web mock tests, 5 contract tests, 6 live helper tests, 5 live query-spike tests). All scratch graphs were removed by test teardown. The web app still uses its mock client; this task does not claim live UI integration or production tool implementations.

## G4 follow-up verification — 2026-10-17

Tested through the same official Node client and live local FalkorDB, under Goodness's approved direct-client exception. Production constants now live in `queries/memory.ts`; the spike reexports Q30/Q90 to prevent divergence.

| Check | Result | Evidence / decision |
| --- | --- | --- |
| Q24 optional witness resolution | PASS | Mixed existing/missing NPCs return UNKNOWN_NPC before Q30; no Event is created. |
| Q25 place resolution | PASS | Missing place returns UNKNOWN_PLACE before Q30. |
| Q26 player-scoped event resolution | PASS | whoKnows/focused snapshot reject absent and other-player events without running the view query. |
| Q30 tool integration | PASS | Default/zero weights, deduplicated witnesses, current tick, concurrent random IDs and literal query-looking subjects verified. |
| Q42 witness/hearer/unaware partition | PASS | Golden theft yields Brom and five unaware; one seeded Q41 retelling yields Mira via Brom, confidence 0.9 and hop 1. Automated propagation remains G5. |
| Q50 recall ordering and LIMIT binding | PASS | Brom's witnessed theft has confidence 1 and source witness; Garrick knows nothing; later ticks precede earlier ticks and limit is honored. |
| Q90 stable entity mapping | PASS | Application property IDs produce Event/KNOWS/TOLD graph IDs. Other-player snapshot contains no recorded Event. |
| Q90 hidden edge endpoints | CORRECTED / PASS | Original planned edge query omitted EventType filtering. Added both endpoint predicates; hidden metadata and incident edges leave the visible snapshot unchanged. |

Thirteen G4 integration tests use a six-NPC synthetic test seed. Production still uses the three-NPC stub pending D1 (R-003). One new test's accidentally overlength missing-player ID produced BAD_ARGS; corrected the test ID and verified UNKNOWN_PLAYER. No database query syntax failures or new dependencies in G4. See `G4-memory.md` for API usage and concurrency limits.

## G5 production gossip verification — 2026-10-17

Q40/Q40b/Q41 are now canonical in `queries/gossip.ts`, with the spike reexporting them. Live official-client verification continues under Goodness's approved direct-database exception.

| Check | Result | Evidence / decision |
| --- | --- | --- |
| Q40 production advanceTime | PASS | Four calls produce golden additions 2, 2, 1, 0; ticks 1, 2, 3, 4. New knowledge records the new tick and original witness root. |
| Q40b production spread | PASS | Fresh depth 1 reaches Ayla/Mira; fresh depth 3 reaches all five; the clock remains zero. Repeated spread writes nothing. |
| Confidence and event-weight thresholds | PASS | Confidence exactly 0.9 includes Mira; remaining weaker paths report min_credibility. Weights +0.3/-0.3 gossip; +0.299 and default traded do not. |
| Q41 guarded write and returned rows | PASS | Added NOT-KNOWS guard and actual-addition RETURN. Two concurrent identical batches return row counts 0 and 1; only one new KNOWS/TOLD pair exists. |
| Q21 conditional clock increment | PASS | Expected prior tick advances once; reusing a stale tick returns no rows. Four simultaneous same-service advanceTime calls serialize to unique ticks. |
| Graph provenance and isolation | PASS | Tilda learns via Fenn at 0.36; events stay unchanged; other-player memories remain empty. |
| Teller selection (pure TypeScript) | PASS | Highest credibility, ASCII teller tie-break, per-event/listener deduplication, stable output and no input mutation. |

Final check: typecheck and all 69 workspace tests pass (51 core, 5 contract, 13 existing web mock). Nine new live G5 tests and three pure selection tests were added. Production content/UI integration still pending; this is not a C2 end-to-end UI claim.

One initial boundary-suite setup failed in ensureWorld before gossip ran. At that time the server logged a background save and repeated `Can't fork for module: File exists` messages, supporting graph-copy/background-save contention. The rerun and final full suite passed. This infrastructure issue remains unresolved; G5 improves failed-setup cleanup and records query IDs in test diagnostics. No automatic production write retry was added. See `G5-gossip.md` for partial-write and independent-service concurrency limits.

## G6 attitude and explanation verification — 2026-10-17

Q51/Q60/Q61/Q62 now live in `queries/opinion.ts`; the spike reexports the production Q61. Checks use real FalkorDB through the official client under Goodness's approved direct-database exception.

| Check | Result | Evidence / decision |
| --- | --- | --- |
| Q51 optional known-event inputs | PASS | A known NPC with no memories yields neutral/zero/empty; unknown NPC is rejected first. Only player-performed, NPC-known events contribute. |
| Exact scoring and boundaries | PASS | Pure tests cover all boundaries, recency floor, traits, confidence and total clamping. At tick 2 Garrick -0.562464/wary, Brom -0.7632/hostile. R-004 corrects example arithmetic, not the formula. |
| Q60 witness/unaware results | PASS | Brom returns a one-NPC witness chain and KNOWS ID; pre-gossip Tilda returns not_in_graph with no chain or edges. |
| Q61 production graph path | PASS | Garrick returns Brom/Mira/Garrick and confidences 0.9/0.63. The event/root predicate excludes other events' telling paths. All highlight IDs exist in snapshot. |
| Q60/Q62 long-chain fallback | PASS | A synthetic five-hop trust chain exceeds Q61's bound; five real TOLD link checks reconstruct the six-NPC chain. |
| Missing/corrupt provenance | PASS | Missing TOLD edges and contradictory via pointer return INTERNAL; no explanation is invented. |
| Isolation / validation | PASS | Other-player event IDs fail before path queries; unknown player/NPC/event and malformed arguments stop at their validation boundary. |

Eight new live tests and fourteen pure tests added. Final typecheck and all 91 workspace tests pass (73 core, 5 contract, 13 existing web mock). GRAPH.LIST is empty after teardown. No new dependencies or contract changes.

One boundary run had three failing reset hooks at Q01_graph_copy, after its five-hop test passed. Logs show BGSAVE beginning 04:05:49 UTC and repeated `Can't fork for module: File exists` during those copies. The boundary rerun and final suite passed. The pre-existing copy/background-save issue remains unresolved; no tests were suppressed, persistence settings changed or production writes retried. See `G6-opinion.md` for read consistency limits and outstanding UI/content integration.

## G7 dialogue verification — 2026-10-17

All new dialogue queries are canonical in `queries/dialogue.ts`. Official-client tests use live local FalkorDB under Goodness's existing direct-database exception. No new dependencies or contract changes.

| Check | Result | Evidence / decision |
| --- | --- | --- |
| Q23 conversation ownership | PASS | Valid same-player/NPC continuation works; foreign, missing and other-NPC IDs return BAD_ARGS before writes. |
| Q50/Q51 + Q92/Q93/Q94 prompt context | PASS | Known theft appears after real gossip with Mira source/63% confidence and wary attitude. Before gossip its ID/subject are absent from system knowledge. Only Mira receives her assigned weather belief. |
| Q95/Q96 conversation writes | PASS | Actual Conversation/Utterance links persist player and accepted NPC text. Rejected leaking drafts are never saved. Query-looking text remains literal input; NPC count stays six. |
| Q97/Q97b history/count/order | PASS | New service instance reads the prior pair into its prompt. Same-service concurrent turns save sequence 0..5. Other-player history is empty. |
| Q99 unknown event input | PASS | Server-only event/subject/keyword results trigger leak checks but are never appended to model knowledge. Player's own claims remain unverified user messages. |
| Firewall/template behavior | PASS | Reject two injected leaking replies then save safe fallback with passed:false; accept a clean retry; off bypasses provider; reject unsafe templates and use wordless abstention if necessary. |
| Gemini REST wrapper | SIMULATED HTTP PASS | Seven tests cover configured request/header/JSON shape, deadlines, 5xx/429 bounds/backoff, cache expiry, malformed output and disabled/missing configuration. No actual Gemini request made. |

Final typecheck and all 113 workspace tests pass (95 core, 5 contract, 13 existing web mock). G7 added nine live-database tests, seven simulated-HTTP wrapper tests, five pure firewall/template tests and one prompt-history test. Test graph cleanup verified with empty GRAPH.LIST.

One initial boundary run failed a reset hook at Q01_graph_copy before its clean-retry assertion; logs at 04:21:07 UTC show background saving and module-fork contention. The boundary rerun and final full suite passed. This existing infrastructure issue is still unresolved. No test suppression, durability change or automatic write retry. No G7 Cypher syntax failures.

Live Gemini quality/quota/latency remains unverified because no key/model is configured. Production content remains the three-NPC stub and the website still uses mocks. See `G7-dialogue.md` for lexical-firewall, partial-write and concurrency limits.
