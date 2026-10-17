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
MATCH (p:Player {id: $pid}) SET p.tick = $tick RETURN p.tick AS tick
```

**Q22_create_player** — run inside the freshly copied player graph.
```
CREATE (p:Player {id: $pid, name: $name, tick: 0, createdAt: $at})
```

## Episodic memory: recording events

**Q30_record_event** — one event, one place, N witnesses. Witness ids must be validated first (Q10).
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
CREATE (b)-[:KNOWS {via: r.teller, root: r.root, hop: r.hop + 1, confidence: r.cred, tick: $tick}]->(e)
CREATE (a)-[:TOLD {event: r.eventId, root: r.root, tick: $tick, confidence: r.cred}]->(b)
```
(verify: list-of-maps parameter with property access in UNWIND. Fallback: one small query per row.)

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
       k.via AS via, k.confidence AS confidence
```

**Q60_explain_knows** — how/when this NPC learned this event.
```
MATCH (n:NPC {id: $nid})-[k:KNOWS]->(e:Event {id: $eid})
RETURN k.via AS via, k.root AS root, k.hop AS hop, k.confidence AS confidence
```
Zero rows -> `status: 'not_in_graph'`, `chain: []`.

**Q61_explain_chain** — the rumor path from the witness to this NPC.
```
MATCH path = (o:NPC {id: $root})-[:TOLD*1..4]->(n:NPC {id: $nid})
WHERE all(r IN relationships(path) WHERE r.event = $eid)
WITH path, length(path) AS hops
ORDER BY hops
LIMIT 1
RETURN [x IN nodes(path) | x.id] AS ids,
       [x IN nodes(path) | x.name] AS names,
       [r IN relationships(path) | r.confidence] AS confidences
```
G2 verified `all()` and both list comprehensions. The original `ORDER BY length(path)` after the projected RETURN failed at runtime (`Unable to locate a value with alias path within the record`). Sort and limit while `path` is still in scope, as above. The output columns are unchanged. Fallback if needed on another version: walk `k.via` repeatedly using Q60 until `via = 'witness'`. If `hop = 0`, the chain is just `[root]`.

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
MATCH (a)-[r]->(b) WHERE NOT a:Utterance AND NOT b:Utterance AND NOT a:Conversation AND NOT b:Conversation RETURN a.id AS fromId, labels(a) AS fromLabels, r, b.id AS toId, labels(b) AS toLabels
```
(verify label predicates in WHERE and return shapes in the Node client; map entities to `GraphNode`/`GraphEdge` using our own `id` property, never FalkorDB's internal ids.) `focusEventId` only changes which edges the UI highlights; the server may ignore it.

## Conversation memory

**Q95_conversation_start**
```
MATCH (p:Player {id: $pid}), (n:NPC {id: $nid})
CREATE (c:Conversation {id: $cid, tick: $tick, at: $at})
CREATE (p)-[:STARTED]->(c)
CREATE (c)-[:BETWEEN]->(n)
```

**Q96_utterance_add**
```
MATCH (c:Conversation {id: $cid})
CREATE (u:Utterance {id: $uid, speaker: $speaker, text: $text, tick: $tick, at: $at})
CREATE (c)-[:HAS]->(u)
```

**Q97_recent_utterances** — last N lines of dialogue between this player and this NPC (for continuity in the prompt).
```
MATCH (:Player {id: $pid})-[:STARTED]->(c:Conversation)-[:BETWEEN]->(:NPC {id: $nid})
MATCH (c)-[:HAS]->(u:Utterance)
RETURN u.speaker AS speaker, u.text AS text, u.tick AS tick, u.at AS at
ORDER BY u.at DESC
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
