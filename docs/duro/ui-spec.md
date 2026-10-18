# UI-SPEC — Hearsay demo UI (single source of truth)

Audience: DuroT and DuroT's coding agent. **This file wins over any other UI description in the docs.** If something here conflicts with `docs/duro/README.md`, this file is right. If something here conflicts with the contract (`docs/shared/04-tool-contract.md`), the contract is right and you file a request.

The UI is what judges see in the video in the first 10 seconds and what they click if there is a live link. It must look like a finished product, and every pixel must serve one goal: **make the graph's work visible.**

---

## 0. Golden rules (read twice)

1. **One design system, no exceptions.** `DESIGN.md` (root) + shadcn/ui components + Tailwind. No other UI library. No hand-picked colours, sizes or fonts anywhere in the app code.
2. **Tokens only.** Colours, radii, shadows, fonts and spacing come from `DESIGN.md`, generated into `app/globals.css` and `lib/tokens.ts`. Components use semantic Tailwind classes (`bg-card`, `text-muted-foreground`, `border-border`, `text-attitude-hostile`...).
3. **Build the `/styleguide` page first** (task U1). Every token and every component state is rendered there. You compare against it every time you touch UI.
4. **Run `pnpm check:design` before every commit.** It fails on hard-coded colours, arbitrary colour/size classes and inline colour styles (section 14).
5. **The UI only talks to a `HearsayClient`** (contract). Never import from `packages/hearsay` in client components.
6. **Every panel implements all four states**: loading, error, empty, populated (and "not in graph" where it applies).
7. **Screenshots as evidence.** After each UI task, save a 1440x900 screenshot to `docs/duro/screens/<task>.png` and commit it. Compare against previous screenshots to catch drift.
8. **Do not add features that are not in this file.** Ask first.

---

## 1. Design intent

**Name and feel:** "Obsidian and Signal" (see `DESIGN.md` section 1): deep blue-black surfaces, one electric signal blue that means *information moving through the graph*, and gold that means *provenance*. Serious enough for a developer tool, with just enough game character (serif wordmark, NPC portraits as initials, attitude icons) that nobody mistakes it for a generic dashboard.

**The three-second test (what a judge must grasp without reading):**
1. There is a town of characters (left).
2. Something happened and some characters know about it, others do not (badges, "knows" chips).
3. A glowing path in the graph shows how the knowledge travelled (right).

**Hero moment:** clicking **Why?** on Garrick. The signal-blue rumor path lights Brom -> Mira -> Garrick with moving particles, the chain and confidences appear beside it, and the contributing event is listed. Design everything so this moment is the most beautiful thing on screen.

**Secondary moments:** the **Control vs Hearsay** split chat (section 8.9), the **timeline replay** (8.10), "not in the graph" abstentions (8.6), the trace panel (8.7).

---

## 2. Design system: DESIGN.md + shadcn/ui

**`DESIGN.md` (repo root) is the design system.** It uses Google's DESIGN.md format: machine-readable tokens in YAML front matter plus the rationale, components, craft rules and Do's and Don'ts in prose. It is authoritative for **colour, typography, shape, depth, motion and craft rules.** This file (`ui-spec.md`) is authoritative for **layout, components' anatomy and behaviour, copy, states and the graph canvas.** If they conflict on a visual value, `DESIGN.md` wins.

Identity: **"Obsidian and Signal"** (near-black canvas, signal blue = information moving through the graph, gold = provenance, Instrument Serif headlines with an italic word, Geist UI text). Read `DESIGN.md` section 1 for the moodboard (OpenCircle, ClassFundz, UI Skills, TypeUI) and the signature moments.

**How the pieces fit**
1. `DESIGN.md` holds the tokens. Run `npx @google/design.md spec` once to see the current format rules, then `npx @google/design.md lint DESIGN.md` (checks references and WCAG contrast). Fix what it reports.
2. Tokens become code: use `npx @google/design.md export --help` to see the available formats (Tailwind theme, CSS variables, W3C DTCG). Generate the Tailwind theme / CSS variables from `DESIGN.md` into `apps/web/app/globals.css` (and `lib/tokens.ts` for the few places that need raw values). **Do not hand-type token values; regenerate when `DESIGN.md` changes.** If an export format does not fit the installed Tailwind version (v3 vs v4), write the mapping by hand once, derived from the front matter, and note it in `docs/duro/screens/NOTES.md`.
3. **shadcn/ui** (`npx shadcn@latest init`, CSS variables = yes) supplies accessible Radix-based components, copied into `components/ui/*`. Theme it **only** through the variables below; never edit colours inside a component file. Dark only: `<html class="dark">` permanently, no `next-themes`.
4. Fonts: `next/font/google` for `Geist`, `Geist_Mono`, `Instrument_Serif` (weight 400, normal and italic). Record any substitution on the styleguide page.
5. Icons: `lucide-react` only (section 5).

