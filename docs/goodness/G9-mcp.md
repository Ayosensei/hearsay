# G9 — verified stdio MCP integration

The real server uses @modelcontextprotocol/sdk 1.32.1, Zod 4.6.7 and tsx 4.23.15. The SDK is mandated by the task; tsx runs the existing workspace TypeScript without checking in build output. Vitest/Node types match the existing core versions. esbuild is explicitly allowed to run its required install script; no blanket build approval was added.

createHearsay composes the existing world/memory/gossip/opinion/dialogue/policy services into the shared call interface. Each long-lived server reuses those services and their per-instance queues. The stdio entry creates one database connection, keeps protocol stdout clean and closes the connection on termination/disconnect. sayNaive is excluded from registration (reserved until G13). Core failures preserve JSON error envelopes; SDK schema-validation failures occur before tool execution.

The actual SDK client launches the actual stdio subprocess, lists all fourteen registered tools, creates a disposable player, records a theft, advances two ticks and verifies Brom -> Mira -> Garrick with 0.9/0.63. Another test rejects malformed MCP arguments. These are live FalkorDB/protocol tests, not mocks. See packages/mcp/README.md for launch/configuration instructions and official API references.

Installation encountered slow/resetting registry requests. Cached metadata and bounded retry settings allowed installation to finish. The first smoke attempt caught a missing direct Zod declaration; typecheck also required an explicit unknown callback type before schema parsing. Both were corrected. HTTP transport was optional and is not implemented. Production seed/UI integration, live Gemini verification and existing read/reset consistency limits are unchanged.

Final verification: pnpm typecheck and pnpm test pass all 117 workspace tests (97 core, 5 contract, 13 web mock, 2 live MCP). Test teardown leaves GRAPH.LIST empty. Live Gemini is still unverified.
