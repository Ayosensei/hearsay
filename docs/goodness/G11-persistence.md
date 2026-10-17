# G11 — local persistence and Cloud core passed; app pending

The recorded local test uses real FalkorDB and an actual Docker container restart, with the API client closed before restart and a fresh connection afterward. The theft, propagated knowledge, tick 2 and both conversation Utterances survived. Garrick still learned from Mira with confidence 0.63. No manual SAVE or AOF enablement was used; the observed Redis configuration had AOF disabled and data directory /var/lib/falkordb/data. The report includes before/after container startup timestamps and expected data identifiers.

The same isolated template was then deleted and ensureWorld republished it with the expected NPC count. Only this run's owned player/template graphs were removed at cleanup. See G11-results.json and the reproducible commands in docs/shared/08-deployment.md. The helper is explicitly restricted to local endpoints so restarting local Docker cannot be misrepresented as a remote database restart check.

This does not prove kill/crash durability or container-recreation durability. Cloud core validation subsequently passed on 2026-10-17 at 08:27 WAT using private connection settings: initialization on an empty instance, owned-template recovery, event roundtrip and a new connection all passed, with cleanup returning the instance to zero graphs. See G11-cloud.md and G11-cloud-results.json. The website remains its mock implementation; R-005 tracks that remaining app integration. G11's full acceptance is not yet marked complete.

After the restart and cleanup, pnpm typecheck and all 117 workspace tests passed. GRAPH.LIST was empty after teardown. No production durability settings were changed.
