# Hearsay — 2-Minute Demo Video Walkthrough Script

**Track 02:** Agent Memory & Coordination (Graph Hacks 2026)  
**Target Audience:** Hackathon Judges & Game Developers  
**Resolution:** 1920×1080 (Full HD, 60fps)  
**URL:** `http://localhost:3000`

---

## Act 1: The Knowledge Firewall (0:00 – 0:30)

1. **[0:00] Opening View (`/`):**
   - *"Welcome to Hearsay: an explainable, graph-native memory layer for game NPCs built on FalkorDB."*
   - Focus on the 3-panel workspace: NPC Directory on the left, Social Graph in the center, Dialogue on the right.
   - Point to **Martha Vane** (Innkeeper): notice her gold `Eye-Witness` badge for *Gold Donated to Guild*.

2. **[0:15] Firewall Test:**
   - Click **Garrick Thorne** (Blacksmith).
   - Point out Garrick's knows status: `Unaware (0 facts)`.
   - Type in chat: *"Did you hear what happened at the guild?"*
   - Garrick replies: *"I haven't heard anything about that, traveler."*
   - *"Notice the Knowledge Firewall active indicator in the top right. Even though the player donated gold in town, Garrick was not there. The LLM prompt is strictly isolated from un-witnessed world facts. Zero hallucination, zero omniscient telepathy."*

---

## Act 2: Rumor Propagation Across Trust Edges (0:30 – 1:00)

1. **[0:30] Advancing Time:**
   - Click the primary **Advance Time** button in the top navigation bar.
   - Tick increments from `0001` to `0002`.
   - Watch the animated SVG laser stream and traveling particle orbs diffuse along the `TRUSTS` edge from Martha to Garrick.

2. **[0:45] Grounded Dialogue:**
   - Select Garrick again: his status now shows `Heard via Martha (1 hop)`.
   - Ask him: *"Did you hear what happened at the guild?"*
   - Garrick replies: *"Martha told me you donated fifty gold to the guild. Fine work, traveler."*
   - Note the meta row: `Graph-grounded`.

---

## Act 3: Signature Moment — The "Why?" Card (1:00 – 1:30)

1. **[1:00] Provenance Inspection:**
   - Click the gold button under Garrick's message: **"Why do you know this?"**
   - The hero **Why? Card** appears at the bottom-left of the graph with its metallic chrome ring.
   - Point to the chain:
     - Origin (Gold): **Martha Vane** (Eyewitness, Confidence 0.90)
     - Receiver: **Garrick Thorne** (Confidence 0.72)
     - Mathematical decay: $c_{hop} = c_{prev} \times w_{trust} \times 0.85$.
   - The graph dims all background nodes and highlights the rumor path in signal blue.

2. **[1:15] Trace Inspector:**
   - Expand the bottom **FalkorDB Query Traces** drawer.
   - Point to query `Q12_explain_provenance` executing in **1.4ms**.
   - Show that all queries are pre-compiled, parameter-driven Cypher—the LLM never writes Cypher.

---

## Act 4: Dynamic World Agency & The Argument (1:30 – 2:00)

1. **[1:30] Act in Town:**
   - Click the **Act in Town** button.
   - Select action: *"Poison the Town Well"* (Harmful deed).
   - Select eyewitness: **Barty Green** (Stablehand) at the Town Well.
   - Click **Commit Action**.
   - A new red diamond event node sprouts in the graph with a dashed `WITNESSED` edge to Barty. Barty's attitude drops into Hostile (`-0.85`).
   - Click **Advance Time**: watch the rumor begin spreading to Martha and Captain Vane.

2. **[1:45] Control vs Hearsay:**
   - Click **Control vs Hearsay** in the top navigation bar.
   - Side-by-side comparison:
     - **Control (Plain LLM):** Guards arrest the player immediately across town due to telepathic hallucination, with zero source attribution.
     - **Hearsay (Graph-Grounded):** Guards only react once the rumor physically reaches them through trusted witnesses, backed by 100% auditable provenance.

3. **[1:55] Closing:**
   - Show the Developer Guide at `/landing`.
   - *"Hearsay ships as a lightweight TypeScript library and MCP server for FalkorDB, ready for Unreal, Unity, Godot, or agentic pipelines."*
