# DuroT — Frontend & UI Scope (`apps/web`)

**Hearsay: Explainable NPC Memory on FalkorDB**  
Hackathon: Graph Hacks (Track 02: Agent Memory & Coordination)  
Target: Win. Correctness, explainability, and adherence to `DESIGN.md`.

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

---

## 3. Strict Design Enforcement

All UI components adhere strictly to `DESIGN.md`:
- **Palette**: Obsidian canvas (`#05070B`), layered surfaces 1–3, Signal blue (`#8FA2FF` text/strokes, `#3150E9` fills), Gold (`#E8C46A`) strictly for provenance origins.
- **Typography**: Instrument Serif for hero headlines, Geist Sans for interface copy, Geist Mono for query IDs, numbers, and code cards.
- **Craft Checklist**: Concentric radii ($r_{outer} = r_{inner} + padding$), tabular figures for dynamic metrics, hit targets $\ge 44\text{px}$, and no arbitrary Tailwind brackets.
