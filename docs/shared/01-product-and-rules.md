# 01 — Product, hackathon rules, scope

## Pitch

Hearsay gives game NPCs a memory that survives restarts, spreads like gossip, and can explain itself. Steal from the blacksmith and two ticks later the guard distrusts you. Click **Why?** and the game shows the exact chain of who told whom, and how much each retelling was believed.

It is a **tool for game developers** (TypeScript library + MCP server). The playable town "Hollowbrook" exists to prove it works. Effort split: ~70% memory layer, ~30% demo.

## Hackathon facts

- Event: Graph Hacks 2026 (WeMakeDevs x FalkorDB). Online. Oct 15 to Oct 18, 2026; submissions close Oct 18, 11:59 PM IST (7:29 PM WAT).
- We enter **Track 02: Agent Memory and Coordination**. Track focus points: episodic / semantic / procedural memory, persistent conversation history, shared state and handoffs between agents, high-concurrency reads and writes, separate memory per user or tenant.
- Prize is for the best project in the track.

## Rules that shape the build (from the official rules page)

1. FalkorDB must be the primary graph database and support a central part of the product.
2. **The graph has to do real work.** If the product still works once FalkorDB is taken out, the graph is decoration and the project does not qualify.
3. Data must be public, synthetic, or our own. No private or personal data.
4. Main coding and design work must happen during the event.
5. Each participant can be on only one team.
6. AI coding assistants are allowed but **must be disclosed**. Every participant must understand the code and be able to explain the graph model, queries, architecture and technical decisions. Projects that are entirely AI-generated without meaningful human contribution, verification or understanding may be rejected.
7. Every submission must include: public source repo; README with setup instructions and the graph data model; the Cypher queries or graph algorithms the product depends on; a demo video; a live deployment, or complete local setup instructions if it cannot be deployed; the track(s) entered.

## What judges reward (from the organisers' own reference article)

- The graph does work the agent could not do without it.
- The agent does not write its own queries: fixed tool catalogue, human-written parameterised Cypher, arguments validated against the graph.
- Answers carry the **path** that produced them, not an after-the-fact explanation.
- Honest abstention: "not in the graph" is shown differently from "nothing happened".
- Memory is just more nodes: write what was learned, connect it to what it is about, read it before reasoning, return when it was learned.
- A tenant is a graph, not a WHERE clause.

## Our three graph-only behaviours (the headline)

1. **Gossip propagation.** A rumor travels along TRUSTS edges, loses credibility each hop, and dies below a threshold. Multi-hop traversal.
2. **Explain-why.** Attitudes are explained by returning the actual path (`TOLD` chain) and the contributing events, never by asking the LLM to justify itself.
3. **Knowledge firewall.** An NPC can only speak from its own subgraph. It cannot leak or invent events it never learned.

Plus: one graph per player (isolation), persistence across restart, procedural memory that changes behaviour, a visible agent trace.

## Track 02 coverage map

| Focus point | How we cover it |
| --- | --- |
| Episodic memory | `Event` nodes + `KNOWS` edges (witnessed or heard), `Conversation`/`Utterance` nodes |
| Semantic memory | `Fact` nodes + `BELIEVES`, `TRUSTS`, `MEMBER_OF`, faction relations |
| Procedural memory | `Policy` nodes + `FOLLOWS` edges; `adaptPolicy` changes NPC behaviour after outcomes |
| Persistent conversation history | `Utterance` nodes survive restarts and feed `say()` |
| Shared state and handoffs | Scribe -> Gossip -> NPC agents hand off through the graph; the trace shows each handoff |
| High-concurrency reads/writes | `loadtest/` with many simulated players, published p50/p95 |
| Separate memory per user | One graph per player: `player:{id}` created via `GRAPH.COPY` from `world_template` |

## Scope

**MUST (this is the whole product):** episodic events, gossip with decay, explain path, knowledge firewall, graph per player, persistence across restart, README with queries, demo video.

**SHOULD (in this priority order, after MUST is demo-ready):** agent trace panel, **Control vs Hearsay compare view (`sayNaive`)**, procedural memory (Tilda's haggling), **timeline replay scrubber (UI-only)**, MCP server, load test numbers, `gossipHubs` (PageRank), live deployment.

**STRETCH (do not start before MUST is demo-ready):** community detection for dynamic factions, NPC-to-NPC conversations generating rumors, Discord bot front end, Python SDK.

## Non-goals

No player movement, no art pipeline, no multiplayer networking, no accounts/auth, no real money or blockchain features. One scene, six NPCs, text chat, a graph panel, an agent trace.

## Names

- Product / library: **Hearsay**. Demo world: **Hollowbrook**.
- Graph names: `world_template`, `player:{playerId}`.
