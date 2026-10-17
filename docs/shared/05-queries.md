# 05 — Queries (Goodness owns)

Every query used by the product, with an id, purpose and parameters. These are the queries the hackathon submission must list. Mirror them in the repo's `queries/` folder (one `.cypher` file per query, plus a one-line comment).

## Read this before writing any query

- FalkorDB implements a **subset** of OpenCypher. Do not assume Neo4j-only syntax. Check `cypher/cypher-support` and `cypher/known-limitations` at https://docs.falkordb.com.
- **Test each query in FalkorDB Browser (port 3000) before putting it in code.** Record results in `docs/goodness/spike-results.md`.
- Queries below are the intended shape. The riskiest constructs are flagged **(verify)**. If one fails, use the stated fallback and note it.
- Parameters: always pass `$params`. Never interpolate strings. Check the Node client's parameter API (`graph.query(q, { params })` or equivalent) on https://docs.falkordb.com/getting-started/clients.
- Reads use `roQuery`.
- Bind a relationship to a variable if you reference the pattern more than once. FalkorDB's docs note that an unreferenced relationship in a pattern only checks that at least one matching relationship exists. Read `cypher/known-limitations`.
- Do not store maps as properties.

## Non-Cypher operations

| Id | Operation | Used by |
| --- | --- | --- |
| Q00_graph_list | `GRAPH.LIST` — does `world_template` / `player:{id}` exist? | `ensureWorld`, every tool (player existence) |
| Q01_graph_copy | `GRAPH.COPY world_template player:{id}` — raw command via the client's command interface | `newPlayer`, `resetPlayer` |
| Q02_graph_delete | `GRAPH.DELETE player:{id}` | `resetPlayer` |

## Indexes (run once on world_template, before copy, so copies carry them; verify copies keep indexes)

```
CREATE INDEX FOR (n:NPC) ON (n.id)
CREATE INDEX FOR (e:Event) ON (e.id)
CREATE INDEX FOR (p:Player) ON (p.id)
CREATE INDEX FOR (pl:Place) ON (pl.id)
```
G2 verified this DDL and that `GRAPH.COPY` preserves all four operational range indexes on the tested local image. `db.indexes()` returns `label`, `properties`, `types`, `entitytype` and `status` among other columns. See `docs/goodness/spike-results.md` for versions and evidence.

## World and player

**Q10_get_npcs** — who lives in the town.
```
MATCH (n:NPC)
RETURN n.id AS id, n.name AS name, n.role AS role, n.faction AS faction,
       n.greed AS greed, n.courage AS courage, n.loyalty AS loyalty
ORDER BY n.id
```

**Q11_get_places**
```
MATCH (pl:Place) RETURN pl.id AS id, pl.name AS name ORDER BY pl.id
```

**Q12_get_event_types** — event types are stored as `:EventType {type, weight, keywords}` nodes in the seed (keywords as an array). Add this label to the seed loader.
```
MATCH (t:EventType) RETURN t.type AS type, t.weight AS weight, t.keywords AS keywords
```

**Q20_get_player** — also the existence check for a player graph's Player node.
```
MATCH (p:Player {id: $pid}) RETURN p.id AS id, p.tick AS tick
```

**Q21_set_tick**
```
MATCH (p:Player {id:$pid}) WHERE p.tick=$previousTick
SET p.tick=p.tick+1 RETURN p.tick AS tick
```
G5 runs this after the round's knowledge write. Zero rows means the expected clock changed; the tool returns INTERNAL instead of overwriting it. These two queries are not a single transaction.

**Q22_create_player** — run inside the freshly copied player graph.
```
CREATE (p:Player {id: $pid, name: $name, tick: 0, createdAt: $at})
```

## Episodic memory: recording events

**Q30_record_event** — one event, one place, N witnesses. Validate all witness IDs with Q24 and the place with Q25 before writing. Q20 checks the player's node first.
```
MATCH (p:Player {id: $pid}), (pl:Place {id: $place})
CREATE (e:Event {id: $eid, type: $type, weight: $weight, tick: $tick, at: $at, subject: $subject})
CREATE (p)-[:PERFORMED]->(e)
CREATE (e)-[:HAPPENED_AT]->(pl)
WITH e
UNWIND $witnesses AS wid
MATCH (n:NPC {id: wid})
CREATE (n)-[:KNOWS {via: 'witness', root: wid, hop: 0, confidence: 1.0, tick: $tick}]->(e)
RETURN n.id AS witness
```
(verify: UNWIND after WITH; fallback: one CREATE per witness in a loop.) Pass `subject: ''` when absent.

