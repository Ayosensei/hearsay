# G11 Cloud engine smoke — 2026-10-17

The actual FalkorDB Cloud free instance passed the core smoke check from 07:27:39 to 07:27:56 UTC (08:27 WAT). `G11-cloud-results.json` records the run, with no endpoint or credentials. This is a real Cloud database test through Hearsay's database helper and core tools, not a fake transport or local substitute.

## Connection change

`connectDatabase` now accepts optional `username` and reads `FALKORDB_USERNAME` when not supplied explicitly. It forwards that value alongside the password to the installed official FalkorDB client. Local Docker may leave the username blank. Explicit config takes precedence over environment values; omission preserves existing local behavior. The shared tool contract is unchanged and no dependencies were added.

The live local regression creates a uniquely named temporary ACL user, verifies explicit and environment authentication, verifies wrong-user rejection and sanitized failure output, then deletes that user. It never changes the Cloud user or its permissions. The initial test attempt failed because the local container was stopped; starting the existing Compose service fixed that. The SDK's socket type also rejected an inline `reconnectStrategy` property in the test; using the same inferred socket object pattern as the production helper fixed typecheck.

## Reproduce

Keep the host, port, username and password in gitignored `.env.cloud.local`. Set `HEARSAY_LLM=off`. Do not commit that file or paste its contents into reports. From the repository:

```powershell
pnpm exec tsx --env-file=.env.cloud.local packages/hearsay/src/cloud-smoke.ts
```

The script refuses localhost, uses a UUID template/player namespace, and never flushes the instance or changes its users. It writes a result report, verifies owned graph cleanup and preserves other graphs. Each run replaces the result report with its own evidence.

## Observed results

- Initial graph count: zero.
- `ensureWorld()` published the missing owned template; `getWorld` returned the seed's three NPCs.
- A second initialization returned `created:false`.
- Deleting only this run's template and initializing again recreated it correctly.
- Player creation used the Cloud graph copy operation. Recording a synthetic theft and recalling it as Brom returned the actual event with confidence 1.
- Closing the client and connecting again recovered that event and reused the existing template. This is connection continuity, not a Cloud restart or durability test.
- The owned player/template graphs were removed. Final graph count: zero.

## Remaining G11 acceptance

The core Cloud initialization and event checks now pass. **The website still uses its mock client**, so no HTTP route or browser-to-Cloud integration is claimed. R-005 now tracks only the app integration check with DuroT. G11 remains partial until the actual application calls this engine against Cloud and demonstrates the same recovery behavior. No Cloud persistence or live Gemini generation is claimed.

Validation after the change: `pnpm typecheck`, all 125 workspace tests (105 core, 5 contract, 13 website mock, 2 MCP), and all 49 query mirrors pass. Private Cloud settings remain gitignored.
