export {
  Q30_record_event,
  Q90_snapshot_nodes,
  Q90_snapshot_edges,
} from "./memory";

export {
  Q40_gossip_candidates_all,
  Q40b_gossip_candidates_one,
  Q41_gossip_write,
} from "./gossip";

export { Q61_explain_chain } from "./opinion";

export { Q70_gossip_hubs } from "./policy";

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
