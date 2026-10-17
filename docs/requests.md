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