## Gossip (the headline)

**Q40_gossip_candidates_all** — for `advanceTime`: every (event, teller, listener) that can spread this tick.
```
MATCH (a:NPC)-[k:KNOWS]->(e:Event)
MATCH (b:NPC)-[t:TRUSTS]->(a)
WHERE NOT (b)-[:KNOWS]->(e)
  AND abs(e.weight) >= $minWeight
  AND k.confidence * t.weight >= $minCred
RETURN e.id AS eventId, a.id AS teller, b.id AS listener,
       k.confidence * t.weight AS cred, k.root AS root, k.hop AS hop
```
Parameters: `minWeight = 0.3`, `minCred = 0.25`.
(verify: `NOT (b)-[:KNOWS]->(e)` pattern predicate. Fallback: `OPTIONAL MATCH (b)-[x:KNOWS]->(e) WITH ... WHERE x IS NULL`, or filter in TypeScript using Q42.)

**Q40b_gossip_candidates_one** — same, restricted to one event: add `AND e.id = $eid` to the WHERE clause. `spread` loops this up to `maxHops` rounds, with `AND k.hop < $maxHops`.

**Selection rule (TypeScript, not Cypher):** for each `(eventId, listener)` keep only the candidate with the highest `cred`; ties broken by teller id alphabetically. Then write all selected rows in one call. Newly written knowers do not tell until the next round or tick. (This is what makes rumors travel exactly one hop per tick.)

**Q41_gossip_write** — write the selected rows.
```
UNWIND $rows AS r
MATCH (a:NPC {id: r.teller}), (b:NPC {id: r.listener}), (e:Event {id: r.eventId})
WHERE NOT (b)-[:KNOWS]->(e)
CREATE (b)-[:KNOWS {via: r.teller, root: r.root, hop: r.hop + 1, confidence: r.cred, tick: $tick}]->(e)
CREATE (a)-[:TOLD {event: r.eventId, root: r.root, tick: $tick, confidence: r.cred}]->(b)
RETURN r.eventId AS eventId, r.teller AS teller, r.listener AS listener,
       r.cred AS cred, r.root AS root, r.hop AS hop
```
(verify: list-of-maps parameter with property access in UNWIND. Fallback: one small query per row.)
G5 verifies the write-time KNOWS guard on concurrent repeated batches. Q41 now returns only actual additions, so the tool does not report a listener skipped by the guard. The returned hop is the teller's hop; tool steps add 1 for the new listener.

**Q42_who_knows** — witnesses, hearers and the unaware for one event.
```
MATCH (n:NPC)
OPTIONAL MATCH (n)-[k:KNOWS]->(e:Event {id: $eid})
RETURN n.id AS npc, n.name AS name, k.via AS via, k.confidence AS confidence, k.hop AS hop
ORDER BY n.id
```

## Recall, attitude, explain

**Q50_recall** — what does this NPC know about the player, and how did they learn it.
```
MATCH (n:NPC {id: $nid})-[k:KNOWS]->(e:Event)<-[:PERFORMED]-(:Player {id: $pid})
OPTIONAL MATCH (e)-[:HAPPENED_AT]->(pl:Place)
RETURN e.id AS eventId, e.type AS type, e.weight AS weight, e.tick AS tick, pl.id AS placeId,
       k.via AS via, k.confidence AS confidence, k.hop AS hop
ORDER BY e.tick DESC
LIMIT $limit
```
`status` = `not_in_graph` when zero rows. This is NOT an error.

**Q51_attitude_inputs** — traits plus every known event; the score is computed in `opinion.ts` (pure function).
```
MATCH (n:NPC {id: $nid})
OPTIONAL MATCH (n)-[k:KNOWS]->(e:Event)<-[:PERFORMED]-(:Player {id: $pid})
RETURN n.loyalty AS loyalty, n.greed AS greed,
       e.id AS eventId, e.type AS type, e.weight AS weight, e.tick AS tick,
       k.via AS via, k.confidence AS confidence ORDER BY e.id
```

**Q60_explain_knows** — how/when this NPC learned this event.
```
MATCH (n:NPC {id: $nid})-[k:KNOWS]->(e:Event {id: $eid})
RETURN n.id AS npcId, n.name AS name, k.via AS via, k.root AS root,
       k.hop AS hop, k.confidence AS confidence
```
Zero rows -> `status: 'not_in_graph'`, `chain: []`.