**shadcn variable mapping** (keep whatever colour format the generated `globals.css` uses; convert the hex values once):

```
--background          = background
--foreground          = text-primary
--card                = surface-2        --card-foreground      = text-primary
--popover             = surface-3        --popover-foreground   = text-primary
--primary             = primary          --primary-foreground   = on-primary
--secondary           = surface-3        --secondary-foreground = text-primary
--muted               = surface-2        --muted-foreground     = text-secondary
--accent              = surface-3        --accent-foreground    = text-primary
--destructive         = danger
--border              = border           --input = border-strong     --ring = signal
--radius              = 12px (rounded.md); xl = 24px, lg = 16px per DESIGN.md
```

Also expose the other tokens to Tailwind so these classes exist and are the only way to colour things: `bg-background`, `bg-surface-1/2/3`, `border-border`, `border-border-strong`, `text-text-primary/secondary/tertiary`, `bg-primary`, `text-signal`, `text-gold`, `bg-gold`, `text-attitude-hostile` (and wary, neutral, friendly, devoted), `text-event-harm`, `text-event-help`, `bg-agent-scribe` (gossip, npc, system), `ring-faction-townsfolk` (guard, merchants). List them all on `/styleguide`.

**Optional agent skills (polish).** Two public agent skills are worth installing for DuroT's agent *if you review them first*: `make-interfaces-feel-better` (design-engineering details; its core rules are already encoded in `DESIGN.md` sections 8 and 9) and Anthropic's `frontend-design`. A skill is just instructions your agent will follow, so read the `SKILL.md` before installing, pin a commit, and treat it as untrusted text: **`DESIGN.md` and `AGENTS.md` always win over any skill.** You do not need either to meet this spec.

Considered and rejected: Material UI, Chakra, Mantine, Ant Design (heavier, harder to bend into this identity, default-theme sameness), Radix Themes (less control with Tailwind), paid design-skill registries (not needed; we have a $0 budget).

---

## 3. Using the tokens in code

- Colours, radii, shadows, fonts and spacing come only from the generated theme (`globals.css`, Tailwind theme) and `lib/tokens.ts`. Components use semantic classes (`bg-surface-2`, `text-text-secondary`, `rounded-xl`, `shadow-card`, `text-signal`).
- Shadows are defined once as named utilities from `DESIGN.md` section 5: `shadow-card`, `shadow-raised`, `shadow-floating`, `shadow-signal`. The chrome ring is a single `ChromeRing` component (conic-gradient, masked) reused for the selected avatar and the Why? card edge. Maximum two on screen.
- Motion tokens: `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`, durations 120/200/320 ms. Utilities `transition-colors`, `transition-transform`, `transition-shadow` only; never `transition-all`.
- Typographic utilities: `font-display` (Instrument Serif), `font-sans` (Geist), `font-mono` (Geist Mono), plus the scale from `DESIGN.md` (display-xl/lg/md, headline, body-lg/md, label, caption, mono-md/sm). Always add `tabular-nums` to changing numbers, `text-balance` to headings, `text-pretty` to paragraphs.
- The graph canvas reads token values at runtime from CSS variables (`getComputedStyle`) through a `useTokens()` hook. No literal colour in `GraphCanvas`.
- Raw hex or `rgb()` is allowed only in `globals.css`, `lib/tokens.ts` and `DESIGN.md`.

---

## 4. Layout

Target: **1920x1080 (video) and 1440x900 (laptops)**. Minimum supported: 1180 px wide. Below that, stack panels in one column and show a banner "Best viewed on a larger screen" (do not spend time polishing mobile).

```
+----------------------------------------------------------------------------------------------+
| HEADER (56px)  Hearsay · Hollowbrook | Player [A][B] | Tick 2 | [Advance Time] [Reset] [Present]|
+---------------------+-------------------------------------------+----------------------------+
| TOWN (320px)        | CENTER (flex)                              | INSPECTOR (flex, 560px+)   |
| NPC cards x6        |  Chat header: NPC, attitude, "knows N"     | Tabs: Graph | Why? | Trace |
| Places chips        |  Message list (scroll)                     |       Memory               |
| Tilda panel         |  Input + Send                              |                            |
|                     |  -----------------------------------      |  (active tab fills height)  |
|                     |  Actions card (record event)               |  Timeline scrubber at the   |
|                     |                                            |  bottom of Graph tab        |
+---------------------+-------------------------------------------+----------------------------+
| DEMO SCRIPT drawer (collapsible, 48px collapsed)                                               |
+----------------------------------------------------------------------------------------------+
```

