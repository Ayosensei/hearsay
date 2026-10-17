// Does this conversation belong to this player and this NPC?
export const Q23_resolve_conversation = `MATCH (:Player {id:$pid})-[:STARTED]->(c:Conversation {id:$cid})-[:BETWEEN]->(:NPC {id:$nid}) RETURN c.id AS id`;
// Fetch only the known event descriptions this NPC may receive in its prompt.
export const Q92_dialogue_known = `MATCH (n:NPC {id:$nid})-[k:KNOWS]->(e:Event)<-[:PERFORMED]-(:Player {id:$pid})
OPTIONAL MATCH (e)-[:HAPPENED_AT]->(pl:Place)
OPTIONAL MATCH (t:NPC {id:k.via})
RETURN e.id AS eventId, e.type AS type, e.subject AS subject, pl.name AS place,
       k.via AS via, t.name AS teller, k.confidence AS confidence ORDER BY e.id`;
// Which voice and role should this NPC use?
export const Q93_dialogue_profile = `MATCH (n:NPC {id:$nid}) RETURN n.name AS name, n.role AS role, n.persona AS persona`;
// Which general town facts does this NPC believe?
export const Q94_dialogue_beliefs = `MATCH (:NPC {id:$nid})-[b:BELIEVES]->(f:Fact)
RETURN f.text AS text, b.confidence AS confidence ORDER BY f.id`;
// Start an isolated conversation after resolving player and NPC IDs.
export const Q95_conversation_start = `MATCH (p:Player {id:$pid}), (n:NPC {id:$nid})
CREATE (c:Conversation {id:$cid,tick:$tick,at:$at})
CREATE (p)-[:STARTED]->(c) CREATE (c)-[:BETWEEN]->(n) RETURN c.id AS id`;
// Persist a line in a validated conversation, with a deterministic sequence within it.
export const Q96_utterance_add = `MATCH (:Player {id:$pid})-[:STARTED]->(c:Conversation {id:$cid})-[:BETWEEN]->(:NPC {id:$nid})
CREATE (u:Utterance {id:$uid,speaker:$speaker,text:$text,tick:$tick,at:$at,sequence:$sequence})
CREATE (c)-[:HAS]->(u) RETURN u.id AS id`;
// Read recent dialogue only between this player and NPC, across their conversations.
export const Q97_recent_utterances = `MATCH (:Player {id:$pid})-[:STARTED]->(c:Conversation)-[:BETWEEN]->(:NPC {id:$nid})
MATCH (c)-[:HAS]->(u:Utterance)
RETURN u.speaker AS speaker, u.text AS text, u.tick AS tick, u.at AS at,
       c.id AS conversationId, u.sequence AS sequence
ORDER BY u.at DESC, c.id DESC, u.sequence DESC LIMIT $limit`;
// Count saved lines to choose a deterministic template and sequence the next pair.
export const Q97b_conversation_count = `MATCH (c:Conversation {id:$cid})
OPTIONAL MATCH (c)-[:HAS]->(u:Utterance) RETURN count(u) AS count`;
// Server-only firewall input: never include these unknown events in a model prompt.
export const Q99_dialogue_unknown = `MATCH (n:NPC {id:$nid}), (:Player {id:$pid})-[:PERFORMED]->(e:Event)
WHERE NOT (n)-[:KNOWS]->(e)
OPTIONAL MATCH (t:EventType {type:e.type})
RETURN e.id AS eventId, e.subject AS subject, t.keywords AS keywords ORDER BY e.id`;
