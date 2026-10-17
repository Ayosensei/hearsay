# G5 — gossip driven by live graph relationships

`createGossip(db, world?)` exposes advanceTime and spread. Use the same database and world service as createMemory. The shared input/output contract is unchanged and no dependencies were added.

```ts
import { createGossip } from '@hearsay/core';

const gossip = createGossip(db, world);
const tick = await gossip.advanceTime({ playerId: 'demo' });
const experiment = await gossip.spread({
  playerId: 'demo', eventId, maxHops: 3, minCredibility: 0.25,
});
```

## How it works

The database finds tellers who KNOW an event and listeners who TRUST those tellers but do not yet know that event. The trust edge points from listener to teller. Candidate confidence is teller confidence multiplied by that trust weight. Events need absolute weight at least 0.3; the default confidence cutoff is 0.25.

For each event/listener pair, TypeScript selects the strongest teller; equal confidence chooses the alphabetically first teller ID. Candidate input is not mutated, and result ordering is stable. One round reads every candidate before writing any of them. Someone who just learned an event cannot become a teller until the next round.

Q41 writes the listener's KNOWS edge and the teller's TOLD edge together, preserving the original witness root. Listener hop is teller hop plus one. A write-time guard skips already-aware listeners and returns only actual additions. Game events themselves are unchanged.

advanceTime runs one round for every eligible event, stamps knowledge with the new tick, then increments Player.tick. Even a round with no listeners advances the clock. spread runs rounds for one validated event, enforcing an absolute maximum listener hop as well as a maximum round count. It leaves Player.tick unchanged and stamps additions with the current tick. reached contains only newly reached NPCs in that call.

The final spread read examines remaining paths with zero confidence cutoff and no practical hop cap. Credible remaining paths give max_hops; remaining paths all below the requested confidence give min_credibility; no remaining eligible trust paths gives no_listeners. An event below the gossip weight cutoff returns no_listeners. This diagnostic read never writes outside the requested limits.

## Verified behavior

The six-NPC synthetic golden world produces these actual additions:

| Tick | Listener | Teller | Confidence | Hop |
| --- | --- | --- | --- | --- |
| 1 | Ayla | Brom | 0.50 | 1 |
| 1 | Mira | Brom | 0.90 | 1 |
| 2 | Fenn | Mira | 0.72 | 2 |
| 2 | Garrick | Mira | 0.63 | 2 |
| 3 | Tilda | Fenn | 0.36 | 3 |
| 4 | Nobody | — | — | — |

Tilda chooses Fenn's 0.36 over Garrick's 0.315. Numeric checks use tolerance 1e-9. The graph ends with six KNOWS and five TOLD edges, and the event's properties remain unchanged. Garrick's recall stays not_in_graph after the first tick.

Fresh spread at depth one reaches Ayla/Mira and returns max_hops. Fresh default depth three reaches all five hearers and returns no_listeners. Repeating spread adds nothing. Spreading deeper after a shallow call reports only the additional three hearers. The game clock stays zero throughout those spread tests.

Nine new live integration tests cover the golden rounds, depth limits, confidence cutoff (including equality), absolute event-weight boundaries, all-event processing, quiet events, actual knowledge provenance, isolated players, sequential and concurrent replay, concurrent same-service ticks, mixed spread/tick calls, stale clock rejection and invalid arguments/IDs. Three pure tests cover strongest-source selection, ties, deduplication and nonmutation. Existing G2/G4 tests exercise the updated canonical Q41 too. All database checks use real local FalkorDB through its official client under Goodness's approved Browser-first exception.

Final workspace verification at 04:54 WAT: pnpm typecheck and pnpm test pass. 69 tests: 51 core (44 live database, 7 pure), 5 contract and 13 existing web mock tests.

## Real, synthetic and pending

Propagation, confidence calculation, provenance writes and query traces are real. No LLM or mocked database is involved. Generic personas and the six locked NPCs are synthetic test data. The production seed is still the three-NPC G3 stub pending DuroT's D1 delivery (R-003); the production service spreads only through relationships actually present there. The website still uses its mock engine. Live UI wiring, full production content and the rest of checkpoint C2 remain pending. G6 will expose attitude scores and explanation paths; G7 will add guarded dialogue.

## Concurrency and failure limits

Reuse one createGossip service per process: its per-player queue serializes advanceTime and spread while allowing independent players to run concurrently. No module-global player state is stored. Separate service instances, recordEvent and resetPlayer are outside this queue. Distributed one-hop scheduling and globally strongest-source selection are not guaranteed under overlapping calls from separate instances.

The Q41 write and Q21 clock update are separate operations. A failure between them can leave recorded gossip without a clock advance. The conditional clock update rejects an unexpected tick instead of overwriting it, but it cannot roll back earlier gossip. spread may also partially complete before a failure. Errors retain executed query traces; do not assume an error means nothing was written. There is no automatic write retry or rollback. G3's nontransactional reset limits still apply. No load or restart-persistence claim is made here.

## Issues encountered

One boundary-suite setup failed in ensureWorld with a sanitized INTERNAL database error before any gossip tool ran. The rerun and final full workspace suite passed. At the failure time, Docker logs show Redis starting a background save and FalkorDB repeatedly logging `Can't fork for module: File exists` before deleting a graph dump. This supports a graph-copy/background-save contention diagnosis; the copy/persistence issue is not fixed by G5.

The memory test harness now cleans up its database connection, tracked graphs and temporary seed directory if setup fails. Test failures include executed query IDs to help locate future failures. No durability setting was disabled, no failed test was suppressed, and no production write retry was introduced. No new gossip query syntax failures occurred.