- Grid: `grid-cols-[320px_minmax(420px,1fr)_minmax(520px,1.2fr)]` is allowed (layout, not colour). Panels are `bg-card` on `bg-background`, 12px gap, 16px inner padding.
- **Presentation mode** (`?present=1` or the header toggle): root font scale 1.15, hides the Reset button and dev toggles, enlarges graph labels, and collapses the demo drawer. This is the mode used for recording.
- The Inspector (right) is the largest area. The graph is the star.

---

## 5. Iconography

`lucide-react` only. Stroke width 1.75, size 16 (inline) or 20 (buttons) or 24 (empty states). Icon map:

| Concept | Icon |
| --- | --- |
| Advance Time | `Hourglass` |
| Reset | `RotateCcw` |
| Player | `User` |
| NPC | initials avatar (no icon) |
| Place | `MapPin` |
| Event harm / help | `Flame` / `Sparkles` |
| Heard from (gossip) | `Ear` |
| Witnessed | `Eye` |
| Rumor path / Why? | `Route` |
| Not in graph | `Unlink` |
| Trace | `ListTree` |
| Memory | `Brain` |
| Graph | `Network` |
| LLM source | `Bot` |
| Template fallback | `FileText` |
| Firewall passed / blocked | `ShieldCheck` / `ShieldAlert` |
| Present mode | `Presentation` |
| Demo script | `Clapperboard` |
| Compare | `Columns2` |
| Replay | `Play` / `Pause` |

If an icon name does not exist in the installed lucide version, pick the nearest and record it on the styleguide page. Do not mix icon libraries.

---

## 6. Component inventory

### 6.1 shadcn components to add (via CLI)

`button card badge tabs input textarea select checkbox scroll-area tooltip skeleton separator switch slider collapsible sonner toggle-group dialog`. (If a name is not available in the installed shadcn version the CLI will say so; adapt.)

Customise shadcn components **only through tokens and variants**, not by editing colours inside component files.

### 6.2 Custom components (`components/hearsay/*`)

Each has a section on the styleguide page showing every state.

| Component | Purpose | Key props | States |
| --- | --- | --- | --- |
| `Wordmark` | "Hearsay" in Instrument Serif + a small gold dot | size | default |
| `NpcAvatar` | Circle with initials, ring colour = faction | npcId, size | default, selected, speaking |
| `AttitudeBadge` | Pill with icon + label + score | label, score? | five labels, loading, unknown |
| `KnowsChip` | "Knows 1" / "Knows nothing" with Eye/Ear/Unlink | status, count, via? | witnessed (gold), heard (signal), nothing |
| `NpcCard` | Avatar, name, role, AttitudeBadge, KnowsChip | npc, attitude, knows, selected | default, hover, selected, loading |
| `PlaceChip` | MapPin + name | place, selected | default, selected |
| `ChatBubble` | Message with speaker, text, meta row | speaker, text, source, firewall | player, npc-llm, npc-template, blocked-by-firewall |
| `ReplyMeta` | Small row: `Bot`/`FileText` + "LLM"/"Template", `ShieldCheck`/`ShieldAlert` | source, firewall | four combos; violations in tooltip |
| `EventForm` | Type select, place select, witnesses checkboxes, subject input, Do it | world, onSubmit | idle, submitting, error |
| `ChainView` | `Brom -> Mira -> Garrick` as avatars with arrow edges and confidence labels | chain, hopConfidences | known, single (witness), not-in-graph |
| `NotInGraphBanner` | Dashed border grey card with Unlink icon | npcName | default |
| `ContributionList` | Event rows with effect bars (diverging) | contributions | empty, populated |
| `TraceRow` | Agent chip, tool, query id (mono), rows, ms, expandable args | step | collapsed, expanded |
| `AgentChip` | Coloured pill for scribe/gossip/npc/system | agent | four |
| `GraphCanvas` | The force graph (section 9) | snapshot, highlight, filters | loading, empty, populated, highlighted |
| `TimelineScrubber` | Slider 0..tick + Play + step labels | tick, value, onChange | idle, playing |
| `ComparePanel` | Two chat columns (Control vs Hearsay) | npcId | idle, loading, divergence |
| `TildaPanel` | Haggle UI with markup gauge | policy | idle, changed |
| `DemoScriptDrawer` | Numbered steps with run buttons | steps | collapsed, expanded, step running, step done |
| `ErrorBanner` | Shows `error.code`, message, hint, retry | error | default |
| `EmptyState` | Icon, Instrument Serif title (one italic word), one-line help | icon, title, body | default |

