# Hearsay — DuroT master plan (frontend / `apps/web`)

> Working title: rename this file to `GRAPHHACKS.md` (or whatever you like).
> Written: Thu 15 Oct 2026, 21:37 WAT. Deadline: **Sun 18 Oct 2026, 7:29 PM WAT** (11:59 PM IST).
> Time left at writing: **about 69 hours**, of which maybe 35 to 40 are realistic working hours.

---

## 0. Read this first: what is known and what is guessed

**Known (from `AGENTS.md` and `DESIGN.md`, the only two specs we have):**
the product, the hard rules, the tech stack, commit discipline, the full design system, and the UI building blocks the design system names (NPC card, attitude badge, knows chip, trace row, chat bubble, Why? card, graph panel, tabs, toast, landing page, styleguide).

**NOT known (referenced by AGENTS.md but not present in our workspace):**

| Missing file | Why it matters | Status |
|---|---|---|
| `docs/duro/README.md` | Our official task list and IDs (`D8`, `U8`, `L1`…) | Missing |
| `docs/duro/ui-spec.md` | Layout, panel sizes, copy, states; it *wins over DESIGN.md on layout* | Missing |
| `docs/shared/01…07-*.md` | Tool contract (`04`), behaviour specs (`06`), queries (`05`), workflow (`07`) | Missing |
| `docs/requests.md` | Cross-owner requests | Missing |
| `packages/contract` | zod schemas + `MockHearsay`, the thing that lets us build with no backend | Not built yet |
| `.githooks/`, `pnpm check:design`, workspace scaffold | Created by Goodness's task G1 | Not built yet |

The GitHub repo `Ayosensei/hearsay` is **empty**, so these probably live only on Goodness's machine.

**Consequences:**
1. Task IDs below (`U0`…`U14`) are **provisional**. Map them to the real IDs in `docs/duro/README.md` once we get it.
2. Layout sections are a **best reconstruction** from DESIGN.md. `ui-spec.md` overrides me wherever they disagree.
3. **Action for you today:** ask Goodness to push the G1 scaffold plus all of `docs/`. Until then we can build components and styleguide, but not integrate.
4. **Do not push our own initial commit to `main` before Goodness's scaffold lands.** Two unrelated root commits means painful merge conflicts. Either wait, or push to a branch `duro/bootstrap` and let Goodness merge.

---

## 1. The product in UI terms

Hearsay = an NPC memory layer. The web app is the **proof it works**: a playable town called **Hollowbrook** where you can watch rumors travel and ask any NPC *"why do you know that?"*.

What the user does in the demo (the story our UI must tell in 90 seconds):

1. See a town: NPCs as nodes in a graph, linked by trust.
2. Do something to the world as the player, such as help or harm someone, in front of a witness.
3. Press **Advance Time**. Gossip spreads along trust edges. Credibility decays per hop. Attitudes toward the player shift.
4. Talk to an NPC who *wasn't there*. They reply **only** with what they know (knowledge firewall).
5. Click **Why?**. The graph dims, the exact rumor path glows, and a card explains: *witness → teller → listener, with confidences (0.90 → 0.63)*.
6. Compare **Control** (plain LLM NPC, no provenance) vs **Hearsay** (graph-grounded, with provenance).
7. Open the **trace** and see every query that ran (`Q40_gossip_candidates`, rows, ms), proving the graph does real work.

The UI is our main weapon for judges. DESIGN.md says it plainly: the Why? card is "the single most beautiful thing in the product".

### Rules from AGENTS.md that shape the UI

- UI never shows or sends Cypher. It shows **query ids, args, rows, ms** from `TraceStep`s only.
- Every tool returns `{ ok: true, data, trace }` or `{ ok: false, error: { code, message } }`. We must render the error envelope gracefully: `UNKNOWN_NPC`, `UNKNOWN_EVENT`, `UNKNOWN_PLACE` and others.
- Per-player isolation: every request carries a player id. The UI must have a notion of "my world", and ideally a visible **Reset world** or **New player** action to demo isolation.
- The NPC chat must never display events the NPC doesn't know. That's backend/prompt territory, but the UI should make the *absence* of knowledge look intentional ("Mara hasn't heard anything about you").
- No hard-coded colours, sizes or fonts. Tokens only. `pnpm check:design` must pass.
- Every component appears on `/styleguide` **in all its states, in the same commit**.
- 1440×900 screenshot to `docs/duro/screens/` after each UI task, committed.
- No new UI, icon or animation libraries.

