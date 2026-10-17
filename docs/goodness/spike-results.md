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
