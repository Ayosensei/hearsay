// Advance test game time without implementing the G5 gossip tool.
export const QG4_set_tick =
  "MATCH (p:Player {id:$pid}) SET p.tick=$tick RETURN p.tick AS tick";
// Connect hidden metadata to visible nodes to check both snapshot endpoint filters.
export const QG4_hidden_metadata = `MATCH (p:Player {id:$pid}), (n:NPC {id:'brom'}), (t:EventType {type:'stole'})
CREATE (c:Conversation {id:'test_conversation'}), (u:Utterance {id:'test_utterance'})
CREATE (p)-[:STARTED]->(c), (c)-[:BETWEEN]->(n), (c)-[:HAS]->(u), (n)-[:BELIEVES]->(t)`;