---

## 7. Data to UI mapping and refresh strategy

| UI element | Tool | When it refreshes |
| --- | --- | --- |
| World (NPCs, places, event types) | `getWorld` | once on load |
| NPC card attitude | `attitude` (x6) | after `recordEvent`, `advanceTime`, `spread`, `say`, `resetPlayer`, player switch |
| NPC card "knows" | `recall` (x6, `limit` 50) | same triggers |
| Graph | `snapshot` | same triggers (debounced 150 ms) |
| Chat | `say` response | per message |
| Why? | `explain` (+ `attitude` contributions) | on click |
| Trace | `trace` arrays of every envelope | appended per call |
| Tick | `snapshot.tick` / `advanceTime.tick` | with graph refresh |
| Tilda markup | `adaptPolicy` response; initial from a `snapshot` Policy node | on call |

Run the six attitude and six recall calls in parallel (`Promise.all`) and show skeletons only on first load; afterwards update in place without flicker. Keep a small client store (Zustand or React context; pick one and use it everywhere) holding: current player, selected NPC, last snapshot, last explain, trace list, chat per (player, npc).

The first-time flow: on load, `newPlayer('a')` (idempotent) and `newPlayer('b')` lazily when B is selected. If any call returns `UNKNOWN_PLAYER`, auto-create and retry once.

---

## 8. Panel specs

### 8.1 Header

Wordmark left; centre: segmented control for Player A / B (`toggle-group`) with a `User` icon; right: `Tick N` (mono, with a small pulse when it changes), **Advance Time** (primary primary button, Hourglass), Reset (ghost, RotateCcw, confirm via small dialog), Present toggle. Keyboard: `Space` does not trigger Advance (risk of accidental use while typing). Advance Time button disabled while a call is running.

### 8.2 Town column

Six `NpcCard`s in a vertical stack (name, role, avatar, AttitudeBadge, KnowsChip). Selected card has the chrome ring on its avatar and a `surface-3` background. Under them: Places as `PlaceChip`s (decorative + they populate the Actions form on click). At the bottom: `TildaPanel` (section 8.8).

KnowsChip logic from `recall`:
- `not_in_graph` -> "Knows nothing" (grey, `Unlink`).
- Has a witnessed event -> "Saw it" (`Eye`, gold provenance chip).
- Has only heard events -> "Heard it via Mira" (`Ear`, signal chip) with the teller's name.
- Several -> "Knows 2".

### 8.3 Chat (centre)

Header: avatar, name, role, AttitudeBadge, KnowsChip. Messages: player right-aligned `bg-secondary`, NPC left-aligned `bg-card` with a 2px left border in the NPC's faction colour. Each NPC message has `ReplyMeta` (source + firewall). If `firewall.passed` is false, show the template reply with a `ShieldAlert` tooltip listing violations ("Reply blocked: mentioned an event this NPC never learned"). That is a feature, not an error; style it calmly.

Input: `textarea` (Enter sends, Shift+Enter newline), Send button, character counter at 350+. Typing indicator ("Garrick is thinking...") while `say` runs, with the rest of the UI still usable. Suggested prompts as small chips above the input (click to fill): "Do you know me?", "Have you heard anything about me?", "Who told you that?", "What do you think of me?". These make the demo reliable.

Per-session cap on `say` calls (40) with a friendly message.

### 8.4 Actions card (record an event)

Collapsible card under the chat. Fields: **What did you do?** (toggle-group of event types with icons: Steal, Attack, Lie, Help, Donate, Save, Trade), **Where?** (select of places), **Who saw it?** (checkbox pills of NPCs, at least one), **Item or detail** (input, optional, placeholder "iron sword"), weight shown read-only ("-0.8 harm") with a tiny override slider hidden under "Advanced". Primary button **Do it**. On success: toast "Event recorded: Brom saw you steal the iron sword" and refresh. Presets row: "Steal the sword at the forge (Brom)" runs the whole thing in one click for the demo.

### 8.5 Inspector tabs

