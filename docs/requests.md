# Requests board

Use this file to ask the other owner for a change, or to flag a doc/contract problem. Agents: never silently change something you do not own. Add an entry here and tell your human.

Format:

```
## R-001 [open] DuroT -> Goodness: short title
Why: ...
Proposed change: ...
Needed by: Day 2 noon
Resolution: (filled in by the owner)
```

Statuses: `[open]`, `[accepted]`, `[done]`, `[declined]`.

---

## R-001 [done] Goodness -> DuroT: consume the G1 shared contract
Why: the provisional web client differs from the agreed contract (five NPCs, help/harm events, trust direction, 0.50 cutoff, local provenance and simulated traces).
Proposed change: add `@hearsay/contract` as a workspace dependency; implement D2 fixtures/mock against `HearsayClient.call`; migrate the UI using the locked six-NPC seed and shared tool schemas. Run `pnpm install` to activate the G1 Git hooks. Root `pnpm dev` now uses port 3001.
Needed by: before live engine integration.
Resolution: completed. Added `@hearsay/contract` workspace dependency. Migrated `apps/web` to the locked six-NPC Hollowbrook world (Brom, Mira, Garrick, Old Fenn, Tilda, Sister Ayla), locked 6 places, aligned TRUSTS propagation direction (listener trusts teller), 0.25 cutoff, and contract Cypher query trace IDs. Activated G1 git hooks and verified with full test suite.

## R-002 [done] Goodness -> DuroT: align the web Node types with Vitest 5
Why: existing web `@types/node` 20.19.43 does not satisfy Vitest 5.0.4's peer range (`^22.0.0 || >=24.0.0`). Typecheck and all tests pass on Node 24.16.0, but pnpm reports the peer warning.
Proposed change: update the web-owned Node types to the Node 24 line and regenerate the root lockfile. G1 documents the actual runtime requirement rather than promising Node 20 support.
Needed by: clean dependency audit before submission.
Resolution: completed. Updated `apps/web/package.json` `@types/node` to `^24` and added `@hearsay/contract` workspace dependency. Lockfile regenerated and peer warnings resolved.

## R-003 [open] Goodness -> DuroT: replace the temporary G3 seed with D1 content
Why: no `seed/hollowbrook.json` was delivered at G3 start. G3 explicitly permits a three-NPC stub, now provided with Brom, Mira and Garrick.
Proposed change: deliver the complete six-NPC seed, facts, policies and voices using `docs/shared/03-graph-model.md`. The loader validates the same format; no loader edits should be needed. Existing graph copies are intentionally not overwritten when the file changes; coordinate publishing the complete template before integration.
Needed by: G5's full six-NPC production golden path and UI integration.
Resolution: pending DuroT's D1 content.

## R-004 [done] Goodness: reconcile G6 worked-example arithmetic
Why: the unchanged scoring formula yields Garrick -0.562464 and Brom -0.7632 at tick 2. The task list uses rounded Garrick -0.5625, while the behavior example previously said -0.5624 and -0.763.
Proposed change: retain the authoritative formula and contract; correct the behavior example to exact values and test those values with numeric tolerance.
Needed by: G6 scoring implementation.
Resolution: implemented within Goodness's G6 scope and explained in chat. Garrick remains wary; Brom remains hostile. No formula or schema change.

## R-005 [open] Goodness -> DuroT: complete G11 Cloud/app smoke
Why: local clean-restart persistence and actual Cloud core initialization/recovery pass, but the website still uses its mock client. A direct core check cannot establish browser/app integration.
Proposed change: configure the free Cloud instance through private environment settings, connect the live app/core to it and verify ensureWorld reseeds a fresh empty instance. Use synthetic disposable data and do not wipe another user's graphs. Record actual result and cleanup; never commit credentials.
Needed by: final external validation of G11.
Resolution: Cloud access is configured privately. Real core initialization on an empty instance, template recovery, event recall through a fresh connection and owned-graph cleanup passed at 08:27 WAT on 2026-10-17 (G11-cloud-results.json). Remaining: DuroT's live app integration and browser-to-Cloud recovery check. Local evidence is in G11-results.json; overall G11 acceptance remains partial.
