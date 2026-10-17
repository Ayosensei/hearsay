# G4 — live episodic memory tools

`createMemory(db, world?)` now exposes `recordEvent`, `recall`, `whoKnows` and `snapshot`. Import it from `@hearsay/core`. The optional world service lets tests use disposable templates; normal callers can use the default world service.

```ts
import { connectDatabase, createWorld, createMemory } from '@hearsay/core';

const connection = await connectDatabase();
if (!connection.ok) throw new Error(connection.error.message);
const db = connection.data;
const world = createWorld(db);
const memory = createMemory(db, world);
try {
  const player = await world.newPlayer({ playerId: 'demo' });
  if (!player.ok) throw new Error(player.error.message);
  const event = await memory.recordEvent({
    playerId: 'demo', type: 'stole', placeId: 'forge', witnesses: ['brom'],
    subject: 'iron sword',
  });
  if (event.ok) {
    console.log(await memory.recall({ playerId: 'demo', npcId: 'brom' }));
    console.log(await memory.whoKnows({ playerId: 'demo', eventId: event.data.eventId }));
    console.log(await memory.snapshot({ playerId: 'demo', focusEventId: event.data.eventId }));
  }
} finally {
  await db.close();
}
```

## What happens

Inputs pass the existing shared Zod schemas. Malformed arguments return BAD_ARGS without a database call. A valid request checks the player's graph and Player node, then resolves every supplied NPC/place/event ID. A missing ID returns the appropriate UNKNOWN error and stops the request before the business query. Only valid requests perform the template self-healing check and continue.

recordEvent deduplicates witnesses, generates `ev_` plus 128 random bits encoded in base36, reads the player's current game tick and uses the event's default weight unless an explicit value was supplied (including zero). Q30 writes the Event, PERFORMED, HAPPENED_AT and direct-witness KNOWS relationships in one query. Witness confidence is 1, hop is 0 and source is `witness`. Recording does not advance time.

recall reads only events that this player performed and this NPC knows. Empty knowledge is a successful `not_in_graph` result. whoKnows partitions actual KNOWS edges into witnesses, hearers with provenance and unaware NPCs. snapshot converts decoded entities to stable contract IDs using application `id` properties. Conversation, Utterance and EventType nodes and their incident edges are excluded. A focus ID is checked, but the whole visible graph is returned; highlighting belongs to the UI.

Queries use bound parameters and reads use roQuery. Traces contain real measured query times and row counts, tagged with the owning tool and agent. Failed calls preserve completed trace steps. Template checks appear as their own system ensureWorld steps. The shared contract did not change.

## Evidence

Thirteen new live tests cover recording/recall, the six-NPC golden witness check, snapshots, heard provenance, game ticks, limits, isolated players, unique concurrent event IDs, duplicate witnesses, explicit zero weight, parameter binding, hidden metadata and invalid identifiers. All new production queries are exercised on real FalkorDB through its official Node client under Goodness's previously approved Browser-first exception.

The golden test records a theft at the forge witnessed only by Brom: Brom recalls exactly one event, Garrick returns not_in_graph, whoKnows returns Brom plus five unaware NPCs, and snapshot returns the Event and KNOWS edge. A separate test seeds one actual retelling using Q41 to check reading heard knowledge and TOLD IDs; it does not implement automatic gossip.

Final verification at 04:42 WAT: `pnpm typecheck` passes; `pnpm test` passes all 57 tests (39 core, 5 contract, 13 existing web mock tests). Core includes 35 live database tests and 4 seed-schema tests. GRAPH.LIST is empty after test cleanup.

## Real, synthetic and unfinished

All four core tools and their traces use the live database. The test harness uses the six locked synthetic NPCs and trust network, with generic test personas. The production seed remains the allowed three-NPC G3 stub pending DuroT's D1 content (R-003). Production whoKnows reports the NPCs actually present, so it returns two unaware NPCs with that stub.

The web app is still the existing mock implementation; G4 does not wire HTTP routes or MCP. Automatic gossip is G5, opinions/explanations are G6 and dialogue/firewall is G7. No Gemini calls were made. Persistence across container restart and load reliability remain unverified.

Snapshot tick/nodes/edges are separate reads, not a transactionally consistent point-in-time view during concurrent mutation. ID prechecks and the subsequent write are also separate operations: concurrent reset/deletion can interfere. G3's nontransactional reset and cross-instance reset limits still apply. Event IDs use random uniqueness rather than a database uniqueness constraint. Recall sorts newest tick first; ordering among events in the same tick is unspecified.

## Issues encountered

- The original Q90 edge filter excluded dialogue nodes but omitted EventType endpoints. Added both endpoint exclusions and verified that attaching a visible NPC to hidden metadata does not change the snapshot.
- One new UNKNOWN_PLAYER test accidentally generated an ID longer than the contract permits and correctly received BAD_ARGS. Shortened that test ID; the intended missing-player check now passes. No production behavior changed for this test correction.
- No G4 FalkorDB query syntax failures occurred. No new dependencies were added.
