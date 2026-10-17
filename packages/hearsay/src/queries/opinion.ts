// Which player events does this NPC know, and what traits affect their reaction?
export const Q51_attitude_inputs = `MATCH (n:NPC {id:$nid})
OPTIONAL MATCH (n)-[k:KNOWS]->(e:Event)<-[:PERFORMED]-(:Player {id:$pid})
RETURN n.loyalty AS loyalty, n.greed AS greed,
       e.id AS eventId, e.type AS type, e.weight AS weight, e.tick AS tick,
       k.via AS via, k.confidence AS confidence ORDER BY e.id`;
// How did this NPC learn this event, and what name should the path display?
export const Q60_explain_knows = `MATCH (n:NPC {id:$nid})-[k:KNOWS]->(:Event {id:$eid})
RETURN n.id AS npcId, n.name AS name, k.via AS via, k.root AS root,
       k.hop AS hop, k.confidence AS confidence`;
// Return an actual event-specific telling path while its path alias remains in scope.
export const Q61_explain_chain = `MATCH path = (o:NPC {id: $root})-[:TOLD*1..4]->(n:NPC {id: $nid})
WHERE all(r IN relationships(path) WHERE r.event = $eid AND r.root = $root)
WITH path, length(path) AS hops
ORDER BY hops
LIMIT 1
RETURN [x IN nodes(path) | x.id] AS ids,
       [x IN nodes(path) | x.name] AS names,
       [r IN relationships(path) | r.confidence] AS confidences`;
// During the via-walk fallback, does the corresponding event/root TOLD edge really exist?
export const Q62_explain_link = `MATCH (:NPC {id:$from})-[r:TOLD]->(:NPC {id:$to})
WHERE r.event=$eid AND r.root=$root RETURN r.confidence AS confidence`;