**Q61_explain_chain** — the rumor path from the witness to this NPC.
```
MATCH path = (o:NPC {id: $root})-[:TOLD*1..4]->(n:NPC {id: $nid})
WHERE all(r IN relationships(path) WHERE r.event = $eid AND r.root = $root)
WITH path, length(path) AS hops
ORDER BY hops
LIMIT 1
RETURN [x IN nodes(path) | x.id] AS ids,
       [x IN nodes(path) | x.name] AS names,
       [r IN relationships(path) | r.confidence] AS confidences
```
G2 verified `all()` and both list comprehensions. The original `ORDER BY length(path)` after the projected RETURN failed at runtime (`Unable to locate a value with alias path within the record`). Sort and limit while `path` is still in scope, as above. The output columns are unchanged. Fallback if needed on another version: walk `k.via` repeatedly using Q60 until `via = 'witness'`. If `hop = 0`, the chain is just `[root]`.

G6 adds the root predicate to keep every edge on the original witness's chain. Q60 also returns the NPC's application ID/name for direct-witness explanations and fallback paths. A known event without this NPC's KNOWS edge returns not_in_graph; a nonexistent or other-player event is rejected before Q60.

**Q62_explain_link** — verify each actual TOLD edge while walking via pointers when Q61 returns no bounded path (including chains beyond four hops).
```
MATCH (:NPC {id:$from})-[r:TOLD]->(:NPC {id:$to})
WHERE r.event=$eid AND r.root=$root RETURN r.confidence AS confidence
```
Fallback requires the source hop to decrease by one, the root to remain unchanged, and the corresponding TOLD confidence to match the listener's KNOWS confidence. Missing/duplicate links or inconsistent provenance return INTERNAL, never an invented explanation. Visited NPC IDs prevent cycles. This fallback is for a successful Q61 read with no path; database/query errors are returned through the normal error envelope.

Canonical Q51/Q60/Q61/Q62 constants now live in `packages/hearsay/src/queries/opinion.ts`; the spike reexports Q61. G6 integration tests exercise all four on real FalkorDB. Returned highlight IDs exactly match snapshot IDs: `TOLD:NPC:brom->NPC:mira:ev_...` and final `KNOWS:NPC:garrick->Event:ev_...:ev_...`. Direct witnesses return their own single KNOWS edge ID and no hop confidences.

## Algorithms as tools

**Q70_gossip_hubs** — who spreads rumors furthest (PageRank over TRUSTS).
```
CALL algo.pageRank('NPC', 'TRUSTS')
YIELD node, score
RETURN node.id AS npc, node.name AS name, score
ORDER BY score DESC
LIMIT $limit
```
(verify on the player graph; PageRank on TRUSTS ranks NPCs that many others trust, which are the best rumor sources.) Other algorithms worth a look if time allows: shortest path (`algo.SPpaths`), betweenness centrality (the information broker), label propagation (derive factions from trust edges). See https://docs.falkordb.com/algorithms.

## Procedural memory

**Q80_policy_get**
```
MATCH (n:NPC {id: $nid})-[f:FOLLOWS]->(pol:Policy {id: $polId})
RETURN pol.markup AS markup, pol.minMarkup AS minMarkup, pol.maxMarkup AS maxMarkup, pol.step AS step,
       f.tries AS tries, f.wins AS wins
```

**Q81_policy_update** — new markup computed in TypeScript (see `06-behaviour-specs.md`).
```
MATCH (n:NPC {id: $nid})-[f:FOLLOWS]->(pol:Policy {id: $polId})
SET pol.markup = $markup, f.tries = f.tries + 1, f.wins = f.wins + $winInc
RETURN pol.markup AS markup, f.tries AS tries, f.wins AS wins
```

## Visualisation

