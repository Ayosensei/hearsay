# G10 — measured local load test

`pnpm loadtest` now runs actual core calls against live local FalkorDB. It creates an isolated temporary template and player graphs, records one theft per player, advances three ticks, reads recall/attitude/snapshot, then cleans up only its own graph names. HEARSAY_LLM is forced off. Root typecheck includes the benchmark runner.

The recorded run completed all 1,280 calls for batches of 10,50,100 players at five concurrent player workflows, with zero tool and cleanup errors. Raw JSON was audited for expected 8 calls/player, finite nonnegative durations, successful outcomes and monotonic percentiles. Every newPlayer required its normal two copy attempts; this run did not exercise helper retries. The three-NPC production stub was used, not the six-NPC synthetic test fixture.

For the 100-player batch, read p50/p95/p99 were 20.017/461.494/593.472 ms and write p50/p95/p99 25.496/682.460/875.201 ms (display truncated, raw values preserved). Successful read/write rates were 13.415/22.358 ops/s when each category is divided by whole-batch wall time. These are mixed-workload results on a shared four-thread i7-6600U host/Docker machine, not isolated read throughput or a claim of 100 simultaneous requests. Tail latencies exceed the demo's sub-100 ms target under this creation-heavy load. No capacity claim is made beyond the measured configuration.

See loadtest/results.md, results.json and README.md for all batches, methodology, raw samples and machine/resource settings. The first launch required a type:module marker because root scripts otherwise used CommonJS; this was corrected before measurements. No artificial latency figures, mocked database or LLM calls were used.
