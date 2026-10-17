# Goodness: G8–G13 handoff

The stages were implemented in order, with tested commits pushed throughout. Each pull request is stacked on the previous stage; no merge was performed.

| Stage | Result | Evidence | PR |
| --- | --- | --- | --- |
| G8 | Complete: adaptive policy and PageRank hubs | Live markup/floor/counter tests; [details](G8-policy.md) | [8](https://github.com/Ayosensei/hearsay/pull/8) |
| G9 | Complete: shared client and stdio MCP | Actual SDK client/server subprocess and live DB; [details](G9-mcp.md) | [9](https://github.com/Ayosensei/hearsay/pull/9) |
| G10 | Complete: measured load runner | 1,280 successful calls, zero tool/cleanup errors; [raw samples](../../loadtest/results.json), [report](../../loadtest/results.md) | [10](https://github.com/Ayosensei/hearsay/pull/10) |
| G11 | Local checks pass; Cloud/app check pending | Actual container restart and template recovery; [details](G11-persistence.md), R-005 | [11](https://github.com/Ayosensei/hearsay/pull/11) |
| G12 | Complete: generated query mirrors and judge notes | Drift rejection verified; [explanations](G12-judge-notes.md) | [12](https://github.com/Ayosensei/hearsay/pull/12) |
| G13 | Complete: control dialogue without knowledge filtering | Live graph + injected-model comparison; [details](G13-control.md) | [13](https://github.com/Ayosensei/hearsay/pull/13) |

## What is real

FalkorDB reads/writes, per-player graphs, event knowledge, gossip, attitudes, provenance, policy changes, PageRank, saved guarded conversations, MCP subprocess calls, load timings and clean-restart persistence were exercised against the actual local server. The control's event context and leak classification use actual graph data. The final query catalogue has 49 generated source/hash-checked mirrors.

## What remains simulated or unverified

Model and HTTP test responses are injected fakes; no configured Gemini key/model means no live generation or quality measurement. The website still uses its mock engine, and the production seed is still the allowed three-NPC stub. Six-NPC golden integration fixtures are synthetic test data, not delivered production content. The benchmark uses that three-NPC production stub with concurrency five, not a final-town capacity test. Cloud/app validation remains open under R-005.

## Issues and limits encountered

- Background-save graph-copy fork rejection recurred. G8 adds bounded retries only for the explicit server rejection; it does not retry ambiguous network/write outcomes. [Copy retry evidence](copy-retry.md).
- Exact floating-point equality initially prevented the second policy update. A small comparison tolerance plus exact tries/wins checks fixes the sequential case. Independent service coordination remains limited.
- Dependency installation was slow; MCP needed direct Zod and Node types. The benchmark initially needed its own ESM package marker for top-level await. These setup errors were corrected and verified.
- Load p95/p99 during graph creation exceeds the demo's 100 ms ambition. Raw timings are preserved; no speed claim hides the tail.
- G11 cannot establish Cloud behavior with local evidence. Local persistence used a clean restart, no script-issued SAVE and no enabled AOF; it is not a crash-recovery guarantee.
- Reset's final delete/copy pair is still nontransactional. Independent instances and concurrent graph reads/writes do not gain distributed transactions from these stages.
- Firewall/control measurement is lexical and can miss paraphrases or match ambiguous vocabulary. Control leakage is deliberately returned, never accepted into guarded conversation history.

Next integration work: finish the six-NPC production seed and website engine wiring (DuroT scope), configure Gemini privately, and run the outstanding Cloud/app check. Existing user edits in AGENTS.md, DESIGN.md and DuroT's docs were preserved.

Final validation: typecheck and all 124 workspace tests pass (104 core, 5 contract, 13 website mock tests, 2 MCP tests). All 49 query mirrors pass the source/hash check.