`Tabs` with: **Graph**, **Why?**, **Trace**, **Memory**. Active tab: `primary` underline that slides between tabs. The tab content fills the remaining height with its own scroll.

### 8.6 Why? tab

Top: segmented NPC selector + event selector (events the player performed). Default: selected NPC and the most recent event.

Two outcomes, visually distinct:
- **Known:** a `card-hero` with `shadow-signal` and a chrome top edge, with the Instrument Serif headline "How Garrick *learned* about it" (one italic word). `ChainView` below (avatars connected by signal-blue arrows, the root witness marked with a gold ring; confidence on each arrow, e.g. 0.90, 0.63). Line: "Heard from Mira, who heard from Brom, who saw it." Then `ContributionList`: each known event with an effect bar (negative left in danger, positive right in success) and "believed at 63%". Finally the attitude result: AttitudeBadge with score.
- **Not in the graph:** `NotInGraphBanner`: "No path exists. Garrick has heard nothing about this." A secondary note: "Nothing is invented. The graph is the memory." Dashed grey border, no glow.

Clicking **Show in graph** switches to the Graph tab with the path highlighted (using `explain.edgeIds`).

### 8.7 Trace tab

Newest first, grouped per user action ("Advance Time", "Say to Garrick"). Each group header shows total queries and total ms. Rows: `AgentChip`, tool name, query id (mono, `text-text-2`), rows (tabular), ms (tabular), expand for args JSON (mono, scroll). Handoffs between agents are shown with a thin signal connector ("Scribe -> Gossip") to make "shared state and handoffs" visible. Filter chips by agent. A `Clear` ghost button.

### 8.8 Tilda panel (procedural memory)

Small card: Tilda's avatar, "Opening price: 110 coins" (100 x (1 + markup)), a horizontal gauge from 5% to 30% showing markup, two buttons **Lowball her** and **Offer a fair price**. After each click, the gauge animates (200 ms), a before/after label appears ("10% -> 15%"), and a tiny caption "Policy updated in the graph". Reset restores 10%.

### 8.9 Compare (Control vs Hearsay) — SHOULD

A header toggle "Compare" turns the centre chat into two columns for the selected NPC. Same input sends the player text to both: left `sayNaive` ("Plain LLM NPC: told everything, no graph"), right `say` ("Hearsay NPC"). Colour: left column header in neutral grey with `Bot`, right header in primary. Under each reply, an annotation row: left shows "No provenance. Cannot explain." (and, when it leaks, a red tag "Knows something it never witnessed or heard"); right shows `ReplyMeta` and a "Why?" link. Show the diverging moment prominently: ask Garrick before gossip reaches him: left leaks, right says he knows nothing.

### 8.10 Graph tab extras: timeline scrubber — SHOULD

At the bottom of the Graph tab: slider from 0 to current tick, with step labels (0, 1, 2...). Dragging filters the graph to edges whose `props.tick <= value` (KNOWS/TOLD) and hides Event nodes with `tick > value`. **Play** animates from 0 to the current tick at 900 ms per step, with the signal particles on newly appearing TOLD edges. A caption under the slider narrates: "Tick 2: Garrick heard it from Mira (0.63)". This is UI-only (uses the `tick` property already in the snapshot).

### 8.11 Memory tab

For the selected NPC: list `recall` items as cards: event type icon, text ("Stole an iron sword at Brom's Forge"), badge `Saw it` or `Heard from Mira`, confidence (percent), tick. Empty state: "Garrick has no memories of you yet."

### 8.12 Demo script drawer

Collapsed bar "Demo script (12 steps)". Expanded: a numbered list from `docs/shared/09-demo-and-submission.md`; each step has a button that runs the action (sets player, calls tools, selects NPC, switches tab). The current step is highlighted in primary; completed steps show a check. Hidden in Present mode but available through `?script=1`.

### 8.13 Toasts

`sonner`, bottom right. Max 3 visible. Success toasts name the effect in plain language. Errors show code + message + "Retry".

---

## 9. Graph canvas spec (`react-force-graph-2d`)

