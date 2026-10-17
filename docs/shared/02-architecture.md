# 02 — Architecture

## Diagram

```
                        +--------------------------------------+
Browser (apps/web)  --> | Next.js API route /api/tool/[name]   |
  chat, graph panel,    |  validates input with zod (contract) |
  trace, Why? panel     +------------------+-------------------+
                                           |
MCP clients (any agent) --> packages/mcp --+--> packages/hearsay (core)
                                           |      tools/*  agents (scribe, gossip, npc)
                                           |      queries/*  (human-written Cypher)
                                           |      opinion.ts  firewall.ts  llm.ts
                                           v
                                      FalkorDB
                                      world_template        (the town, never mutated by play)
                                      player:{id}           (one graph per player)
```

LLM (Gemini) is called only from `llm.ts`, only by `say()`, only to write one short in-character reply from facts the NPC knows.

## Repo layout

```
AGENTS.md
docs/
packages/
  contract/        zod schemas, types, error codes, fixtures, MockHearsay
  hearsay/         core library
    src/
      db.ts            connect, run/ro helpers, trace capture, graph naming
      world.ts         ensureWorld(), seed loader, getWorld, newPlayer, resetPlayer
      queries/         one file per area; named parameterised constants (Qnn_...)
      tools/           one file per tool; each returns the envelope
      gossip.ts        spread + advanceTime engine
      opinion.ts       attitude scoring (pure functions, unit tested)
      firewall.ts      reply validation (pure functions, unit tested)
      llm.ts           Gemini wrapper, JSON output, retry, fallback signal
      templates.ts     fallback replies from seed templates
      index.ts         createHearsay(config) + getHearsay() singleton
  mcp/             MCP server (stdio and HTTP), registers tools from contract
apps/
  web/             Next.js demo + API route
seed/
  hollowbrook.json   world content (see 03-graph-model.md)
queries/             human-readable copy of every query (generated or hand-synced), for judges
loadtest/            concurrent-player benchmark
docker-compose.yml   FalkorDB with a persistent volume
.env.example
```

## Agents and handoffs (Track 02 "shared state and handoffs")

Three logical agents. They are not separate processes; they are separate responsibilities that hand off **through the graph**, and every handoff is visible in the trace.

1. **Scribe** (`recordEvent`): turns a player action into an `Event` node and `KNOWS {via:'witness'}` edges for each witness. Hands the new event id to Gossip.
2. **Gossip** (`spread`, `advanceTime`): reads `KNOWS` and `TRUSTS`, writes new `KNOWS` and `TOLD` edges, one hop per tick. Hands "who now knows what" to NPC agents implicitly: the next `say()` reads the updated graph.
3. **NPC** (`say`): reads `recall` + `attitude`, builds a prompt from only known facts, calls the LLM, runs the firewall, logs `Utterance` nodes.

The trace panel shows: agent, tool, query id, args, rows returned, milliseconds.

## Tenancy

- `world_template` is created once by `ensureWorld()` (idempotent) from `seed/hollowbrook.json`.
- `newPlayer(playerId)` runs `GRAPH.COPY world_template player:{playerId}`. Instant isolated save file. A query against one player's graph cannot reach another's, because it is not a WHERE clause anyone can forget.
- `resetPlayer(playerId)` deletes the player's graph and copies again.
- Never write to `world_template` during play.

## Self-healing world (important for the free Cloud tier)

FalkorDB Cloud free tier has no persistence and may be wiped. Every request path calls `ensureWorld()` first (cheap check: does `world_template` exist in `GRAPH.LIST`). If missing, it re-seeds. If a player graph is missing when a tool is called, return `UNKNOWN_PLAYER` with a hint to call `newPlayer`; the UI should auto-call `newPlayer` and retry once.

## Time model

Game time is an integer `tick` stored on the `Player` node. Wall-clock `at` (ISO string) is stored for display only. `advanceTime` runs one gossip hop for all rumors and increments `tick` by 1. Recency weighting in opinions uses ticks, not wall-clock, so the demo is deterministic.

## Request flow example: "steal the sword"

1. UI posts `recordEvent {playerId, type:'stole', place:'forge', witnesses:['brom'], subject:'iron sword'}`.
2. API route validates with zod, calls `hearsay.recordEvent`.
3. Scribe writes Event + KNOWS (Q30). Trace step returned.
4. UI refreshes `snapshot` and `attitude` for visible NPCs.
5. User clicks Advance Time: `advanceTime` runs Q40 + Q41; Mira and Ayla now know.
6. User clicks Advance Time again: Garrick and Fenn know (Garrick via Mira).
7. User asks Garrick something: `say` -> recall (Q50) -> attitude (Q51) -> LLM -> firewall -> Utterances (Q95).
8. User clicks Why?: `explain` returns chain Brom -> Mira -> Garrick with confidences 1.0 -> 0.9 -> 0.63.

## Environment variables

```
FALKORDB_HOST=localhost
FALKORDB_PORT=6379
FALKORDB_PASSWORD=
GEMINI_API_KEY=
GEMINI_MODEL=            # a current Flash model from Google AI Studio; check AI Studio, models get deprecated
HEARSAY_LLM=live         # live | off  (off forces template fallbacks; used by tests and load test)
NEXT_PUBLIC_HEARSAY_MODE=live   # live | mock (UI only)
```

## Non-functional targets

- Every tool call (excluding `say`) should complete in well under 100 ms against local FalkorDB for the demo-size graph. If not, profile with `GRAPH.PROFILE`.
- `say` is dominated by LLM latency; show a typing indicator and never block other UI actions.
- Player graph size stays small (hundreds of nodes). The free Cloud tier gives 100 MB total across all graphs.
