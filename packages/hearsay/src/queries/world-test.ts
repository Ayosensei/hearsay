// Compare all template properties without relying on mutable application state.
export const QG3_nodes = `MATCH (n) WITH n ORDER BY id(n)
RETURN labels(n) AS labels, properties(n) AS props`;
// Verify that all supported seed relationship kinds were loaded.
export const QG3_relations =
  "MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY type";
// Modify one disposable player graph to prove isolation and reset behavior.
export const QG3_mutate_player = `MATCH (p:Player {id:$pid}), (n:NPC {id:'brom'}), (pol:Policy {id:'haggle_brom'})
SET p.tick=9, n.greed=0.99, pol.markup=0.25
CREATE (e:Event {id:'ev_isolation', type:'stole', weight:-0.8, tick:9})
CREATE (p)-[:PERFORMED]->(e)`;
// Count player events independently of the future recordEvent tool.
export const QG3_events = "MATCH (e:Event) RETURN count(e) AS count";
// Inspect copied policy and NPC properties after play/reset.
export const QG3_policy =
  "MATCH (n:NPC {id:'brom'}), (p:Policy {id:'haggle_brom'}) RETURN n.greed AS greed, p.markup AS markup";
