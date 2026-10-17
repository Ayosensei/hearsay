// What is the complete player event log, regardless of this NPC's knowledge?
export const Q98_player_events_all = `MATCH (:Player {id:$pid})-[:PERFORMED]->(e:Event)
OPTIONAL MATCH (e)-[:HAPPENED_AT]->(pl:Place)
RETURN e.id AS eventId, e.type AS type, e.subject AS subject, pl.name AS place, e.tick AS tick
ORDER BY e.tick, e.id`;
