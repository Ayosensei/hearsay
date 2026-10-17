# G11 — local persistence passed; Cloud pending

The recorded local test uses real FalkorDB and an actual Docker container restart, with the API client closed before restart and a fresh connection afterward. The theft, propagated knowledge, tick 2 and both conversation Utterances survived. Garrick still learned from Mira with confidence 0.63. No manual SAVE or AOF enablement was used; the observed Redis configuration had AOF disabled and data directory /var/lib/falkordb/data. The report includes before/after container startup timestamps and expected data identifiers.

The same isolated template was then deleted and ensureWorld republished it with the expected NPC count. Only this run's owned player/template graphs were removed at cleanup. See G11-results.json and the reproducible commands in docs/shared/08-deployment.md. The helper is explicitly restricted to local endpoints so restarting local Docker cannot be misrepresented as a remote database restart check.

This does not prove kill/crash durability or container-recreation durability. Cloud/app validation has not run: there is no configured Cloud endpoint/credential, and the website remains its mock implementation. R-005 requests that external integration. G11's local work is complete, but its full two-part acceptance is not marked complete. Remaining independent stages proceed as authorized while this external requirement remains open.

After the restart and cleanup, pnpm typecheck and all 117 workspace tests passed. GRAPH.LIST was empty after teardown. No production durability settings were changed.
