# Reproduce the measured benchmark

Start local FalkorDB, install dependencies, then run `pnpm loadtest`. Defaults are 10,50,100 players at concurrency 5; use `pnpm loadtest --players 10,50,100 --concurrency 5` to set them explicitly. HEARSAY_LLM is forced off. Each player creates a graph, records theft, advances three ticks, recalls Garrick, reads attitude and snapshots the graph. The benchmark owns a unique temporary template and player names; it deletes only those graphs afterward.

results.md contains measured read/write throughput and nearest-rank p50/p95/p99; results.json preserves every raw duration, outcome and graph-copy attempt count. Latencies include all attempted envelopes, successful or failed. Throughput is successful operations divided by whole-batch elapsed time. Setup failures skip dependent calls and remain errors. Template preparation and cleanup are outside timing; there is no separate warmup. The runner exits nonzero on tool or cleanup errors, while preserving completed results.

The current production seed has three NPCs; these measurements must not be advertised as the final six-NPC town or 100 simultaneous requests. The 100-player batch still limits in-flight player workflows to five. Host and Docker share a four-thread i7-6600U machine. Tail latency includes graph-copy contention. See the committed measured report for the actual resource limits and numbers.

The first launch exposed root CommonJS interpretation of top-level await. A private type:module marker in this directory fixes runtime execution without changing the root package's module semantics. Root typecheck explicitly includes this runner. @types/node uses the already established Node 24 version; no new runtime dependency beyond G9's tsx was required.