---

## 2. Can we build without the backend? Yes, most of it

Short answer: **about 80 to 85% of the frontend can be built and polished with zero backend**, if we build against a **mock that returns the real envelope shape**. This is the right approach, and AGENTS.md already anticipates it: `packages/contract` ships `MockHearsay` for exactly this purpose.

### 2.1 Buildable now, backend-free

| Area | Why it's backend-free |
|---|---|
| Design tokens, Tailwind theme, fonts, CSS variables | Pure frontend |
| shadcn/ui base components themed to DESIGN.md | Pure frontend |
| `/styleguide` page (every token and component state) | Static |
| NPC card, attitude badge, knows chip, chip variants | Props only |
| Chat bubble, chat input, send button | Props plus fake reply |
| Trace row and trace panel | Renders `TraceStep[]` fixtures |
| Why? card (hero, chrome ring, avatar chain, confidences) | Renders a path fixture |
| Graph panel with `react-force-graph-2d`: nodes, faction rings, diamonds, dimming, particles | Renders a fixture graph |
| Rumor-path highlight and animation | Driven by a path array |
| App shell, panels, tabs, empty, loading and error states | Static |
| Control vs Hearsay split view | Fixtures for both columns |
| Landing page (optional L1) | Static |
| Motion system, reduced-motion handling, a11y, focus rings, 44px hit areas | Pure frontend |
| Demo-flow choreography (scripted "Advance Time" ripple) | Can be faked from fixtures |

### 2.2 Needs the backend (or at least a real contract)

| Area | Dependency |
|---|---|
| Real gossip results after Advance Time | Goodness's gossip query and tool |
| Real Why? path and confidences | Explain-path query |
| Real trace ids, rows and ms | Every tool |
| Real LLM dialogue (Gemini) | `llm.ts` plus API keys |
| Per-player isolation proof | FalkorDB graph copying |
| Knowledge firewall verification | Firewall queries |
| Loadtest numbers | Real DB |
| MCP server (not ours) | n/a |
| Final correctness of copy and numbers in the demo video | Real data |

### 2.3 The mock strategy (critical)

**Do not invent the contract.** AGENTS.md rule 6: "The contract is law… change only via `docs/requests.md`". So:

1. **Preferred:** as soon as `packages/contract` exists, import its zod types and `MockHearsay`. Build everything against them.
2. **Until then (bridge):** create a thin adapter in `apps/web/src/lib/hearsay-client.ts`:
   - one TypeScript `interface HearsayClient` with the methods the UI needs;
   - `mode = "mock" | "live"` chosen by env `NEXT_PUBLIC_HEARSAY_MODE`;
   - a throwaway fixture implementation marked `// PROVISIONAL: replace with MockHearsay from packages/contract`.
3. **When the contract lands:** delete the throwaway types, point the adapter at the contract types, fix compile errors. If a shape mismatch shows up, **write it in `docs/requests.md`**; don't patch around it silently.
4. Fixtures must be **realistic and synthetic** (rule 10: no personal data). Use Hollowbrook characters, not real people.

> Open question for Goodness (ask early): which methods will the contract expose, and can `MockHearsay` plus fixtures be pushed first, before real queries? That is the single thing that unblocks us most.

---

## 3. Workstreams and tasks

Legend: **[BF]** backend-free · **[BD]** backend-dependent · **[MIX]** mock first, then swap.
Each task lists *Deliverable*, *Acceptance*, and *Notes*. Every task ends with: `pnpm typecheck`, `pnpm check:design`, styleguide updated, 1440×900 screenshot committed, commit per AGENTS.md §3b.

### U0 · Environment and repo bootstrap [BF]

