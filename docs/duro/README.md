# DuroT — scope: world content, demo UI, deployment, demo assets

You own everything a judge **sees**: the Hollowbrook town content, the web app, the deployment, the README polish, the demo video and the blog post. Goodness owns the engine. You do not need the engine to start: you build against a **mock** that follows the contract, then switch to live as Goodness's tools land.

## Living Town — user-requested redesign

Three location-based scenarios now offer paid, charity, theft and social routes.
Choices spend turns, prerequisites and NPC decisions use graph memories, and
Garrick’s trust at 20/100 or below ends the game. See scenarios.md.

Autonomous play: walking determines witnesses; deeds use your current location.
Gossip advances automatically during visible exploration, with Pause/Resume town
and pauses during reading and reaction playback. See autonomous-town.md.

Cinematic refinement: a closer panorama, confirmed whisper handoffs, listener
focus and replay of the last round without advancing time. See cinematic-flow.md.

Expanded edition: thirteen villagers across Old Town, Vale Lane and Riverside.
Use the district picker or Menu → Meet the villagers. The Vale family has four
members; nearby villagers automatically witness actions. Forty-one
directional trust edges produce competing routes, weak-link cutoffs and five-hop
evidence. Earlier saves remain separate. See `expanded-town.md`.

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
## You own

`seed/hollowbrook.json` (content) · `apps/web/**` · `packages/contract/src/fixtures.ts` and `mock.ts` · repo `README.md` · blog post · demo video · deployment (`docs/shared/08-deployment.md`).

You do not edit `packages/contract/src/schemas.ts`, `packages/hearsay/**`, `packages/mcp/**`, `loadtest/**`. If you need a change there, add an entry to `docs/requests.md` and tell Goodness.

## The UI spec is authoritative

**`DESIGN.md` (repo root) is the design system** (tokens, typography, shape, depth, motion, craft rules, do's and don'ts), and **`docs/duro/ui-spec.md` is the spec for layout, components, copy, states, the graph canvas and enforcement.** Together they are the single source of truth for everything visual. The "UI spec" section below is only a summary; on any conflict, `ui-spec.md` wins. Your agent must read it completely before any UI work and must run `pnpm check:design` before every commit. Commit early and often: see `AGENTS.md` section 3b (mandatory).

## Starter prompt for your coding agent

> Read AGENTS.md, then docs/shared/01 to 09 in order, then docs/duro/README.md. I am DuroT. Work only on task <ID> from docs/duro/README.md. Follow its acceptance criteria. Do not change files owned by Goodness. The UI must only talk to a `HearsayClient` (see docs/shared/04-tool-contract.md), never directly to the database. Run `pnpm typecheck` and show the result before saying you are done. Keep the code simple enough that I can explain it to a judge.

## What the demo must show (the UI exists to make these obvious)

1. A town with six NPCs; each shows its **attitude** toward the current player (badge: hostile, wary, neutral, friendly, devoted) and whether it **knows** about what you did.
2. Player actions that create events (steal, help, donate, attack, lie) at places, with chosen witnesses.
3. A chat with any NPC; replies show whether they came from the LLM or a template, and whether the firewall passed.
4. **Advance Time** button; the rumor visibly moves one hop per click.
5. A **Why?** button that highlights the rumor chain in the graph and lists contributing events.
6. A live **agent trace** (Scribe -> Gossip -> NPC, with query id, args, rows, ms).
7. Two players side by side (switcher) to prove isolation.
8. Tilda's haggling markup changing (procedural memory).

## UI spec (summary only; `docs/duro/ui-spec.md` is authoritative and wins on any conflict)

### Layout (desktop, dark theme, readable on a projector)

```
+--------------------------------------------------------------------------------+
| Hearsay · Hollowbrook     Player: [A v] [B]    Tick: 2   [Advance Time] [Reset] |
+---------------------+------------------------------+---------------------------+
| TOWN                | CHAT                          | TABS: Graph | Trace | Why? |
| NPC cards (6)       | selected NPC header           |                           |
|  name, role         | message list                  |  (active tab content)     |
|  attitude badge     | input + Send                  |                           |
|  "knows: 1 event"   |-------------------------------|                           |
| Places (chips)      | ACTIONS                       |                           |
|                     | type [stole v] place [forge v]|                           |
|                     | witnesses [x] Brom ...        |                           |
|                     | subject [iron sword] [Do it]  |                           |
+---------------------+------------------------------+---------------------------+
| DEMO SCRIPT (collapsible): numbered steps with a button each (see task D9)       |
+--------------------------------------------------------------------------------+
```