**Q90_snapshot_nodes / Q90_snapshot_edges** — the graph is tiny (< a few hundred nodes), so return everything except conversation nodes.
```
MATCH (n) WHERE NOT n:Utterance AND NOT n:Conversation AND NOT n:EventType RETURN n
```
```
MATCH (a)-[r]->(b)
WHERE NOT a:Utterance AND NOT b:Utterance AND NOT a:Conversation AND NOT b:Conversation
  AND NOT a:EventType AND NOT b:EventType
RETURN a.id AS fromId, labels(a) AS fromLabels, r, b.id AS toId, labels(b) AS toLabels
```
(verify label predicates in WHERE and return shapes in the Node client; map entities to `GraphNode`/`GraphEdge` using our own `id` property, never FalkorDB's internal ids.) `focusEventId` only changes which edges the UI highlights; the server may ignore it.

## Conversation memory

**Q95_conversation_start**
```
MATCH (p:Player {id: $pid}), (n:NPC {id: $nid})
CREATE (c:Conversation {id: $cid, tick: $tick, at: $at})
CREATE (p)-[:STARTED]->(c)
CREATE (c)-[:BETWEEN]->(n) RETURN c.id AS id
```

**Q96_utterance_add**
```
MATCH (:Player {id:$pid})-[:STARTED]->(c:Conversation {id:$cid})-[:BETWEEN]->(:NPC {id:$nid})
CREATE (u:Utterance {id:$uid,speaker:$speaker,text:$text,tick:$tick,at:$at,sequence:$sequence})
CREATE (c)-[:HAS]->(u) RETURN u.id AS id
```

**Q97_recent_utterances** — last N lines of dialogue between this player and this NPC (for continuity in the prompt).
```
MATCH (:Player {id: $pid})-[:STARTED]->(c:Conversation)-[:BETWEEN]->(:NPC {id: $nid})
MATCH (c)-[:HAS]->(u:Utterance)
RETURN u.speaker AS speaker, u.text AS text, u.tick AS tick, u.at AS at,
       c.id AS conversationId, u.sequence AS sequence
ORDER BY u.at DESC, c.id DESC, u.sequence DESC
LIMIT $limit
```

## Control NPC (demo only)

**Q98_player_events_all** — every event the player has done, regardless of who knows it. Used only by `sayNaive` to build the "told everything" prompt.
```
MATCH (:Player {id: $pid})-[:PERFORMED]->(e:Event)
OPTIONAL MATCH (e)-[:HAPPENED_AT]->(pl:Place)
RETURN e.id AS eventId, e.type AS type, e.subject AS subject, pl.name AS place, e.tick AS tick
ORDER BY e.tick
```

## Test checklist per query

- Runs against a real FalkorDB with the golden seed.
- Returns the documented columns.
- Returns zero rows (not an error) when nothing matches.
- Does not leak across players (run the same query against two player graphs).

## G3 seed and world implementation

Canonical constants are in `packages/hearsay/src/queries/seed.ts` and `world.ts`. All writes use fixed query text and `$rows`/scalar parameters. G3's live integration tests execute every seed query, including policies and both faction relation types, against disposable graphs.

| Query ID | Question / parameters |
| --- | --- |
| Q03_index_npc/event/player/place | Create the four range indexes shown above; no parameters. |
| Q04_seed_factions | Create faction IDs/names from `$rows`. |
| Q04_seed_places | Create place IDs/names from `$rows`. |
| Q04_seed_npcs | Resolve each row's faction, create NPC scalar properties and MEMBER_OF. |
| Q04_seed_facts | Create Fact IDs/text/topics from `$rows`. |
| Q04_seed_policies | Create Policy IDs, kind and numeric markup bounds from `$rows`. |
| Q04_seed_event_types | Create event type/weight and keyword arrays from `$rows`. |
| Q04_seed_trusts | Resolve truster/trusted IDs and create weighted TRUSTS edges from `$rows`. |
| Q04_seed_believes | Resolve NPC/fact IDs and create confidence-bearing BELIEVES edges. |
| Q04_seed_follows | Resolve NPC/policy IDs and create FOLLOWS with tries/wins zero. |
| Q04_seed_allied | Resolve faction IDs and create fixed ALLIED_WITH edges. |
| Q04_seed_hostile | Resolve faction IDs and create fixed HOSTILE_TO edges. |

Q10/Q11/Q12 read template world data. Q20 checks a player's node. Q22 initializes the Player node inside a temporary template copy before publishing the final player graph. GRAPH.LIST/COPY/DELETE remain Q00/Q01/Q02; they are traced via the official client methods. Staging ensures failed seed loading cannot publish a partial template or player; see `docs/goodness/G3-world.md` for reset and concurrency limits.

## G4 memory implementation

Canonical constants for Q24/Q25/Q26/Q30/Q42/Q50/Q90 are in `packages/hearsay/src/queries/memory.ts`; G2's spike imports the same Q30/Q90 constants. All are covered by live tool integration tests. Goodness's approved direct-client exception to Browser-first verification still applies.

**Q24_resolve_npcs** — resolve every requested witness or recall subject, including missing IDs.
```
UNWIND $ids AS requested
OPTIONAL MATCH (n:NPC {id:requested}) RETURN requested, n.id AS id
```

**Q25_resolve_place** — resolve an event's location.
```
MATCH (pl:Place {id:$id}) RETURN pl.id AS id
```

**Q26_resolve_event** — validate an event belongs to this player before whoKnows or a focused snapshot.
```
MATCH (:Player {id:$pid})-[:PERFORMED]->(e:Event {id:$eid})
RETURN e.id AS id
```

Snapshots use application properties for IDs: `NPC:brom`, `Event:ev_...`. Edge IDs are `${type}:${from}->${to}` with `:${eventId}` appended for KNOWS/TOLD. KNOWS gets the event ID from its destination; TOLD gets it from its `event` property. Internal database entity IDs are never exposed as graph IDs. Hidden metadata is excluded at both edge endpoints. `focusEventId` is validated when present; the full visible graph is returned for client highlighting.

## G5 gossip implementation

Canonical Q21/Q40/Q40b/Q41 constants live in `packages/hearsay/src/queries/gossip.ts`; the G2 spike reexports the same candidate/write queries. `gossip.ts` runs them through the traced helper and `gossip-selection.ts` picks one highest-confidence teller per event/listener (ASCII ID order breaks ties).

advanceTime reads candidates once, writes the selected batch with `tick=current+1`, then conditionally increments the clock. spread runs up to the requested number of rounds for one validated event, with the listener's absolute hop constrained to maxHops. It stamps knowledge with the unchanged current tick.

After spread, a final Q40b read uses `minCred:0` and `maxHops:Number.MAX_SAFE_INTEGER` for diagnosis only; it performs no writes. Credible remaining paths mean the hop cap stopped propagation (`max_hops`); only below-threshold remaining paths mean `min_credibility`; no remaining gossip-worthy trust paths means `no_listeners`. Quiet events below absolute weight 0.3 have no eligible listeners. reached lists only listeners newly added during this call, not prior knowers or original witnesses.

Same-player spread/advanceTime calls are serialized within one createGossip service. Independent service instances do not share that queue, and the read/select/write/clock sequence is not transactional. The write guard prevents replaying an already recorded listener/event pair on the tested database; it does not promise a global strongest-source winner or one-hop scheduling across competing services. See `docs/goodness/G5-gossip.md`.

## G7 dialogue implementation

Canonical queries are in `packages/hearsay/src/queries/dialogue.ts`. Every query has real FalkorDB integration coverage, under Goodness's previously approved direct-client exception. Values are bound; reads use roQuery. Existing Q50 reads all NPC-known player events, Q51 supplies attitude inputs through the attitude tool, and Q95/Q96/Q97 persist and retrieve dialogue.

| ID | Question / parameters |
| --- | --- |
| Q23_resolve_conversation | Does `$cid` belong to `$pid` and `$nid` through STARTED/BETWEEN? Return its application ID. Missing/foreign conversations return BAD_ARGS before writes; no new contract error code is introduced. |
| Q92_dialogue_known | Match NPC KNOWS Event plus Player PERFORMED, optional Place and teller name; return eventId/type/subject/place/via/teller/confidence for the prompt. Parameters `$pid`, `$nid`. |
| Q93_dialogue_profile | Return name, role and persona for `$nid`. |
| Q94_dialogue_beliefs | Match this NPC's BELIEVES edges, return Fact text and belief confidence, ordered by Fact ID. Parameter `$nid`. |
| Q95_conversation_start | Create Conversation/STARTED/BETWEEN after validating player/NPC. Parameters `$pid`, `$nid`, `$cid`, `$tick`, `$at`; return created ID. |
| Q96_utterance_add | Recheck conversation ownership in the write; create Utterance/HAS. Parameters `$pid`, `$nid`, `$cid`, `$uid`, `$speaker`, `$text`, `$sequence`, `$tick`, `$at`; return created ID. |
| Q97_recent_utterances | Return latest `$limit` lines between `$pid`/`$nid`, across their conversations. Chronological history is assembled by reversing the six returned rows. Timestamp ties use conversation ID and sequence. |
| Q97b_conversation_count | Count HAS/Utterance nodes for the validated `$cid`; supplies next sequence and deterministic template hash input. |
| Q99_dialogue_unknown | Match player Events without this NPC's KNOWS edge; optionally match EventType for keywords. Return eventId/subject/keywords. Parameters `$pid`, `$nid`. This result stays server-side for firewall checks and is never added to model knowledge. |

Conversation/Utterance IDs are application-generated UUID strings. Per-conversation sequence is a scalar property to order rapid turns; same-player/NPC calls are serialized within one createDialogue service. No database transaction or distributed sequencing is claimed. Snapshot continues to omit conversation nodes and incident edges. Q98 remains reserved for G13's naive control and is not used here.