**State of this machine (checked):** Node v24.15.0 ✅ (needs ≥ 20) · npm 11.12.1 ✅ · corepack 0.34.6 ✅ · git 2.54 ✅ · **pnpm ❌ not installed** · **Docker ❌ not installed** · workspace is **not a git repo**.

Steps:
1. `corepack enable` then `corepack prepare pnpm@latest --activate` (may need an admin PowerShell on Windows; fallback: `npm i -g pnpm`).
2. Docker: needed only for `pnpm test` and live backend work. **We do NOT need it to build the UI in mock mode.** Install Docker Desktop later if we integrate locally. Alternative: point at Goodness's FalkorDB Cloud instance for integration.
3. `git clone https://github.com/Ayosensei/hearsay.git` once Goodness has pushed the scaffold. Configure `user.name` and `user.email`. Run `pnpm i` (the `prepare` script sets `core.hooksPath .githooks`).
4. Branch: `duro/<topic>`, e.g. `duro/web-foundation`.
5. Create `docs/duro/screens/`.

Acceptance: `pnpm -v` works; repo cloned; hooks active (a bad commit message is rejected).

### U1 · `apps/web` scaffold [BF]

- Next.js (App Router), TypeScript `strict`, Tailwind, shadcn/ui init, in the existing pnpm workspace as `apps/web`. Follow the `--help` first and non-interactive rule.
- **Decision needed:** Tailwind v3 vs v4. shadcn's current default is v4 and the tokens map cleanly to CSS variables via `@theme`. Recommended: **v4**, unless Goodness's scaffold already picked one. Confirm.
- Scripts: `dev`, `build`, `typecheck`, `check:design` (if G1 didn't create the checker, ask before writing our own).
- `.env.example`: `NEXT_PUBLIC_HEARSAY_MODE=mock`, plus whatever the backend needs. No secrets in git.
- Routes stubbed: `/` (town app), `/styleguide`, optional `/landing`.

Acceptance: `pnpm dev` serves a blank dark page; `pnpm typecheck` passes.

### U2 · Design tokens and theme [BF]

Source of truth: DESIGN.md front matter. **Regenerate, don't hand-type** (AGENTS.md §3c).

- Map all colours to CSS variables and Tailwind semantic classes: surfaces 1 to 3, borders, text 1 to 3, primary (+hover, pressed), signal, gold, danger, success, attitude (5), event (2), agent (4), faction (3).
- Type scale: display-xl/lg/md (Instrument Serif), headline, body-lg/md, label, caption (Geist), mono-md/sm (Geist Mono). Load via `next/font/google`: `Geist`, `Geist_Mono`, `Instrument_Serif` (weight 400, normal and italic). If unavailable in the installed Next version, use the closest equivalent **and record it on the styleguide**.
- Radii (8/12/16/24/full) and spacing (4 to 64) tokens.
- Global rules: `-webkit-font-smoothing: antialiased`; `tabular-nums` utility; `text-wrap: balance` on headings and `pretty` on prose; max prose 68ch; focus-visible = 2px `signal` ring with 2px offset.
- Elevation utilities: card, raised, floating, signal-glow, chrome-ring (conic gradient, masked), as exact recipes from DESIGN.md §5.
- Background: flat `background` plus one faint radial `primary` wash at 6%, top-left, optional 2% noise.
- Motion tokens: 120/200/320ms, easing `cubic-bezier(0.22,1,0.36,1)`, entrance and stagger helpers, `prefers-reduced-motion` handling. **Never `transition: all`.**
- Run `npx @google/design.md lint DESIGN.md`. DESIGN.md says it's an "alpha format", so findings are expected (key names, section order, extra Motion/Craft sections). Fix them by moving rules, never by deleting them.

Acceptance: a page showing every token; lint passes; no hex codes in `apps/web` outside the generated token file.

### U3 · Base components (shadcn, themed) [BF]

Button (primary / secondary / ghost; hover, pressed 0.96, disabled 40%, loading spinner without width change; 40px tall with 44px hit area), Input, Tabs (sliding 2px underline, 200ms), Tooltip (150ms delay), Toast (sonner, max 3, bottom-right), Card (outer xl + 8px pad wrapping inner lg + 16px pad; **concentric radii**), Panel, Chip (default / signal / provenance), Avatar (initials, 1px inset outline, faction ring, chrome ring when selected), Skeleton, ScrollArea, Separator.

Acceptance: each in every state on `/styleguide`; keyboard focus visible; hit areas ≥ 44px.

### U4 · `/styleguide` page [BF]

One long page: colour swatches with roles, type specimens, spacing and radius scale, elevation recipes, motion demos, every component × every state, empty/loading/error variants. **This is the review tool** and it must be updated in the *same commit* as any component change. Also record font-fallback decisions here.

### U5 · Domain components [BF]

Built from props only, on top of U3:

1. **NPC card:** avatar (initials, faction ring) + name (headline) + role (caption) + attitude badge + knows chip; selected = chrome ring + `surface-3`.
2. **Attitude badge:** pill, icon + label + tabular score, 12% tinted background, full-colour text. Five levels: hostile, wary, neutral, friendly, devoted. Colour is **never alone**: always icon + label.
3. **Knows chip:** none = `chip`; heard via X = `chip-signal` + ear icon; saw it = `chip-provenance` + eye icon.
4. **Chat bubble:** player = `surface-3`, right. NPC = `surface-2`, left, 2px left border in faction colour; meta row in caption/tertiary.
5. **Trace row:** mono, `surface-2`, 6px agent-colour dot, query id (secondary), rows and ms right-aligned tabular; 1px `signal` connector at 40% between rows. Agents: scribe, gossip, npc, system.
6. **Event node / event row:** harm vs help tint; diamond icon.
7. **Eyebrow:** 13px label, tertiary, 0.08em tracking, optional mono numbering `01`, `02`, `03`.
8. **Code card:** `surface-1`, mono; syntax limited to primary text, `signal`, `gold` (strings), tertiary (comments).

Icons: **lucide only**, stroke 1.75, sizes 16/20/24. No emojis, no stock art, no mascots.

### U6 · App shell and layout [MIX]

Target **1920×1080 (video)** and **1440×900** (screenshots). Reconstruction (confirm against `ui-spec.md`):

- Left: **Town** panel (NPC list/cards, player summary).
- Centre (focal point): **Graph** panel.
- Right: **Dialogue** (chat) panel with NPC header and attitude.
- Bottom or side drawer: **Trace** panel (tabs: Trace · Knowledge · Events).
- Top bar: logo, world/player id, **tick counter** (mono tabular), **Advance Time** (the one primary action), Reset world, Hearsay/Control toggle.
- 12px gutters, 16px panel padding, 4px grid, one clear focal point.

Include **empty, loading and error** states for every panel, "as polished as the populated state". Skeletons reserve space (no layout shift). Error states render the envelope: code + message + a retry.

### U7 · Graph panel (`react-force-graph-2d`) [BF → MIX]

- Nodes: NPC = circle with **faction ring** (townsfolk / guard / merchants); event = **rounded diamond**; player = small `primary` dot. Node tint by attitude where relevant.
- Edges: TRUSTS (weight shown on hover), WITNESSED, KNOWS/HEARD.
- Interactions: hover tooltip, click selects NPC (syncs with the list and chat), zoom/pan, reset view.
- **Highlight mode:** dim everything else; the path glows in `signal` with **continuous particles teller→listener** (the one permitted looping animation) and a 400ms ease-in. Reduced motion: static thick line, no particles.
- Performance: small town (≈ 10 to 20 NPCs), but keep draw code cheap since the loadtest may inspire a bigger graph.
- Canvas drawing can't use CSS variables directly, so read tokens once at mount from computed style. **No hex literals in the draw code** (check:design will scan).

Acceptance: fixture graph renders; selecting a path animates; 60fps feel on a laptop.

### U8 · Why? card (signature moment #1) [BF → MIX]

- `card-hero`: signal glow + **chrome ring top edge** (max two chrome elements on screen at once, so coordinate with the selected-avatar ring).
- Serif headline with **one italic word**: "How Garrick *learned* about it". `text-wrap: balance`.
- Chain: avatars joined by signal-blue arrows; **gold only on the root witness**; tabular confidences (0.90 → 0.63); arrows nudged 1px toward their direction.
- Footer chips: source tags (gold = provenance), hop count, total decay.
- "Saw it yourself" variant (direct witness) and "no provenance / doesn't know" variant (quiet).
- Entrance: opacity + translateY(8px) + blur(4px) → 0 over 320ms; subtle exit.
- Clicking a chain avatar focuses that NPC in the graph and highlights the path (links to U7).

This is the demo's money shot. **Budget real time here.**

### U9 · Dialogue panel [MIX → BD]

- Chat list, input, Send (primary), typing/loading state, error and retry.
- NPC header: avatar, name, role, attitude badge, knows chip.
- Under each NPC reply: meta row with a **Why?** action (opens U8), plus which facts it was grounded in.
- "I haven't heard anything" empty state for an NPC who knows nothing about the player.
- Mock mode: scripted replies from fixtures. Live mode: calls the Next.js API route → `packages/hearsay` (**our API routes call the library directly**; no separate server).
- Accessibility: `aria-live="polite"` for new replies; keyboard send.

### U10 · Time and actions [MIX → BD]

- **Advance Time** button (primary, the only one in its region). Shows a tick counter, with a crossfade 120ms in place, tabular, no layout shift.
- Player action panel (provisional list; confirm in the behaviour spec): do something helpful or harmful, optionally with a place and a witness. Primary "Do it".
- After advance: animate gossip as a staggered ripple across the graph (40ms per item, cap 400ms), and toast "3 rumors spread".
- Events feed (harm = `event-harm`, help = `event-help`).
- **Place and NPC pickers resolve from the loaded world**, not free text (mirrors the "resolve names against the graph" rule).

### U11 · Trace panel [BF → MIX]

- Renders `TraceStep[]` (agent, tool, queryId, args, rows, ms).
- Grouped per tool call, with connectors between hand-offs.
- Expand a row to see args as pretty JSON (Geist Mono). **Never display Cypher.**
- Sum row: total queries, total ms. Filter by agent.
- Highlights when a query belongs to the currently shown Why? chain.

### U12 · Control vs Hearsay (signature moment #3) [MIX]

Two columns: left **Control** (plain LLM NPC, quiet "no provenance" note), right **Hearsay** (gold provenance, path, trace). Same question to both, side by side. *The contrast is the argument.*
Note: the Control column needs a non-graph LLM answer; ask Goodness whether the backend offers it or whether we script it.

### U13 · Landing page (optional "L1") [BF]

Only after the core flow is polished. Hero (Instrument Serif, one italic word, `text-wrap: balance`), subline, CTAs "Open the town" and "Read the docs", framed product screenshot with chrome ring, numbered 01/02/03 explainer cards, a 10-line integration code card, closing CTA. 96 to 128px section rhythm, max width 1120px. Hits the "library + MCP server" story judges care about.

### U14 · Polish, resilience, demo readiness [MIX]

- Run the craft checklist (DESIGN.md §9, 12 items) against every component.
- `prefers-reduced-motion` pass; contrast pass (≥ 4.5:1 text, 3:1 UI strokes); keyboard-only run-through.
- Offline/mock fallback: if the DB or LLM is down during the demo, the app must **degrade gracefully** (a clear banner, not a blank screen). Consider a "demo mode" that replays a recorded run.
- Seed or reset flow for a clean demo state with one click.
- Record the **1920×1080** demo video script and rehearse. Capture final screenshots to `docs/duro/screens/`.
- Contribute to the README "AI usage" section (humans maintain it; our agent-written commits carry the `Assisted-by:` trailer).

---

## 4. Suggested schedule (proposal, adjust with Goodness)

Checkpoint timings C1 to C4 are defined in docs we don't have. This is my proposal in WAT:

| Slot | Focus | Output |
|---|---|---|
| **Thu 15 Oct night** | Get docs + scaffold from Goodness; U0, U1, start U2 | Tokens page rendering, pnpm working |
| **Fri 16 Oct morning** | U2 finish, U3, U4 | Themed base components on `/styleguide` |
| **Fri afternoon/evening** | U5, U6, U7 (fixture graph) | App shell with a live-looking graph |
| **Sat 17 Oct morning** | U8 (Why? card), U11, U9 (mock) | The signature moment working on fixtures |
| **Sat afternoon** | Integrate with real contract/backend (U9, U10 live), U12 | End-to-end happy path |
| **Sat night** | U14 polish, bugs, landing (U13) if time | Feature-freeze candidate |
| **Sun 18 Oct morning** | Bug-fix only; record demo video; README | Video + screenshots |
| **Sun until 3 PM WAT** | Final merge to `main`, tag `final`, submit | **Submission buffer of about 4 hours** |
| **Sun 7:29 PM WAT** | **Hard deadline** | — |

**Cut list if we run late (in order):** U13 landing → U12 Control vs Hearsay (script it) → graph particles polish → Reset world UI. **Never cut:** U8 Why? card, U7 rumor path, U11 trace, working `main`.

---

## 5. Definition of done (per task)

- [ ] Acceptance criteria met and **demonstrated** (screenshot or recording).
- [ ] `pnpm typecheck` ✅ · `pnpm check:design` ✅ · tests for what we touched ✅
- [ ] Component appears on `/styleguide` in **all** states, in the same commit.
- [ ] 1440×900 screenshot saved in `docs/duro/screens/`, committed.
- [ ] `docs/duro/README.md` updated with the UI behaviour.
- [ ] Commit follows `<area>(<task>): <summary>` ≤ 72 chars, with the `Assisted-by:` trailer on agent-written commits. Areas for us: mostly `web`, plus `docs`, `chore`.
- [ ] Pushed. Never `--no-verify`, never force-push `main`, never commit `.env`.
- [ ] You (DuroT) can explain the code. Simple and boring beats clever.

---

## 6. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Contract and docs not delivered soon | Blocks integration | Build against the provisional adapter; ask Goodness now |
| Contract shape differs from our provisional types | Rework | Keep the adapter thin; one place to fix |
| Fonts unavailable in `next/font` | Visual mismatch | Fallback + record on styleguide |
| Docker not installed locally | Can't run tests/DB | Mock mode for UI; use FalkorDB Cloud or install Docker |
| Windows corepack permissions | pnpm won't enable | `npm i -g pnpm` |
| `check:design` is stricter than expected (arbitrary values) | Commit rejections | Tokens-first, run before each commit |
| Canvas graph can't read CSS variables | Hard-coded hex slip | Read computed style once at mount |
| Demo day: LLM/DB flakiness | Demo failure | Replay mode, graceful errors, rehearsed video |
| Scope creep | Misses deadline | Follow the cut list; AGENTS.md says no stretch items |
| Two roots / merge conflict on first push | Lost time | Wait for Goodness's scaffold or push to a branch |

---

## 7. Questions to resolve (send to Goodness / decide)

1. Can you push the G1 scaffold, `packages/contract` (with `MockHearsay`) and all `docs/` now?
2. What are the official task IDs for the UI, and which of U0 to U14 already exist there?
3. Tailwind v3 or v4? (Recommended: v4, matching current shadcn.)
4. Who owns the `check:design` script and the commit hooks? (Presumably G1.)
5. Does the backend expose a "control" (non-graph) NPC answer for U12?
6. What are the exact player actions in the demo (the behaviour spec), and what are the Hollowbrook NPC names, roles and factions?
7. Is the demo deployed (Vercel + FalkorDB Cloud) or local-only for the video? That affects the env setup and fallback work.
8. Do we have real checkpoint times for C1 to C4?

---

## 8. Immediate next steps

1. You: message Goodness with questions 1, 2 and 4 above.
2. Me, as soon as you say go: `corepack`/pnpm setup (U0) and check the repo again.
3. Then U1 → U2 → U3 → U4 in order, committing every 15 to 30 minutes.
