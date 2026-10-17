// Does this NPC follow this policy, and what values determine its next adaptation?
export const Q80_policy_get = `MATCH (:NPC {id:$nid})-[f:FOLLOWS]->(pol:Policy {id:$polId})
RETURN pol.markup AS markup, pol.minMarkup AS minMarkup, pol.maxMarkup AS maxMarkup,
       pol.step AS step, f.tries AS tries, f.wins AS wins`;
// Update only the version that was read, rather than silently losing another adaptation.
export const Q81_policy_update = `MATCH (:NPC {id:$nid})-[f:FOLLOWS]->(pol:Policy {id:$polId})
WHERE abs(pol.markup-$previousMarkup)<0.000000001 AND f.tries=$previousTries AND f.wins=$previousWins
SET pol.markup=$markup, f.tries=f.tries+1, f.wins=f.wins+$winInc
RETURN pol.markup AS markup, f.tries AS tries, f.wins AS wins`;
// Which NPCs are trusted by influential NPCs in this graph?
export const Q70_gossip_hubs = `CALL algo.pageRank('NPC', 'TRUSTS')
YIELD node, score
RETURN node.id AS npc, node.name AS name, score
ORDER BY score DESC
LIMIT $limit`;
