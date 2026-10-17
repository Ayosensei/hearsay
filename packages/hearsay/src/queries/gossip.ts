// Which unknown listeners can hear any gossip-worthy event this round?
export const Q40_gossip_candidates_all = `MATCH (a:NPC)-[k:KNOWS]->(e:Event)
MATCH (b:NPC)-[t:TRUSTS]->(a)
WHERE NOT (b)-[:KNOWS]->(e)
  AND abs(e.weight) >= $minWeight
  AND k.confidence * t.weight >= $minCred
RETURN e.id AS eventId, a.id AS teller, b.id AS listener,
       k.confidence * t.weight AS cred, k.root AS root, k.hop AS hop`;
// Which unknown listeners can hear this event within the absolute hop limit?
export const Q40b_gossip_candidates_one = `MATCH (a:NPC)-[k:KNOWS]->(e:Event)
MATCH (b:NPC)-[t:TRUSTS]->(a)
WHERE NOT (b)-[:KNOWS]->(e)
  AND abs(e.weight) >= $minWeight
  AND k.confidence * t.weight >= $minCred
  AND e.id = $eid AND k.hop < $maxHops
RETURN e.id AS eventId, a.id AS teller, b.id AS listener,
       k.confidence * t.weight AS cred, k.root AS root, k.hop AS hop`;
// Write only listeners still unaware when this atomic query executes; report actual additions.
export const Q41_gossip_write = `UNWIND $rows AS r
MATCH (a:NPC {id: r.teller}), (b:NPC {id: r.listener}), (e:Event {id: r.eventId})
WHERE NOT (b)-[:KNOWS]->(e)
CREATE (b)-[:KNOWS {via: r.teller, root: r.root, hop: r.hop + 1, confidence: r.cred, tick: $tick}]->(e)
CREATE (a)-[:TOLD {event: r.eventId, root: r.root, tick: $tick, confidence: r.cred}]->(b)
RETURN r.eventId AS eventId, r.teller AS teller, r.listener AS listener,
       r.cred AS cred, r.root AS root, r.hop AS hop`;
// Advance the game clock once after gossip, without overwriting an unexpected concurrent tick.
export const Q21_set_tick = `MATCH (p:Player {id:$pid}) WHERE p.tick=$previousTick
SET p.tick=p.tick+1 RETURN p.tick AS tick`;
