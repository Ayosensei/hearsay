# 09 — Demo, README, submission, judge Q&A

## Demo video script (about 3 to 3.5 minutes; trim step 7 first if it runs long; DuroT records, both review)

Prep: fresh Player A and Player B, `world_template` seeded, Gemini key working (or templates), FalkorDB Browser tab open, agent trace panel visible.

1. **Hook (10 s).** "NPCs forget everything. Hearsay gives them memory that spreads like gossip, survives restarts, and can explain itself. Built on FalkorDB."
2. **Isolation (15 s).** New player A: `newPlayer` copies `world_template`. Show the town graph. Mention one graph per player.
3. **Action (20 s).** Player A steals the iron sword at the forge. Brom is the only witness. Brom reacts (hostile). Graph shows one Event + one KNOWS edge.
4. **Firewall (20 s).** Ask Garrick: "Do you know what I did at the forge?" He says he knows nothing. The panel shows **not in the graph: Garrick has heard nothing** (distinct style from "nothing happened").
5. **Gossip (30 s).** Click Advance Time twice. Trace shows Scribe -> Gossip handoffs. Mira and Ayla hear first; then Fenn and Garrick. Ask Garrick again: he is wary and references the theft.
6. **Why? (25 s).** Click Why? on Garrick: chain Brom -> Mira -> Garrick lights up in the graph, confidences 0.90 and 0.63, with the contributing event and attitude breakdown. "This is a graph path, not an LLM explanation."
6b. **Control vs Hearsay (20 s).** Turn on Compare. Ask Garrick (before gossip reaches him) "Do you know what I did at the forge?" The plain LLM NPC, told everything, confidently talks about the theft. The Hearsay NPC says he knows nothing, and Why? shows no path. "Same model, same world. The only difference is the graph."
6c. **Replay (15 s).** Drag or play the timeline scrubber from tick 0 to 2: the rumor travels Brom -> Mira -> Garrick on screen.
7. **Reach contrast (15 s).** On a second event, run `spread` with `maxHops: 1` then `3` and compare who heard. (Mirrors the organisers' "depth 1 vs depth 4" advice.)
8. **Persistence (20 s).** Run `docker compose restart falkordb`. Reload. Garrick still remembers.
9. **Tenant isolation (15 s).** Switch to Player B: same town, clean slate, nobody knows anything.
10. **Procedural memory (20 s).** Lowball Tilda three times. Her markup goes 10% -> 25%; the Policy node changes in the graph and her quotes rise.
11. **Scale (10 s).** Show load test output: N concurrent players, p50/p95 for reads and writes (real numbers).
12. **Close (10 s).** Show the 10-line integration snippet and the MCP server. "Drop it into any game."

Record the video on Day 4 morning from a clean state. Keep a backup recording from Day 3 night.

## README structure (DuroT drafts; Goodness fills the graph sections)

1. One-paragraph pitch + GIF/screenshot of the Why? graph path.
2. **Why this needs a graph** (3 bullets: gossip traversal, explain path, per-player graph).
3. Quickstart (the five commands from `08-deployment.md`).
4. **Graph data model** (diagram + node/edge list from `03-graph-model.md`).
5. **Queries and algorithms the product depends on**: link to `queries/` and `05-queries.md`; list each query id with one line.
6. Tool catalogue (table from `04-tool-contract.md`) and the 10-line integration example.
7. Architecture diagram and agent handoffs (Scribe -> Gossip -> NPC).
8. Track 02 coverage table (from `01-product-and-rules.md`).
9. Load test results (measured, with machine description).
10. Demo video link, live link (if any, with the free-tier caveat).
11. **AI usage disclosure**: which tools were used (coding agents, which models), what humans wrote, what humans verified.
12. Team and licence.

## Submission checklist (submit by 3 PM WAT on Oct 18)

- [ ] Registered on the WeMakeDevs page; team managed from the panel (each person on one team only)
- [ ] Public repo with commit history inside the event window
- [ ] README complete (all 12 sections)
- [ ] `queries/` folder + `05-queries.md` match the code
- [ ] Demo video uploaded (about 3 min), link in README
- [ ] Live deployment link, or complete local instructions (we always include local instructions)
- [ ] **Track named: Track 02** (consider also naming Track 01 only if MCP tools and algorithm tools are demonstrably working; keep the pitch focused on Track 02)
- [ ] AI usage disclosed
- [ ] Blog post published (separate side prize for best blog post)
- [ ] Both team members can answer the Judge Q&A below without notes

## Blog post (DuroT drafts, Goodness reviews)

Title idea: "How I gave game NPCs gossip using a graph database". Structure: the problem (NPCs forget, LLMs leak), the model (Event/KNOWS/TOLD/TRUSTS), the gossip query, explain-path, the firewall, what surprised us, numbers. Include the queries and the Why? screenshot. Publish on any free platform and link it from the README.

## Judge Q&A (both must be able to answer)

1. **Why a graph and not Postgres?** The product's core questions are traversals: who can pass a rumor to whom, over how many hops, with what decay; and "show me the path". In SQL each is a recursive join. In FalkorDB the gossip step is one pattern and the explanation is the returned path.
2. **If I remove FalkorDB, what breaks?** Gossip, explain, per-player isolation via `GRAPH.COPY`, the firewall's knowledge scoping, and PageRank hubs. Everything that makes the product distinct.
3. **Does the LLM write queries?** No. Fixed tool catalogue, human-written parameterised Cypher, ids resolved against the graph before anything runs. The LLM only writes in-character dialogue from facts the NPC knows.
4. **How do you stop NPCs hallucinating events?** The prompt contains only known events; the firewall rejects replies that reference unknown event ids or mention unknown-event keywords; fallback templates never mention events.
5. **How is credibility computed?** `teller.confidence x trust(listener -> teller)`, one hop per tick, stops below 0.25. Show the golden example (0.9, 0.63, 0.36).
6. **How do you isolate users?** One graph per player, created by `GRAPH.COPY` from `world_template`. A query against one graph cannot reach another's.
7. **What is episodic vs semantic vs procedural here?** Events/KNOWS/Utterances; Facts/BELIEVES/TRUSTS/factions; Policy + FOLLOWS (haggling markup that changes).
8. **How does it scale?** Show measured load test numbers; be honest about what was and was not measured and on what machine.
9. **What would you build next?** Community detection to derive factions from trust edges; NPC-to-NPC conversation generating rumors; Unity/Godot bindings; distortion of rumors as they spread.
10. **What did AI write?** Answer honestly from the README disclosure; explain a query line by line.

Each owner adds 3 to 5 extra "I can explain this" notes for their own code in their personal README section.