### Graph tab (`react-force-graph-2d`)

- Data from `snapshot`. Refresh after every tool call that changes state.
- NPC nodes: coloured by faction; size by `loyalty` or fixed. Label = name.
- Event nodes: small diamond; red if `weight < 0`, green if `> 0`. Label = type.
- Edges: `TRUSTS` thin grey (toggle on/off, default off); `KNOWS` dashed, colour by confidence (low = dim); `TOLD` solid arrow; `PERFORMED`/`HAPPENED_AT` subtle.
- **Highlight:** edges whose id is in `explain.edgeIds` become thick and bright with a moving particle; other edges dim. A clear "Clear highlight" button.
- Click an NPC node: select that NPC in the chat and show its `recall`.
- Legend + toggles (TRUSTS, KNOWS, TOLD, Places).

### Trace tab

Newest first. Each row: agent chip (colour per agent), tool, query id, rows, ms, expandable args (JSON). A running total of queries and ms for the last action. This is the visible evidence of "shared state and handoffs".

### Why? tab

Select NPC + event (or click Why? on an NPC card). Shows: status (**Known** or **Not in the graph**), the chain as `Brom -> Mira -> Garrick` with hop confidences, `learnedFrom`, and the attitude breakdown (`contributions`) as a small list with effect values. "Not in the graph" must look clearly different from "known but neutral" (grey banner: "Garrick has heard nothing about this. No path exists in the graph.").

### States (every panel needs all four)

- **Loading:** skeleton or spinner; the UI never freezes during `say`.
- **Error:** show `error.code` and `message`; for `UNKNOWN_PLAYER` auto-call `newPlayer` once and retry; for `LLM_UNAVAILABLE` show a small notice (the reply is a template).
- **Empty:** friendly copy ("Nobody here has heard anything about you yet").
- **Not in graph** (see above).

### Look and feel

Dark, high-contrast, large type (projector/video friendly), subtle motion only where it explains something (rumor particles). Consistent colours: hostile red, wary orange, neutral grey, friendly green, devoted teal. Keep it clean; judges care that the graph is visible and that the demo flows.

## Mock and live modes

- `NEXT_PUBLIC_HEARSAY_MODE=mock|live`. A `useHearsay()` hook returns a `HearsayClient`: in mock mode it is `MockHearsay`; in live mode it POSTs to `/api/tool/{name}`.
- `MockHearsay` is scripted for the happy path only: steal at forge with Brom as witness -> `advanceTime` x4 (golden numbers from `03-graph-model.md`) -> `explain` Garrick -> `say` replies by attitude. It does not need to simulate the whole graph.
- Optional per-tool override `HEARSAY_LIVE_TOOLS=newPlayer,recordEvent,...` so you can move tools to live one by one.

## API route (`apps/web/app/api/tool/[name]/route.ts`)

Pseudocode (keep it tiny):

