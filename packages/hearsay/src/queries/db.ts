// Can the driver return a parameterized scalar without changing its contents?
export const QG2_scalar = "RETURN $value AS value";
// Create a synthetic scratch graph so subsequent reads can use GRAPH.RO_QUERY.
export const QG2_create_probe = "CREATE (:Probe {id: $id})";
// Does the read-only guard leave the scratch graph untouched?
export const QG2_probe_count = "MATCH (p:Probe) RETURN count(p) AS count";
// Does an absent value produce an empty row list rather than an error?
export const QG2_missing_probe = "MATCH (p:Probe {id: $id}) RETURN p.id AS id";
// Invalid syntax intentionally verifies that server details are not exposed.
export const QG2_invalid = "THIS IS NOT CYPHER";
