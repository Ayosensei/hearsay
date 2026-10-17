# G6 — attitudes and graph explanations

`createOpinion(db, world?)` exposes attitude and explain. Reuse the same database/world services as createMemory and createGossip. There are no new dependencies or contract changes.

```ts
import { createOpinion } from '@hearsay/core';

const opinion = createOpinion(db, world);
const reaction = await opinion.attitude({ playerId: 'demo', npcId: 'garrick' });
const reason = await opinion.explain({
  playerId: 'demo', npcId: 'garrick', eventId,
});
```

## Attitude logic

Q51 reads this NPC's loyalty/greed and only the events they KNOW that this player performed. No memories gives neutral, zero score and no contributions. For each known event:

```
recency = max(0.3, 1 - 0.05 * (currentTick - eventTick))
traitFactor = weight < 0 ? 0.7 + 0.6 * loyalty : 0.7 + 0.6 * (1 - greed)
effect = weight * confidence * recency * traitFactor
score = clamp(sum(effects), -1, 1)
```

The pure scoring function returns a contribution per event, preserving source and confidence. Individual effects are not clipped; only the total is. Negative actions affect loyal NPCs more, positive actions affect greedy NPCs less, and older events retain at least 30% of their recency factor. Labels follow the exact boundary order in the behavior spec. The tool records actual query traces and validates its output using the existing contract.

## Explanation logic

Validate player, NPC and player-owned event first. Q60 reads the NPC's KNOWS relationship. A valid event they never learned returns a successful not_in_graph response, not a fabricated reason. A direct witness returns a one-NPC chain, witness source and their KNOWS edge ID.

For hearers, Q61 traverses actual TOLD edges restricted to the event and original witness root. The result supplies NPC IDs/names and hop confidences. Returned chain length, final source and final confidence are checked against KNOWS. Highlight IDs use the same application-ID convention as snapshot, including the event suffix.

Q61 has a four-hop traversal bound, while repeated advanceTime can produce longer chains. When a successful Q61 read finds no path, the fallback follows KNOWS.via toward the witness. Every step checks decreasing hop, consistent root and an actual matching TOLD edge via Q62. Missing or contradictory provenance returns INTERNAL. The traversal cannot loop through visited NPCs. Database/query failures remain errors and are not silently replaced with an explanation.

## Evidence and issues

Fourteen pure tests cover exact worked examples, all label boundaries, total clamping, neutral abstention, recency floor, greedy reward reduction, zero confidence and nonmutation. Eight new live integration tests cover golden attitudes and explanation, direct witness/unaware results, snapshot highlight IDs, multiple event paths/contributions, isolated players, five-hop fallback, missing/corrupt provenance and invalid identifiers. The updated Q61 also passes the G2 live spike regression. Direct official-client verification continues under Goodness's previously approved Browser-first exception.

After the theft and two real advanceTime calls, Garrick is wary at -0.562464 and Brom is hostile at -0.7632. Garrick's actual chain is Brom -> Mira -> Garrick with confidences 0.9 and 0.63. Every returned highlight ID is present in snapshot. Tilda before hearing returns not_in_graph. A synthetic five-hop trust chain exercises five verified Q62 links; this modifies a disposable test graph only.

The original worked examples contained rounding/arithmetic inconsistencies. R-004 records the correction to exact values while preserving the specified formula; Garrick rounds to -0.5625 at four decimals. No score or label was hardcoded to match the examples.

One boundary test run passed the five-hop check, then three reset hooks failed at Q01_graph_copy before running their G6 assertions. Server logs show BGSAVE starting at 04:05:49 UTC and repeated module-fork failures during those copies, followed by successful save completion. The rerun passed all four boundary tests. This is the pre-existing copy/background-save infrastructure issue documented in G5; it remains unresolved. No test was suppressed, no persistence settings were changed and no production write retry was added.

Final verification at 05:07 WAT: pnpm typecheck and pnpm test pass all 91 workspace tests (73 core: 52 live database and 21 pure; 5 contract; 13 existing web mock). GRAPH.LIST is empty after cleanup. No G6 query syntax failures occurred.

## Real and pending

Both tools read actual FalkorDB knowledge/provenance and return measured traces. Attitude arithmetic is deterministic TypeScript, not an LLM judgment. Explanations are real paths, not generated text. The six-NPC tests use synthetic data. Production still uses the three-NPC stub pending D1, and the website still uses its mock engine. HTTP/MCP wiring and dialogue/firewall are not added in G6. No Gemini calls were made.

These tools perform multiple separate reads, so concurrent gossip/reset can produce an inconsistent view and an error; they do not provide a transactional snapshot. Normal reads do not change player graphs. Valid calls retain the existing ensureWorld self-healing check, which can rebuild a missing template. Existing G3 reset and G5 partial-write/distributed scheduling limits still apply.