```ts
export async function POST(req: Request, { params }: { params: { name: string } }) {
  const name = params.name as ToolName;
  if (!(name in TOOLS)) return Response.json({ ok: false, error: { code: 'BAD_ARGS', message: 'unknown tool' }, trace: [] });
  const parsed = TOOLS[name].input.safeParse(await req.json());
  if (!parsed.success) return Response.json({ ok: false, error: { code: 'BAD_ARGS', message: parsed.error.message }, trace: [] });
  const hearsay = await getHearsay();             // singleton from packages/hearsay (Goodness)
  return Response.json(await hearsay.call(name, parsed.data));
}
```
(Check the Next.js version's route-handler signature; `params` may be a promise in recent versions.)

## Seed content guide (task D1)

Follow `docs/shared/03-graph-model.md` exactly for ids, traits, TRUSTS weights and the JSON format. Do not change numbers. You write the **words**:

- `persona` for each NPC (2 to 3 sentences of voice; avoid anything that references specific events).
- About 12 `facts` with `believes` (2 per NPC; topics: prices, guard, weather, chapel, rumor).
- `templates`: for every attitude label (`hostile, wary, neutral, friendly, devoted`) at least 3 generic greeting lines, plus `aware` lines (what an NPC says when it knows something bad/good about the player but the LLM is unavailable), plus `unknownTopic` (at least 4 lines). Add `byNpc` variants for Garrick, Tilda and Brom at minimum.
- **Templates must never name a specific event** ("you stole..."): they are the safe fallback.
- Keep every line short (under 25 words) and in character.

## Tasks (in order; each with acceptance criteria)

### D1 — Seed content (Day 1, 1.5 h; no code dependency)
- Write `seed/hollowbrook.json` per `03-graph-model.md`.
- **Accept:** valid JSON; all ids are slugs; every `trusts/believes/follows` reference exists; all five attitude labels have templates; `unknownTopic` has 4+ lines. Goodness's loader (G3) loads it without errors.

### D2 — Fixtures and MockHearsay (Day 1, 1.5 h)
- After Goodness merges G1: add `packages/contract/src/fixtures.ts` (one valid output per tool) and `mock.ts` (`MockHearsay implements HearsayClient`, scripted per above).
- **Accept:** a vitest test parses every fixture with `TOOLS[name].output`; `MockHearsay.call('advanceTime', ...)` returns the golden steps in order across four calls.

### D2b — Design system and styleguide (Day 1, 2.5 h) **before any screen work**
- Do tasks U0 to U2 from `ui-spec.md` section 15: Next.js + Tailwind + shadcn init, fonts (Geist, Geist Mono, Instrument Serif), run `npx @google/design.md spec` and `lint DESIGN.md`, generate tokens from `DESIGN.md` into `globals.css` and `lib/tokens.ts`, `scripts/check-design.mjs`, the `/styleguide` page with every token and component state, custom atoms.
- **Accept:** `pnpm check:design` and `pnpm typecheck` pass; `/styleguide` shows all tokens, the type scale, icons, shadcn components and the atoms in all states; a 1440x900 screenshot is committed in `docs/duro/screens/`.

### D3 — Web app skeleton (Day 1 evening, 1.5 h)
- On top of D2b (Next.js, Tailwind, shadcn and tokens already set up; dev port 3001 via `next dev -p 3001`), build the app shell from `ui-spec.md` section 4 (task U3): header, three-column layout, Present mode, client store, `useHearsay()` hook (mock), `/api/tool/[name]` route.
- **Accept:** `pnpm dev` shows the layout with placeholder panels in mock mode; `pnpm typecheck` passes.

### D4 — Town, chat, actions (Day 1 night / Day 2 morning, 3 h)
- NPC cards (from `getWorld`), selection, chat panel (`say`), actions form (`recordEvent`) with place and witness pickers, player switcher (A/B via `newPlayer`), tick display.
- **Accept (mock mode):** you can create player A, steal the sword with Brom as witness, chat with Brom and get a reply, switch to player B and see a clean state.

### D5 — Attitude badges, memory and Why? (Day 2, 3 h)
- Poll/refresh `attitude` for all six NPCs after each state-changing call; show badges and "knows N events" (from `recall`). Why? tab per spec with the **Not in the graph** state. Show `say` metadata: `source` and `firewall.passed` (small chip; violations visible on hover).
- **Accept:** in mock mode, Garrick shows neutral + "knows nothing" before advancing and wary + chain Brom -> Mira -> Garrick after two advances.

### D6 — Graph panel (Day 2 evening / Day 3 morning, 3 h) **the wow factor**
- Implement the Graph tab per spec, including the highlight from `explain.edgeIds`, toggles, legend, click-to-select.
- **Accept:** after the demo steps, clicking Why? on Garrick visibly lights the chain Brom -> Mira -> Garrick; clearing restores the normal view; it stays smooth with ~100 nodes.

### D7 — Trace panel (Day 3 morning, 1.5 h)
- Collect `trace` from every envelope into a store; render per spec.
- **Accept:** a single `advanceTime` click shows a Gossip row with query ids and ms; a `say` click shows NPC rows.

### D8 — Controls: Advance Time, Reset, tick, Tilda haggling UI (Day 3, 2 h)
- Buttons wired to `advanceTime`, `resetPlayer`; a small Tilda panel with "Lowball" / "Fair offer" calling `adaptPolicy`, showing markup before/after and her sample price (base price 100 coins x (1 + markup)).
- **Accept:** three lowballs show 10% -> 25%; Reset restores 10%.

### D9 — Demo script panel (Day 3, 1.5 h)
- A collapsible panel listing the 12 demo steps from `09-demo-and-submission.md`; each step has a button that performs the action (e.g. "Steal sword", "Advance", "Ask Garrick", "Why?"). It makes recording the video reliable.
- **Accept:** clicking steps 2 to 6 in order performs the demo path without typing.

### D10 — Switch to live and integrate (Day 2 night to Day 3, ongoing)
- As Goodness completes G3 to G7, switch tools from mock to live (`HEARSAY_LIVE_TOOLS` or the mode flag). Report contract mismatches in `docs/requests.md` immediately.
- **Accept:** the full demo path (steps 2 to 8) works live against local FalkorDB with `HEARSAY_LLM=live` and with `off`.

### D11a — Vercel + Cloud spike (Day 1, 30 min)
- Create a FalkorDB Cloud free instance and a Vercel project; a hello route that runs `GRAPH.LIST` against Cloud. If it works, continue; if not, record why and drop the live link.
### D11b — Deploy (Day 3 night, 1.5 h; only if the spike passed)
- Deploy app + env vars; banner about the free instance; auto `ensureWorld`.
- **Accept:** the live URL runs the demo path from a clean browser; wipe the Cloud instance and confirm the app re-seeds on the next request.

### D12 — README, video, blog (Day 3 night to Day 4, 4 h)
- README per `09-demo-and-submission.md` (Goodness fills the graph sections). Record the demo video on Day 4 morning following the script. Draft and publish the blog post.
- **Accept:** a fresh clone follows the README and reaches a working demo; video is about 3 minutes; blog linked from the README.

### D13 — Compare view and timeline replay (Day 3, 3 h) **SHOULD (UI task U12)**
- Compare: header toggle that splits the chat into Control (`sayNaive`) vs Hearsay (`say`) per `ui-spec.md` 8.9. Needs Goodness's G13; build it on mock first (add a `sayNaive` fixture whose reply leaks).
- Replay: the timeline scrubber per 8.10 (UI-only, filters edges by `props.tick`).
- **Accept:** asking Garrick before gossip shows a leaking Control reply with the red tag next to a Hearsay reply that says he knows nothing; dragging/playing the scrubber from tick 0 to 2 shows the rumor travelling.

### D14 — Landing page (Day 3 night, 3 h) **SHOULD; only after U8 (graph) and the demo script drawer are done**
- Task L1 in `ui-spec.md` section 15: a polished `/` landing (app moves to `/play`) following `DESIGN.md` section 4. It is the first thing a judge sees on a live link and in the README screenshot.
- **Accept:** hero, numbered explainer and code card render on desktop and mobile without layout shift; CTA opens `/play`; accessibility score >= 90.

### Day 4
Bugs only. Record, submit by 3 PM WAT, double-check the submission checklist.

## Manual test checklist for live mode (run before every merge to main on Days 3 and 4)

- [ ] New player A, steal sword (Brom witnesses): Brom hostile
- [ ] Garrick: "knows nothing" and reply does not mention the theft
- [ ] Advance x2: Garrick wary; Why? shows chain Brom -> Mira -> Garrick 0.90, 0.63
- [ ] Graph highlight works; Clear works
- [ ] Trace rows appear for each action
- [ ] Switch to B: clean slate; switch back to A: state intact
- [ ] Reset A: tick 0, no events
- [ ] Tilda lowballs: 10% -> 25%
- [ ] Set `HEARSAY_LLM=off`: chat still works with templates
- [ ] Restart FalkorDB container: A's state intact after reload

## Done list you maintain

Add a line per finished task: `D4 done <date/time> <commit>`.

## My "I can explain this" notes

(fill in; at least 5 items about how the UI gets graph data, what the trace shows, and how highlight works)

## Rumour puzzle update

New attempts have two AP, seven mission choices, dated source clues and private memories until the verdict. Rumour Detective grades a single reconstruction using the real graph explain path. See [puzzle rules](puzzle-pressure.md) for persistence, stakes, compatibility and limits. UI states are on /styleguide.
