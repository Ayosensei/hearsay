// Which NPC identities and traits are available in the template?
export const Q10_get_npcs = `MATCH (n:NPC)
RETURN n.id AS id, n.name AS name, n.role AS role, n.faction AS faction,
       n.greed AS greed, n.courage AS courage, n.loyalty AS loyalty ORDER BY n.id`;
// Which named places can receive player events?
export const Q11_get_places =
  "MATCH (pl:Place) RETURN pl.id AS id, pl.name AS name ORDER BY pl.id";
// Which event types and weights does the world define?
export const Q12_get_event_types =
  "MATCH (t:EventType) RETURN t.type AS type, t.weight AS weight, t.keywords AS keywords";
// Is the player node present and what is its current tick?
export const Q20_get_player =
  "MATCH (p:Player {id:$pid}) RETURN p.id AS id, p.tick AS tick";
// Initialize a player only inside a new copy of the world template.
export const Q22_create_player =
  "CREATE (:Player {id:$pid, name:$name, tick:0, createdAt:$at})";

// Create indexed application IDs before publishing the completed template.
export const INDEX_QUERIES = [
  ["Q03_index_npc", "CREATE INDEX FOR (n:NPC) ON (n.id)"],
  ["Q03_index_event", "CREATE INDEX FOR (e:Event) ON (e.id)"],
  ["Q03_index_player", "CREATE INDEX FOR (p:Player) ON (p.id)"],
  ["Q03_index_place", "CREATE INDEX FOR (pl:Place) ON (pl.id)"],
] as const;