(Verify prop names in the library's README before using; the intent matters more than the names.)

- **Layout:** NPC nodes are pinned to a fixed "town map" so the graph never jiggles. Event and Fact nodes float near their related NPC using a weak force. Store positions in `lib/town-layout.ts` as normalised coordinates (-1..1) and scale to the canvas:

| NPC | x | y |
| --- | --: | --: |
| brom | -0.85 | 0.15 |
| ayla | -0.50 | -0.70 |
| mira | -0.25 | -0.10 |
| garrick | 0.45 | -0.45 |
| fenn | 0.10 | 0.55 |
| tilda | 0.80 | 0.35 |

  Chain Brom -> Mira -> Garrick reads left to right. Player node sits bottom-left, small.
- **Colours come from CSS variables at runtime** (`getComputedStyle(document.documentElement)`), wrapped in a `useTokens()` hook that also returns the same values as `lib/tokens.ts`. No literal hex in `GraphCanvas`.
- **Nodes:** NPC = circle r=14 with faction-coloured ring (2px), initials inside, name label below (12px). Event = diamond r=7, red or green by weight, type label on hover. Player = small primary dot. Place nodes hidden by default (toggle).
- **Edges:** `TRUSTS` hairline grey at 25% opacity (toggle, default off); `KNOWS` dashed, signal colour with opacity = confidence (0.3 to 1.0); `TOLD` solid signal, width 2, arrowhead; `PERFORMED`/`HAPPENED_AT` 1px grey.
- **Highlight (hero):** edges in `explain.edgeIds` become width 4, full-opacity signal with a signal-glow stroke (draw a wider translucent stroke behind) and directional particles moving teller -> listener. All other edges dim to 15%. Nodes on the path scale to 1.25x with a signal ring, and the **root witness** (where the chain starts) gets a **gold** ring to show provenance; others dim to 40%. A floating pill "Showing: how Garrick learned about it  x" clears the highlight.
- **Hover:** tooltip with name, role, attitude; for edges the confidence and tick. **Click NPC:** select in chat. **Click empty space:** clear selection.
- **Legend** bottom-left (collapsible): node types, edge types, colour meanings. Toggles top-right (TRUSTS, KNOWS, TOLD, Places).
- **Performance:** <= 200 nodes. Memoise graph data by snapshot hash; only re-heat the simulation when nodes are added; cooldown after 100 ticks. Canvas pixel ratio capped at 2.
- **Empty state** (new player with no events): town map with only NPCs and a hint "Do something in town and watch it spread."

---

## 10. Copy deck (use these strings; keep a `lib/copy.ts`)

| Key | Text |
| --- | --- |
| tagline | Memory that spreads like gossip. |
| advance | Advance Time |
| advanceHint | Spreads every rumor one hop. |
| reset | Reset player |
| resetConfirm | This erases everything this player did. |
| doIt | Do it |
| whyTitle | How {name} learned about it |
| notInGraph | No path exists. {name} has heard nothing about this. |
| notInGraphNote | Nothing is invented. The graph is the memory. |
| knowsNothing | Knows nothing |
| sawIt | Saw it |
| heardVia | Heard it via {name} |
| noMemories | {name} has no memories of you yet. |
| thinking | {name} is thinking... |
| fwBlocked | Reply blocked: it mentioned something this NPC never learned. A safe reply was used instead. |
| llmDown | The language model is unavailable. Showing a prepared reply. |
| liveBanner | Free demo instance. Data may reset. |
| controlLeft | Plain LLM NPC (told everything, no graph) |
| controlRight | Hearsay NPC |
| leakTag | Knows something it never witnessed or heard |
| noProvenance | No provenance. Cannot explain. |
| traceEmpty | Nothing has run yet. Do something in town. |
| errorGeneric | Something went wrong. Retry? |

Voice: plain, calm, a little wry. No exclamation marks. No emojis in the UI.

---

## 11. State matrix (every panel)

| Panel | Loading | Error | Empty | Special |
| --- | --- | --- | --- | --- |
| Town | 6 skeleton cards | ErrorBanner + retry | n/a | per-card loading while refreshing |
| Chat | typing indicator | inline ErrorBanner under input | "Say something to {name}." | template reply; firewall blocked |
| Actions | button spinner | inline error + keep form values | n/a | witnesses empty -> disabled with hint |
| Graph | skeleton canvas | ErrorBanner | NPC-only map + hint | highlighted; scrubbed |
| Why? | skeleton card | ErrorBanner | "Choose an NPC and an event." | **Not in graph** |
| Trace | n/a | n/a | traceEmpty | grouped |
| Memory | skeleton list | ErrorBanner | noMemories | n/a |
| Tilda | skeleton | inline error | n/a | changed (animates) |

---

## 12. Accessibility

- Text contrast >= 4.5:1 (the tokens above satisfy this on `bg-0`/`bg-1`/`bg-2`; `text-3` is for non-essential hints only).
- Colour is never the only signal: attitudes have icon + label; events have icon + label; edges differ by dash/weight as well as colour.
- Visible focus ring (signal, 2px, offset 2px) on all interactive elements; logical tab order; the graph canvas is not a tab trap and has a text alternative: the Memory and Why? tabs carry the same information.
- `aria-live="polite"` on the chat list and on the toast region; `aria-busy` while loading.
- All icon-only buttons have `aria-label` and a tooltip.
- `prefers-reduced-motion` honoured (`DESIGN.md` section 8).
- Minimum click target 36x36.

---

## 13. Performance and robustness

- First load under 2.5 s on a laptop; no layout shift (reserve space for skeletons).
- Never block the UI on `say`. Cancel in-flight requests when the player or NPC changes.
- Handle 429/LLM failure gracefully (template reply, calm notice).
- No console errors in the demo path. Zero hydration warnings.
- Keep bundle small: dynamic-import the graph library; no unused icon sets.

---

## 14. Enforcement: how the design system stays intact

### 14.1 `/styleguide` route (task U1)

Dev-only page (hidden unless `NODE_ENV !== 'production'` or `?styleguide=1`) rendering: every colour token as a swatch with its name and hex; the type scale; spacing/radius samples; every shadcn component and every custom component in every state from section 6; the icon map. If something is on screen in the app that is not on the styleguide, it is a bug.

### 14.2 `scripts/check-design.mjs` (task U1)

Add it to the repo and wire `"check:design": "node scripts/check-design.mjs"` in the root `package.json`. It scans `apps/web` and fails on drift.

```js
// scripts/check-design.mjs
// Fails the commit if UI code bypasses the design system.
// A line can opt out with a trailing comment:  // design-ok: <reason>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'apps/web';
const SKIP_DIRS = new Set(['node_modules', '.next', 'public', 'screens']);
const ALLOWED_FILES = new Set([
  join(ROOT, 'app', 'globals.css'),
  join(ROOT, 'lib', 'tokens.ts'),
]);
const EXT = /\.(tsx?|css|mdx?)$/;

const RULES = [
  { name: 'hard-coded hex colour', re: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/ },
  { name: 'colour function literal', re: /\b(?:rgba?|hsla?|oklch|oklab)\(/ },
  { name: 'arbitrary Tailwind colour', re: /\b(?:bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration)-\[[^\]]+\]/ },
  { name: 'arbitrary font size', re: /\btext-\[\d+(?:\.\d+)?(?:px|rem|em)\]/ },
  { name: 'inline colour style', re: /style=\{\{[^}]*\b(?:color|background|backgroundColor|borderColor|fill|stroke)\b/ },
  { name: 'forbidden UI library import', re: /from ['"](?:@mui\/|@chakra-ui\/|antd|@mantine\/|react-bootstrap|@headlessui\/)/ },
  { name: 'raw <button> (use Button)', re: /<button[\s>]/ },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

let failures = 0;
for (const file of walk(ROOT)) {
  if (ALLOWED_FILES.has(file)) continue;
  // shadcn-generated primitives may contain raw <button>; skip that rule inside components/ui
  const inUi = file.includes(join('components', 'ui'));
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('design-ok:')) return;
    for (const r of RULES) {
      if (inUi && r.name.startsWith('raw <button>')) continue;
      if (r.re.test(line)) {
        failures++;
        console.error(`${file}:${i + 1}  ${r.name}\n    ${line.trim()}`);
      }
    }
  });
}
if (failures) {
  console.error(`\n${failures} design-system violation(s). Use tokens/components, or add "// design-ok: reason".`);
  process.exit(1);
}
console.log('design check passed');
```

Known false positives (URL fragments like `#section`) can be exempted with `// design-ok:`. Do not weaken the rules without asking.

### 14.3 Component gate

- Use only `components/ui/*` (shadcn) and `components/hearsay/*`. A new custom component needs a styleguide entry in the same commit.
- New shadcn components are added with the CLI, not copied from the web.
- Do not install another UI, animation or icon library. (`react-force-graph-2d`, `lucide-react`, `sonner`, `zustand` are the only additions allowed beyond shadcn's own dependencies.)

### 14.4 Per-task design review (agent self-check, paste into the commit body or notes)

- [ ] Only tokens and semantic classes used (`pnpm check:design` passes; `design.md lint` passes if `DESIGN.md` changed)
- [ ] Craft checklist in `DESIGN.md` section 9 satisfied (concentric radii, tabular numbers, press scale, no `transition-all`, 44px hit areas)
- [ ] All four states handled
- [ ] Appears on `/styleguide`
- [ ] 1440x900 screenshot saved and compared to the previous one
- [ ] Keyboard path works; focus ring visible
- [ ] Copy comes from `lib/copy.ts`

---

## 15. Build order (UI tasks; maps onto D-tasks in `docs/duro/README.md`)

| Id | Task | Time | Acceptance |
| --- | --- | --: | --- |
| U0 | `create-next-app`, Tailwind, `shadcn init`, fonts (Geist, Geist Mono, Instrument Serif), dark only; run `npx @google/design.md spec` and `lint DESIGN.md`, fix findings; generate tokens from `DESIGN.md` into `globals.css` + `lib/tokens.ts`; `scripts/check-design.mjs`; git hook | 2 h | `design.md lint` clean, `pnpm check:design` and typecheck pass; fonts load |
| U1 | `/styleguide` with all tokens, type scale, icons, all shadcn components added | 1 h | every swatch/component visible; screenshot saved |
| U2 | Custom atoms: Wordmark, NpcAvatar, AttitudeBadge, KnowsChip, AgentChip, PlaceChip, ReplyMeta, EmptyState, ErrorBanner | 2 h | each in all states on styleguide |
| U3 | App shell + header + 3-column layout + Present mode + client store + `useHearsay()` (mock) | 2 h | layout matches section 4 at 1440x900 and 1920x1080 |
| U4 | Town column: NpcCards, Places, loading/error | 1.5 h | six cards with badges from mock data |
| U5 | Chat: bubbles, input, typing, suggested prompts, ReplyMeta | 2 h | mock `say` round-trip; blocked-by-firewall variant renders |
| U6 | Actions card + presets + toasts | 1.5 h | "Steal the sword" preset works in mock |
| U7 | Why? tab: ChainView, ContributionList, NotInGraphBanner | 2 h | both outcomes render from fixtures |
| U8 | Graph canvas: layout, nodes, edges, legend, toggles, highlight with particles | 4 h | hero moment works from fixtures; 60 fps with 100 nodes |
| U9 | Trace tab with grouping and handoff connectors | 1.5 h | grouped rows for Advance and Say |
| U10 | Memory tab, Tilda panel | 1.5 h | gauge animates |
| U11 | Demo script drawer | 1.5 h | steps 2-6 run end to end |
| U12 | **Compare** (needs G13) and **Timeline scrubber** (UI-only) — SHOULD | 3 h | divergence demo; replay |
| U13 | Live-mode integration, polish pass, empty/error states, a11y pass, screenshots | 3 h | manual checklist in `duro/README.md` passes |
| U14 | Demo-day readiness (section 16) | 1 h | recording rehearsal done |
| L1 | **Landing page at `/` (app moves to `/play`)** — SHOULD, only after U8 and U11 are done. Hero (serif headline "Memory that *spreads* like gossip."), CTA, framed screenshot with the chrome ring, numbered 01/02/03 explainer (gossip, explain, firewall), the ten-line integration code card, footer with the repo link and "Built on FalkorDB" | 3 h | looks like a product page; follows `DESIGN.md` section 4 landing rhythm; Lighthouse accessibility >= 90 |

Do U0 to U3 on Day 1. U8 is the single most valuable task; protect its time.

---

## 16. Demo-day readiness checklist

- [ ] Record at 1920x1080 in Present mode; browser zoom 100%; bookmarks bar hidden; notifications off; dark OS theme; cursor highlight on.
- [ ] Fonts load offline (self-hosted by `next/font`); no flash of unstyled text.
- [ ] Seed state script: `pnpm demo:reset` resets players A and B to a known state; run before every take.
- [ ] Trace panel and Graph tab visible in the first shot; Why? tab used for the hero moment.
- [ ] LLM key valid (or templates enabled); one dry run of the whole path within the last hour.
- [ ] No console errors, no dev overlays (`next build && next start` for the recording, not `next dev`).
- [ ] Screenshots for README: hero (Why? highlighted), compare, trace, styleguide.
- [ ] A 15-second GIF of the rumor path lighting up (README top).

---

## 17. Do not

- Do not add a light theme, a settings page, auth, routing beyond `/` and `/styleguide`.
- Do not use gradients, emojis, stock illustrations or any imagery that is not an initials avatar or an icon.
- Do not animate for decoration.
- Do not invent colours "just this once". Add a token, add it to the styleguide, then use it.
- Do not put business logic in components. Components render; the store and the client call tools.
- Do not hide errors. Show the code and a retry.
