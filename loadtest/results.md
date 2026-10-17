# Measured local load test

Run: 2026-10-17T04:58:48.665Z

HEARSAY_LLM=off. Raw samples and machine/resource details: [results.json](results.json).

CPU: Intel(R) Core(TM) i7-6600U CPU @ 2.60GHz; logical CPUs: 4; RAM bytes: 17066430464; OS: win32 10.0.26100; Node: v24.16.0.

Docker: {"cpus":4,"memoryBytes":8269701120,"version":"29.8.2"}

| Players | Concurrent players | NPCs | Kind | Attempts | Successes | Errors | Success ops/s | p50 ms | p95 ms | p99 ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | 5 | 3 | read | 30 | 30 | 0 | 12.501 | 21.788 | 159.779 | 351.842 |
| 10 | 5 | 3 | write | 50 | 50 | 0 | 20.836 | 25.633 | 1004.051 | 1023.575 |
| 50 | 5 | 3 | read | 150 | 150 | 0 | 13.352 | 21.382 | 411.339 | 701.939 |
| 50 | 5 | 3 | write | 250 | 250 | 0 | 22.254 | 26.388 | 706.102 | 1001.478 |
| 100 | 5 | 3 | read | 300 | 300 | 0 | 13.415 | 20.017 | 461.494 | 593.472 |
| 100 | 5 | 3 | write | 500 | 500 | 0 | 22.358 | 25.496 | 682.460 | 875.201 |

Percentiles use nearest rank on all attempted operations, including failures. Displayed numbers are truncated to three decimals; raw milliseconds are preserved. Successful ops/s uses the whole batch duration for each category, not isolated read/write phases. No LLM calls or separate warmup. Template creation and cleanup are outside timing. Failed player setup skips dependent operations; error counts must be read alongside percentiles.

This is one run on the current three-NPC production stub, not a production capacity claim or proof for the final six-NPC town. Local Docker and the client share a machine. Background saves, graph-copy contention and client scheduling affect results. Writes include player graph copies. No retry hides general write failures; only explicit pre-copy fork rejection has bounded helper backoff.

Cleanup errors: 0. All benchmark graph names are unique and cleanup is restricted to the run's own graphs.
