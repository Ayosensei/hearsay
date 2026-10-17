# DuroT — Frontend & UI Scope (`apps/web`)

**Hearsay: Explainable NPC Memory on FalkorDB**  
Hackathon: Graph Hacks (Track 02: Agent Memory & Coordination)  
Target: Win. Correctness, explainability, and adherence to `DESIGN.md`.

## Living Town — user-requested redesign

Minimal refinement: two main action buttons; saves, lenses and technical tools
are in Menu. Deeds are under Your story. The guide shows one step at a time.
Knowledge percentages and evidence appear when a villager is selected.

The user adopted the Living Town brief: a paper diorama, guided sword story,
selected-deed Ledger, separate knowledge/attitude explanations, real whisper
beats, traveller saves and accessible text mode. The older dashboard layout is
superseded for this work. See `living-town-implementation.md` and the copied
`HEARSAY_LIVING_TOWN_DESIGN.md` for behavior and renderer/artwork decisions.

## D10 live integration — 2026-10-17

The town now defaults to real `/api/tool/{name}` calls through a contract-validating HTTP client.
The route reuses the core engine and a server-only database connection; credentials never reach
the browser. NPCs, places, events, confidence and attitude scores come from the graph. Why? uses
the actual explain path and snapshot edge IDs. Advance Time, explicit event types, template/LLM
metadata, player A/B isolation and player reset are connected. Comparison calls sayNaive and say.
The current production seed has three NPCs; six-NPC content remains R-003. No live Gemini pass
is claimed without a configured key/model. See `D10-live-integration.md` for verification.

---

## 1. Overview of Delivered Frontend Scope

The frontend in `apps/web` serves as the **Developer Command Center & Town Simulation Inspector** for the Hearsay engine. It visually and interactively proves to judges that:
1. NPCs propagate rumors along `TRUSTS` edges with mathematical credibility decay ($c_{hop} = c_{prev} \times w_{trust} \times 0.85$).
2. The **Knowledge Firewall** prevents naive LLM hallucinations or omniscient telepathy by isolating context to facts within an NPC's personal knowledge horizon.
3. Every dialogue reply is grounded in an auditable graph traversal path via the signature **Why?** provenance card.
4. Developers can seamlessly drop Hearsay into game engines or agent workflows via TypeScript SDK and MCP protocol.

---

## 2. Completed Milestones & Tasks

| Task | Description | Status | Verification Artifact |
|---|---|---|---|
| **U0 & U1** | Next.js 16 + Tailwind CSS v4 + strict TypeScript monorepo setup in `apps/web`. | ✅ Done | `pnpm typecheck` |
| **U2** | "Obsidian & Signal" design system tokens implemented in `globals.css` with zero arbitrary values. Created automated linter `scripts/check-design.mjs`. | ✅ Done | `pnpm check:design` |
| **U3 & U4** | Styleguide at `/styleguide` displaying token hierarchy, attitude badges, knows chips, Why? card specimen, and dialogue bubbles. | ✅ Done | `/styleguide` route |
| **U5 & U6** | App shell & 3-panel workplace layout (NPC directory, Interactive Social Graph, Dialogue interface, Query trace drawer). | ✅ Done | `docs/duro/screens/task2_app_shell_1440x900.png` |
| **U7** | Dynamic SVG laser dash rumor stream (`flowDash` animation) and traveling particle orbs with path dimming. | ✅ Done | `docs/duro/screens/task3_particle_flow_1440x900.png` |
| **U8** | Signature **Why?** provenance card with chrome ring, gold origin witness, confidence decay metrics, and path focus. | ✅ Done | Rendered in simulator & styleguide |
| **U10** | Dynamic Player Action modal (`Act in Town`), sprouting event nodes (Help/Harm) with dashed `WITNESSED` edges and shifting NPC attitudes. | ✅ Done | `docs/duro/screens/task10_player_action_1440x900.png` |
| **U11** | FalkorDB Query Trace drawer with execution latencies, step counts, and pretty JSON parameter views. | ✅ Done | Bottom drawer in `/` |
| **U12** | Control vs Hearsay comparison modal contrasting naive LLM hallucinations with graph-grounded provenance. | ✅ Done | `docs/duro/screens/task3_control_vs_hearsay_1440x900.png` |
| **U13 (L1)**| Product Landing Page at `/landing`: Instrument Serif display headline, 01/02/03 numbered explainer cards, framed simulation preview, 10-line developer code card, and launch CTA. | ✅ Done | `docs/duro/screens/task13_landing_page_1440x900.png` |
| **U14** | Final polish, `prefers-reduced-motion` accessibility, dynamic typing indicator, hit target audit, and 2-minute demo video script. | ✅ Done | `docs/duro/DEMO_SCRIPT.md` & `docs/duro/screens/task14_town_dashboard_final_1440x900.png` |

---

## 3. Strict Design Enforcement

All UI components adhere strictly to `DESIGN.md`:
- **Palette**: Obsidian canvas (`#05070B`), layered surfaces 1–3, Signal blue (`#8FA2FF` text/strokes, `#3150E9` fills), Gold (`#E8C46A`) strictly for provenance origins.
- **Typography**: Instrument Serif for hero headlines, Geist Sans for interface copy, Geist Mono for query IDs, numbers, and code cards.
- **Craft Checklist**: Concentric radii ($r_{outer} = r_{inner} + padding$), tabular figures for dynamic metrics, hit targets $\ge 44\text{px}$, and no arbitrary Tailwind brackets.
