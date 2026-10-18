// Keep the scenario clock and branching decisions in this player's graph.
export const Q110_feud_init = `MERGE (s:FeudState {id:'crossing'}) ON CREATE SET s.payload=$payload RETURN s.payload AS payload`;
// Read the saved scenario without exposing it to dialogue or public snapshots.
export const Q111_feud_read = `MATCH (s:FeudState {id:'crossing'}) RETURN s.payload AS payload`;
// Save one serialized scenario command after its graph operations finish.
export const Q112_feud_save = `MATCH (s:FeudState {id:'crossing'}) SET s.payload=$payload RETURN s.id AS id`;
// Which villagers have this account, and who supplied their version?
export const Q113_feud_claims = `MATCH (n:NPC)-[k:CLAIM_KNOWS]->(c:FeudClaim)
RETURN c.id AS id,c.text AS text,c.parent AS parent,c.private AS private,n.id AS npc,k.via AS via,k.confidence AS confidence,k.tick AS tick`;
// Create an account separately from its underlying fact; its source stays inspectable.
export const Q114_feud_claim = `MATCH (n:NPC {id:$npc})
MERGE (c:FeudClaim {id:$id}) ON CREATE SET c.text=$text,c.parent=$parent,c.private=$private
MERGE (n)-[k:CLAIM_KNOWS]->(c) ON CREATE SET k.via='witness',k.confidence=1.0,k.tick=$tick
RETURN c.id AS id`;
// Find one-hop recipients using the existing directed social trust network.
export const Q115_feud_candidates = `MATCH (listener:NPC)-[t:TRUSTS]->(teller:NPC)-[k:CLAIM_KNOWS]->(c:FeudClaim)
WHERE c.private=false AND k.tick<$tick AND NOT (listener)-[:CLAIM_KNOWS]->(c)
RETURN listener.id AS listener,teller.id AS teller,c.id AS id,k.confidence*t.weight AS confidence ORDER BY confidence DESC`;
// Record only the first qualifying account, retaining the exact teller and turn.
export const Q116_feud_learn = `MATCH (n:NPC {id:$npc}),(c:FeudClaim {id:$id})
MERGE (n)-[k:CLAIM_KNOWS]->(c) ON CREATE SET k.via=$via,k.confidence=$confidence,k.tick=$tick
RETURN k.via AS via`;
