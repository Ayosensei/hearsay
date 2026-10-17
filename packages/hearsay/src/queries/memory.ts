// Resolve all requested witnesses in this player's graph before any event write.
export const Q24_resolve_npcs = `UNWIND $ids AS requested
OPTIONAL MATCH (n:NPC {id:requested}) RETURN requested, n.id AS id`;
// Does the requested event location exist in this player's world?
export const Q25_resolve_place = "MATCH (pl:Place {id:$id}) RETURN pl.id AS id";
// Is this an event performed by this player, rather than an unrelated node?
export const Q26_resolve_event = `MATCH (:Player {id:$pid})-[:PERFORMED]->(e:Event {id:$eid})
RETURN e.id AS id`;
// Record one player event and direct-witness knowledge in one graph query.
export const Q30_record_event = `MATCH (p:Player {id: $pid}), (pl:Place {id: $place})
CREATE (e:Event {id: $eid, type: $type, weight: $weight, tick: $tick, at: $at, subject: $subject})
CREATE (p)-[:PERFORMED]->(e)
CREATE (e)-[:HAPPENED_AT]->(pl)
WITH e
UNWIND $witnesses AS wid
MATCH (n:NPC {id: wid})
CREATE (n)-[:KNOWS {via: 'witness', root: wid, hop: 0, confidence: 1.0, tick: $tick}]->(e)
RETURN n.id AS witness`;
// Which NPCs witnessed, heard about, or do not know this event?
export const Q42_who_knows = `MATCH (n:NPC)
OPTIONAL MATCH (n)-[k:KNOWS]->(e:Event {id:$eid})
RETURN n.id AS npc, n.name AS name, k.via AS via, k.confidence AS confidence, k.hop AS hop
ORDER BY n.id`;
// What does this NPC know about this player's deeds, with source and confidence?
export const Q50_recall = `MATCH (n:NPC {id:$nid})-[k:KNOWS]->(e:Event)<-[:PERFORMED]-(:Player {id:$pid})
OPTIONAL MATCH (e)-[:HAPPENED_AT]->(pl:Place)
RETURN e.id AS eventId, e.type AS type, e.weight AS weight, e.tick AS tick, pl.id AS placeId,
       k.via AS via, k.confidence AS confidence, k.hop AS hop
ORDER BY e.tick DESC LIMIT $limit`;
// Return visible entities while keeping dialogue/type metadata out of snapshots.
export const Q90_snapshot_nodes = `MATCH (n)
WHERE NOT n:Utterance AND NOT n:Conversation AND NOT n:EventType RETURN n`;
// Return only edges between visible endpoints, with application IDs and labels.
export const Q90_snapshot_edges = `MATCH (a)-[r]->(b)
WHERE NOT a:Utterance AND NOT b:Utterance AND NOT a:Conversation AND NOT b:Conversation
  AND NOT a:EventType AND NOT b:EventType
RETURN a.id AS fromId, labels(a) AS fromLabels, r, b.id AS toId, labels(b) AS toLabels`;
