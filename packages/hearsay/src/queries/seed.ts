// Seed each fixed node/relationship kind with scalar or array properties only.
export const Q04_seed_factions =
  "UNWIND $rows AS r CREATE (:Faction {id:r.id, name:r.name})";
export const Q04_seed_places =
  "UNWIND $rows AS r CREATE (:Place {id:r.id, name:r.name})";
export const Q04_seed_npcs = `UNWIND $rows AS r
MATCH (f:Faction {id:r.faction})
CREATE (n:NPC {id:r.id, name:r.name, role:r.role, faction:r.faction,
  greed:r.greed, courage:r.courage, loyalty:r.loyalty, persona:r.persona})
CREATE (n)-[:MEMBER_OF]->(f)`;
export const Q04_seed_facts =
  "UNWIND $rows AS r CREATE (:Fact {id:r.id, text:r.text, topic:r.topic})";
export const Q04_seed_policies = `UNWIND $rows AS r CREATE (:Policy {id:r.id, kind:r.kind,
  markup:r.markup, minMarkup:r.minMarkup, maxMarkup:r.maxMarkup, step:r.step})`;
export const Q04_seed_event_types =
  "UNWIND $rows AS r CREATE (:EventType {type:r.type, weight:r.weight, keywords:r.keywords})";
export const Q04_seed_trusts = `UNWIND $rows AS r
MATCH (a:NPC {id:r.truster}), (b:NPC {id:r.trusted}) CREATE (a)-[:TRUSTS {weight:r.weight}]->(b)`;
export const Q04_seed_believes = `UNWIND $rows AS r
MATCH (n:NPC {id:r.npc}), (f:Fact {id:r.fact}) CREATE (n)-[:BELIEVES {confidence:r.confidence}]->(f)`;
export const Q04_seed_follows = `UNWIND $rows AS r
MATCH (n:NPC {id:r.npc}), (p:Policy {id:r.policy}) CREATE (n)-[:FOLLOWS {tries:0, wins:0}]->(p)`;
export const Q04_seed_allied = `UNWIND $rows AS r
MATCH (a:Faction {id:r.from}), (b:Faction {id:r.to}) CREATE (a)-[:ALLIED_WITH]->(b)`;
export const Q04_seed_hostile = `UNWIND $rows AS r
MATCH (a:Faction {id:r.from}), (b:Faction {id:r.to}) CREATE (a)-[:HOSTILE_TO]->(b)`;
