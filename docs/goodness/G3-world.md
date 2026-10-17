# G3 world and player lifecycle

`createWorld(db, options?)` exports `ensureWorld()`, `getWorld()`, `newPlayer({playerId,name?})` and `resetPlayer({playerId})`. The three public tool methods use the unchanged shared inputs/outputs and error envelopes. The caller owns and closes the database connection.

## Seed loading

The default seed path is resolved relative to the package module, so launching from `apps/web` or the repository root does not change which file is read. Zod validates the complete seed before any write: IDs, properties, unique nodes/edges, policy bounds, all relation references, and required template states. Malformed JSON or bad references return an explicit INTERNAL failure, not a silently partial world.

G3's explicitly allowed temporary seed contains Brom, Mira and Garrick. DuroT's full six-NPC D1 seed is still needed (R-003). Tests add synthetic faction/policy records to cover every supported loader kind; those records are not production content.

`ensureWorld` checks GRAPH.LIST. If the template exists, it does not write or reload the file. Otherwise it loads nodes, relationships and four range indexes into a uniquely named temporary graph, then publishes the completed graph with GRAPH.COPY and cleans up the temporary graph. Concurrent calls in one instance share initialization; independent instances can race to publish, with the loser accepting the already-published template.

Templates stay in the JSON seed for the later dialogue pipeline; they are not map-valued graph properties. Only scalar and array properties are persisted on world entities. Faction relationship types use separate fixed ALLIED_WITH/HOSTILE_TO queries rather than interpolating a type name.

## Player saves

Player graph names are derived only after validating PlayerId: `player:{id}`. New players receive an isolated template copy with one Player node and tick zero. To prevent a second creator from seeing an uninitialized graph, Q22 runs inside a temporary copy before that completed graph is copied to its final player name. This adds one copy operation; it is a correctness tradeoff, not a throughput claim.

Repeated creation returns `created:false` and verifies that the existing graph has its Player node. Concurrent creators are covered across service instances. Per-instance queues also serialize creation/reset of the same player; these queues are not distributed locks. Concurrent resets from independent service instances are not covered by G3's guarantees.

Reset prepares a fresh initialized copy before deleting the old player graph, publishes the replacement and returns tick zero. The replacement restores template NPC/policy values and removes player events. The final delete/copy pair is not a database transaction; an infrastructure failure during that pair returns a failure rather than claiming success. Resetting an absent player returns UNKNOWN_PLAYER with a newPlayer hint.

Every explicit database operation contributes its measured trace, including graph copy/delete/list operations attributed to their owning tool. Internal seed validation failures return an error envelope; raw driver failures and Cypher remain sanitized by the G2 helper.

## Validation

`pnpm typecheck && pnpm test` covers seed validation plus real FalkorDB tests for repeated ensureWorld, all seed relationship kinds, contract-valid getWorld, repeated newPlayer, cross-player isolation, template immutability, reset of tick/events/traits/policies, concurrent creators/initializers, invalid arguments, unknown players, and bad/missing seed files.

One initial parallel integration run saw a copy failure plus setup/cleanup timeouts; a direct diagnostic then completed 18 concurrent copies without reproducing the failure. Integration files now run sequentially against the shared local database with a 30-second hook allowance; the explicit concurrency tests still run concurrently. This is not evidence of production load capacity; G10 remains the load test.

The UI remains on its mock client. G3 does not implement recordEvent, gossip tools, live HTTP routes, MCP transport, or a persistence restart demonstration.
