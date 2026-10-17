export {
  Q30_record_event,
  Q90_snapshot_nodes,
  Q90_snapshot_edges,
} from "./memory";

// Planned query from docs/shared/05-queries.md, exercised on the G2 scratch graph.
export const Q40_gossip_candidates_all = `MATCH (a:NPC)-[k:KNOWS]->(e:Event)
MATCH (b:NPC)-[t:TRUSTS]->(a)
WHERE NOT (b)-[:KNOWS]->(e)
  AND abs(e.weight) >= $minWeight
  AND k.confidence * t.weight >= $minCred
RETURN e.id AS eventId, a.id AS teller, b.id AS listener,
       k.confidence * t.weight AS cred, k.root AS root, k.hop AS hop`;

// Planned query from docs/shared/05-queries.md, exercised on the G2 scratch graph.
export const Q41_gossip_write = `UNWIND $rows AS r
MATCH (a:NPC {id: r.teller}), (b:NPC {id: r.listener}), (e:Event {id: r.eventId})
CREATE (b)-[:KNOWS {via: r.teller, root: r.root, hop: r.hop + 1, confidence: r.cred, tick: $tick}]->(e)
CREATE (a)-[:TOLD {event: r.eventId, root: r.root, tick: $tick, confidence: r.cred}]->(b)`;

// Planned query from docs/shared/05-queries.md, exercised on the G2 scratch graph.
export const Q61_explain_chain = `MATCH path = (o:NPC {id: $root})-[:TOLD*1..4]->(n:NPC {id: $nid})
WHERE all(r IN relationships(path) WHERE r.event = $eid)
WITH path, length(path) AS hops
ORDER BY hops
LIMIT 1
RETURN [x IN nodes(path) | x.id] AS ids,
       [x IN nodes(path) | x.name] AS names,
       [r IN relationships(path) | r.confidence] AS confidences`;

// Which listeners can hear this event without exceeding the requested depth?
export const Q40b_gossip_candidates_one = `MATCH (a:NPC)-[k:KNOWS]->(e:Event)
MATCH (b:NPC)-[t:TRUSTS]->(a)
WHERE NOT (b)-[:KNOWS]->(e)
  AND abs(e.weight) >= $minWeight
  AND k.confidence * t.weight >= $minCred
  AND e.id = $eid AND k.hop < $maxHops
RETURN e.id AS eventId, a.id AS teller, b.id AS listener,
       k.confidence * t.weight AS cred, k.root AS root, k.hop AS hop`;

// Planned query from docs/shared/05-queries.md, exercised on the G2 scratch graph.
export const Q70_gossip_hubs = `CALL algo.pageRank('NPC', 'TRUSTS')
YIELD node, score
RETURN node.id AS npc, node.name AS name, score
ORDER BY score DESC
LIMIT $limit`;

// Seed the six locked NPC identities and traits on a disposable graph.
export const QG2_seed_npcs = `UNWIND $npcs AS n
CREATE (:NPC {id:n.id, name:n.name, greed:n.greed, courage:n.courage, loyalty:n.loyalty})`;
// Seed the locked truster -> trusted direction and weights.
export const QG2_seed_trust = `UNWIND $trusts AS t
MATCH (a:NPC {id:t.truster}), (b:NPC {id:t.trusted})
CREATE (a)-[:TRUSTS {weight:t.weight}]->(b)`;
// Add the player and place used by Q30, plus nodes that snapshots must exclude.
export const QG2_seed_world = `CREATE (:Player {id:'a', tick:0}), (:Place {id:'forge', name:'Forge'}),
(:Conversation {id:'c'}), (:Utterance {id:'u'}), (:EventType {type:'stole'})`;
// Verify the KNOWS properties written by Q30/Q41 without relying on UI state.
export const QG2_read_knows = `MATCH (n:NPC)-[k:KNOWS]->(e:Event {id:$eid})
RETURN n.id AS npc, k.confidence AS confidence, k.via AS via, k.hop AS hop ORDER BY n.id`;
// Compare declared indexes on the source and its GRAPH.COPY destination.
export const QG2_indexes = "CALL db.indexes()";
// Confirm the copied graph uses a range index for an ID lookup.
export const QG2_index_lookup = "MATCH (n:NPC {id:$id}) RETURN n.id AS id";
// Does the server preserve index definitions when copying a graph?
export const QG2_index_npc = "CREATE INDEX FOR (n:NPC) ON (n.id)";
export const QG2_index_event = "CREATE INDEX FOR (e:Event) ON (e.id)";
export const QG2_index_player = "CREATE INDEX FOR (p:Player) ON (p.id)";
export const QG2_index_place = "CREATE INDEX FOR (pl:Place) ON (pl.id)";
