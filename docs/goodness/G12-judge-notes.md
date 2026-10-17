# G12 — judge notes and exact query mirrors

At the G12 checkpoint, the generated catalogue has 48 production query constants including index DDL. Test-only QG constants and reexports do not create duplicate submission files. `pnpm queries:generate` writes exact literal query text; `pnpm queries:check` verifies content/source/hash manifest and rejects extra or edited Cypher files. Generation reads TypeScript AST literals, never evaluates source or executes Cypher. CRLF/LF is normalized consistently with JavaScript template literals.

## Q40, line by line

MATCH a-KNOWS-e finds actual tellers and their events. MATCH b-TRUSTS-a finds listeners who trust those tellers; direction is listener to teller. NOT b-KNOWS-e excludes people already aware. abs(weight)>=minWeight selects meaningful events. teller.confidence*trust.weight>=minCred selects believable handoffs. RETURN exposes fixed candidate columns. TypeScript picks one highest-confidence teller per event/listener, with ASCII teller-ID ties. Read the whole round before writing so new listeners cannot tell until the next round.

## Q41, line by line

UNWIND rows processes selected parameter maps. MATCH resolves teller/listener/event in this player's graph. NOT-KNOWS rechecks awareness at write time. CREATE KNOWS stores immediate source, original root, hop+1, confidence and learned tick. CREATE TOLD records the actual handoff for this event/root. RETURN reports only additions written. This deliberate query is not a transaction spanning candidate reads and the clock update.

## Q61, line by line

MATCH path traverses one to four actual TOLD edges from original witness to requested NPC. all(relationships(path)) restricts every edge to event/root. WITH retains path while computing hops. ORDER BY hops/LIMIT 1 selects a shortest eligible path before projection. RETURN builds NPC ID/name and confidence lists. Sorting on a dropped path alias failed in the live G2 spike; WITH fixes it. Longer chains use Q60 via pointers and Q62 actual-link verification. Missing provenance returns an error, never an LLM explanation.

## Five explanations to remember

1. Each save is an isolated graph copied from template, so an omitted WHERE cannot reach another graph. Logical save isolation is not an authentication system.
2. Public IDs use application properties and event-specific TOLD/KNOWS IDs; they survive copy/restart and match explanation highlights. Internal database IDs are not public identity.
3. The graph discovers candidates, traverses provenance, scopes known events and computes PageRank. TypeScript selects deterministically and scores opinions. The LLM writes dialogue only.
4. The firewall checks allowed IDs and unknown vocabulary, retries and falls back. It is lexical, not a proof against every paraphrase. History is real Utterance data; naive comparison remains separate.
5. Evidence is bounded: live database/MCP tests, 1,280 measured local calls and actual clean-restart persistence. Cloud/app validation and live Gemini quality are unverified; production has three NPCs and the website uses mocks. Do not present synthetic test personas or fake-model replies as production/live generation.

## Verification

All 117 workspace tests and typecheck pass. An intentional Q40 mirror edit was rejected by the checker, then restored; the clean 48-query catalogue passes again.

