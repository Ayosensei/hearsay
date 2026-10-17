// Replace only disposable graph trust edges to exercise a five-hop telling chain.
export const QG6_clear_trust = "MATCH ()-[t:TRUSTS]->() DELETE t";
// Remove recorded provenance while retaining knowledge to verify honest failure.
export const QG6_delete_told =
  "MATCH ()-[r:TOLD]->() WHERE r.event=$eid DELETE r";
// Corrupt a disposable source pointer to prove explanations cannot invent a valid path.
export const QG6_corrupt_via =
  "MATCH (:NPC {id:$nid})-[k:KNOWS]->(:Event {id:$eid}) SET k.via=$via";
