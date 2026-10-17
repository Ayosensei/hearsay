# Hearsay CLI

Run the real Hearsay memory engine from a game project's directory: initialize a world, call tools, serve a local HTTP API or expose MCP.

**Publication status:** this package is not published. The unscoped npm name `hearsay` already belongs to an unrelated library. The owner selected `@goodynessdev/hearsay` and the MIT license; npm authentication is pending. `private:true` currently prevents accidental publication.

## Requirements

- Node 22.12+ on the 22 line, Node 24, or Node 26+.
- A running FalkorDB instance: existing local Docker or Cloud credentials.
- A Gemini key/model only if you enable generated dialogue. Templates work without one.

The CLI runs locally. It does not automatically modify a compiled game or discover gameplay events. A game adapter supplies NPC IDs, events and witnesses and consumes replies.

## Try from this repository

```powershell
pnpm cli init --project C:/path/to/my-game
cd C:/path/to/my-game
docker compose -f hearsay.compose.yml up -d
```

The initializer creates `hearsay.config.json`, `hearsay/world.json`, `hearsay.compose.yml` and `.env.hearsay.local`. It adds the environment file to `.gitignore` before writing it and preserves existing files on repeat runs. The starter world currently contains Brom, Mira and Garrick. Customize it for your game's content.

From the Hearsay repository, add `--project C:/path/to/my-game` to subsequent `pnpm cli` commands. An installed `hearsay` command uses the current directory by default.

## Try the actual package before npm publication

```powershell
# In packages/cli; prepack builds the standalone executable and includes its starter world
npm pack

# In an unrelated game project; replace the archive path
npx --yes --package C:/path/to/goodynessdev-hearsay-0.1.0.tgz hearsay init
npx --yes --package C:/path/to/goodynessdev-hearsay-0.1.0.tgz hearsay doctor
```

You can also install the archive as a development dependency, then use `npx hearsay`. Do not run plain `npx hearsay` before installing our archive: npm would fetch the unrelated public package.

After publication, the command will be `npx @goodynessdev/hearsay init`. This command is not available publicly yet.

## Commands

| Command | Purpose |
| --- | --- |
| `hearsay init` | Scaffold config, private env, world and optional Docker Compose file |
| `hearsay doctor` | Check config, seed-file presence and DB connection without graph writes |
| `hearsay tools` | List all 15 engine tools with their Zod-derived JSON input schemas |
| `hearsay call <tool> --json '<object>'` | Execute a tool directly against the database |
| `hearsay call <tool> --input input.json` | Read tool input from a JSON file; useful on Windows |
| `hearsay serve` | Start the bearer-authenticated local API on port 8787 |
| `hearsay mcp` | Start official MCP stdio transport; 14 tools, excluding `sayNaive` |
| `hearsay help` / `--version` | Show help/version |

Global options: `--project <directory>`, `--env-file <path>` relative to that project. `serve` also accepts `--port`. `--json` and `--input` are mutually exclusive. Tool output preserves the shared `{ok,data,trace}` / `{ok:false,error,trace}` envelope. Failed calls exit nonzero.

Examples after installation:

```powershell
hearsay call getWorld
hearsay call newPlayer --json '{"playerId":"demo"}'
hearsay call recordEvent --input event.json
hearsay call advanceTime --json '{"playerId":"demo"}'
hearsay call recall --json '{"playerId":"demo","npcId":"brom"}'
hearsay call attitude --json '{"playerId":"demo","npcId":"garrick"}'
hearsay call say --json '{"playerId":"demo","npcId":"garrick","text":"What have you heard?"}'
```

Example `event.json`:

```json
{
  "playerId": "demo",
  "type": "stole",
  "subject": "iron sword",
  "placeId": "forge",
  "witnesses": ["brom"]
}
```

Other available tools include `explain`, `whoKnows`, `spread`, `snapshot`, `gossipHubs`, `adaptPolicy`, `resetPlayer` and the demo-only `sayNaive`. `resetPlayer` discards that player's current memory and rebuilds it from the template. Inspect exact inputs with `tools`; the starter seed does not contain Tilda's production policy.

## Connection settings

Edit `.env.hearsay.local` privately. It contains host, port, optional username/password, LLM settings and a generated `HEARSAY_API_KEY`. The API key is never printed by the CLI. Existing process environment values take precedence over loaded environment-file values.

For Cloud, copy the connection settings into this private file, or select another with `--env-file`. An alternate file replaces the default file selection; include `HEARSAY_API_KEY` if you use it with `serve`. Credentials stay in the backend, not in a game build.

`hearsay.config.json` selects the seed, template name and HTTP port. The default template name derives from the project directory. Existing templates are not overwritten when seed content changes. Use a dedicated database per game: player graphs retain the core engine's `player:<id>` namespace.

## Local HTTP API

```powershell
hearsay serve
```

- `GET /health`: minimal service/contract-version health, no bearer token required.
- `GET /tools`: bearer token required; returns available tool names and input schemas.
- `POST /tools/<toolName>`: bearer token and `Content-Type: application/json` required. The request body is the tool's input object.

Send `Authorization: Bearer <HEARSAY_API_KEY>` from a trusted local native client. Responses contain real graph-derived data and traces. Invalid tool inputs return 400, unavailable DB calls return 503 and other engine failures return 422. Malformed/oversized requests, missing authorization and unknown routes are rejected.

The server binds only `127.0.0.1`, rejects browser Origin headers and unexpected Host headers, and caps bodies at 64 KiB. It is a local developer bridge for native Unity clients and other backend processes. Browser/WebGL calls, public hosting, per-user authorization and a distributed game-server deployment require an application adapter. Do not treat the local bearer token as multiplayer player authentication.

## MCP

Configure your MCP host to execute the installed `hearsay mcp` binary with `--project` pointing to the game project. Stdout carries MCP protocol only; diagnostics go to stderr. API bearer authentication is for HTTP; stdio MCP relies on the local host process. The same graph-backed tools are used in both transports.

## Evidence

Tests exercise real local FalkorDB through HTTP and subprocess CLI/MCP calls. Fake database implementations are not used. Model generation remains off for these integration checks. Packaging verification must also install the actual archive in a separate directory before a release; repository execution alone does not prove standalone installation.
