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

## R-001 [open] Goodness -> DuroT: consume the G1 shared contract
Why: the provisional web client differs from the agreed contract (five NPCs, help/harm events, trust direction, 0.50 cutoff, local provenance and simulated traces).
Proposed change: add `@hearsay/contract` as a workspace dependency; implement D2 fixtures/mock against `HearsayClient.call`; migrate the UI using the locked six-NPC seed and shared tool schemas. Run `pnpm install` to activate the G1 Git hooks. Root `pnpm dev` now uses port 3001.
Needed by: before live engine integration.
Resolution: pending DuroT's integration.

## R-002 [open] Goodness -> DuroT: align the web Node types with Vitest 5
Why: existing web `@types/node` 20.19.43 does not satisfy Vitest 5.0.4's peer range (`^22.0.0 || >=24.0.0`). Typecheck and all tests pass on Node 24.16.0, but pnpm reports the peer warning.
Proposed change: update the web-owned Node types to the Node 24 line and regenerate the root lockfile. G1 documents the actual runtime requirement rather than promising Node 20 support.
Needed by: clean dependency audit before submission.
Resolution: pending DuroT's dependency change.

## R-003 [open] Goodness -> DuroT: replace the temporary G3 seed with D1 content
Why: no `seed/hollowbrook.json` was delivered at G3 start. G3 explicitly permits a three-NPC stub, now provided with Brom, Mira and Garrick.
Proposed change: deliver the complete six-NPC seed, facts, policies and voices using `docs/shared/03-graph-model.md`. The loader validates the same format; no loader edits should be needed. Existing graph copies are intentionally not overwritten when the file changes; coordinate publishing the complete template before integration.
Needed by: G5's full six-NPC production golden path and UI integration.
Resolution: pending DuroT's D1 content.
