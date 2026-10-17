# Hearsay MCP (stdio)

The server exposes every shared tool except the demo-only sayNaive control. Tool arguments use the shared Zod schemas. Successful protocol calls return one text block containing the Hearsay envelope; core failures set MCP isError and preserve the error/trace envelope. Schema-invalid requests can be rejected by the SDK before a core call. No database query text is accepted from clients.

From the repository, run `pnpm mcp`. For a host configuration, launch Node directly so package-manager logging cannot interfere with the JSON-RPC stream. Replace these paths with the actual checkout:

```json
{
  "mcpServers": {
    "hearsay": {
      "command": "node",
      "args": [
        "--import", "/absolute/path/to/hearsay/node_modules/tsx/dist/loader.mjs",
        "--env-file-if-exists=/absolute/path/to/hearsay/.env",
        "/absolute/path/to/hearsay/packages/mcp/src/stdio.ts"
      ]
    }
  }
}
```

Use Node 24 and the normal FalkorDB environment settings. HEARSAY_LLM=off works without Gemini credentials. Optional HEARSAY_SEED_PATH and HEARSAY_TEMPLATE_GRAPH configure an isolated/custom template for testing; normal use defaults to seed/hollowbrook.json and world_template. The process closes its database client when stdin closes or it receives a termination signal. Diagnostics go to stderr, not stdout.

The live smoke test launches the actual process using the official SDK client, lists the catalogue, creates a disposable player, records a theft, advances two ticks and checks Garrick's explanation. No database or MCP transport mocks are used. HTTP transport is not implemented in G9; stdio is the required local integration. The production seed/UI and G7 lexical-firewall limitations still apply.

Dependencies: @modelcontextprotocol/sdk is the mandated official protocol implementation; tsx executes the workspace's TypeScript sources without changing their source imports or requiring checked-in builds. API usage follows the official [server](https://ts.sdk.modelcontextprotocol.io/server) and [client](https://ts.sdk.modelcontextprotocol.io/client) documentation.
