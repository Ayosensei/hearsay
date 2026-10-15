---
version: alpha
name: Hearsay
description: A near-black, editorial, developer-grade interface for a graph-powered NPC memory layer. One electric-blue signal, one gold for provenance, serif italics for emphasis.
colors:
  background: "#05070B"
  surface-1: "#0A0E15"
  surface-2: "#0F141D"
  surface-3: "#151B27"
  border: "#1A2030"
  border-strong: "#262E42"
  text-primary: "#F2F4F8"
  text-secondary: "#A6AEC0"
  text-tertiary: "#7D869A"
  primary: "#3150E9"
  primary-hover: "#4562F0"
  primary-pressed: "#2A44CC"
  on-primary: "#FFFFFF"
  signal: "#8FA2FF"
  gold: "#E8C46A"
  on-gold: "#1A1405"
  danger: "#FF5C6C"
  success: "#4ADE9A"
  attitude-hostile: "#FF5C6C"
  attitude-wary: "#FFA35C"
  attitude-neutral: "#8C96A8"
  attitude-friendly: "#4ADE9A"
  attitude-devoted: "#3DD6EB"
  event-harm: "#FF5C6C"
  event-help: "#4ADE9A"
  agent-scribe: "#7DD3FC"
  agent-gossip: "#8FA2FF"
  agent-npc: "#F0ABFC"
  agent-system: "#8C96A8"
  faction-townsfolk: "#7DD3FC"
  faction-guard: "#B79CFF"
  faction-merchants: "#5EEAD4"
typography:
  display-xl:
    fontFamily: Instrument Serif
    fontSize: 56px
    fontWeight: 400
    lineHeight: 60px
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Instrument Serif
    fontSize: 40px
    fontWeight: 400
    lineHeight: 44px
    letterSpacing: -0.015em
  display-md:
    fontFamily: Instrument Serif
    fontSize: 28px
    fontWeight: 400
    lineHeight: 32px
    letterSpacing: -0.01em
  headline:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  label:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  mono-md:
    fontFamily: Geist Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
  mono-sm:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  button-ghost:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  card:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 8px
  card-inner:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 16px
  card-hero:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 24px
  panel:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 16px
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  chip:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 8px
  chip-signal:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.signal}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 8px
  chip-provenance:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.gold}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 8px
  trace-row:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.mono-sm}"
    rounded: "{rounded.md}"
    padding: 8px
  tooltip:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-primary}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: 8px
---

# Hearsay design system

This file is the single source of truth for how Hearsay looks. Coding agents must read it before touching any UI, follow it exactly, and run `npx @google/design.md lint DESIGN.md` after editing it. The layout, components and screens are specified in `docs/duro/ui-spec.md`; **this file wins on colour, type, shape, depth, motion and craft rules.**

## 1. Overview

**Identity: "Obsidian and Signal."** A near-black canvas, editorial serif headlines with italic emphasis, quiet layered surfaces, and exactly two chromatic ideas:

- **Signal blue** carries information moving through the graph: the primary action, focus, and the glowing rumor path.
- **Gold** marks **provenance**, where something came from: the witness at the start of a chain, "saw it yourself", source tags. Used sparingly so it always means something.

Everything else is neutral. Colour is meaning, never decoration. The feeling is a premium developer tool: calm, precise, a little cinematic, with enough narrative character (serif italics, NPC initials, a chrome ring) that it is clearly about a living town and not a generic dashboard.

**Moodboard (what to borrow; never copy branding, logos or assets).**
- *OpenCircle (opencircle.cc):* near-black canvas (theme colour `#04060A`), chrome-metal ring and crown-gold used for rank and honour, leaderboard clarity. We borrow the metallic ring and the restrained gold.
- *ClassFundz (classfundz.com):* electric blue (`#3150E9`) over deep navy ink, serif headlines with an italic emphasised word ("Built for *both sides.*"), numbered steps (01, 02, 03), calm trust cards, big readable numbers. We borrow the blue, the italic-emphasis headline and the numbered rhythm.
- *UI Skills (ui-skills.com):* design-engineering craft details: concentric radii, shadows over borders, tabular numbers, balanced text wrapping, press feedback, interruptible transitions, staggered entrances, 44px hit areas. We encode these as rules below.
- *TypeUI (typeui.sh):* the idea of a design system delivered to coding agents as an instruction file so output stays consistent. This file is ours.

**Signature moments (design these with extra care):**
1. **Why? card.** A hero card with a chrome-ring top edge, a serif headline with one italic word ("How Garrick *learned* about it"), the chain as avatars joined by signal-blue arrows, gold on the root witness, tabular confidences (0.90, 0.63). This is the single most beautiful thing in the product.
2. **Rumor path.** The graph dims everything else and the path glows in signal blue with particles moving teller to listener.
3. **Control vs Hearsay.** Two columns, one with a quiet "no provenance" note, one with gold provenance. The contrast is the argument.
4. **Hero headline.** On the landing and empty states: Instrument Serif, large, one italic word, `text-wrap: balance`.

## 2. Colors

All values are in the front matter. Roles:

- **Surfaces** step from `background` (app) to `surface-1` (panels) to `surface-2` (cards, inputs) to `surface-3` (raised, hover, selected). Differences are subtle on purpose; depth comes from layered shadows, not from bright borders.
- **Text:** `text-primary` for content, `text-secondary` for supporting text, `text-tertiary` for hints and metadata only (it meets 4.5:1 on `surface-3` and above; never use it on anything lighter).
- **Primary** `#3150E9` is a *fill* colour (white text on it meets 6:1). It is too dark to use as text or thin strokes on the dark canvas; for those use **signal** `#8FA2FF` (about 8:1).
- **Gold** `#E8C46A` only for provenance and the single "origin" highlight. `on-gold` for text on gold fills.
- **Attitudes** (hostile, wary, neutral, friendly, devoted) are used only on attitude badges, attitude bars and graph node tints. Each always appears with an icon and a text label.
- **Events:** `event-harm` and `event-help` tint event nodes and effect bars.
- **Agents:** small dots on trace chips only. **Factions:** graph node rings and the left border of an NPC's chat bubble only.
- Never introduce a new colour. If a screen seems to need one, ask for a token first.

Alpha effects used in CSS (not tokens, because they depend on the surface beneath): hairline `rgba(255,255,255,0.06)`, strong hairline `rgba(255,255,255,0.10)`, signal glow `rgba(143,162,255,0.35)`.

## 3. Typography

- **Instrument Serif** (regular and *italic*) for display only: hero headlines, empty-state titles, the Why? headline, big numbers on the landing. Always one emphasised word set in italic; never a whole sentence in italic.
- **Geist** for all UI text. **Geist Mono** for ids, query names, trace rows, JSON, counts and any number that changes.
- Load via `next/font/google` (self-hosted at build): `Geist`, `Geist_Mono`, `Instrument_Serif` (weight 400, styles normal and italic). If a family is unavailable in the installed Next.js version, use the closest equivalent and record it on the styleguide page.
- Rules: `font-variant-numeric: tabular-nums` on every changing number (tick, confidence, ms, counts); `text-wrap: balance` on headings and `text-wrap: pretty` on body copy; `-webkit-font-smoothing: antialiased` on the root; sentence case everywhere (no ALL CAPS except 11px tracking-wide section eyebrows, used rarely); max line length 68ch for prose.
- Eyebrows (small labels above headings) use `label` at `text-tertiary` with letter-spacing 0.08em, optionally numbered "01", "02", "03" in Geist Mono (the ClassFundz rhythm).

## 4. Layout

- 4px base grid; use only the `spacing` tokens (4, 8, 12, 16, 24, 32, 48, 64).
- App shell, panel sizes and panel contents: see `docs/duro/ui-spec.md` section 4. Target 1920x1080 (video) and 1440x900.
- Gutters between panels 12px; panel inner padding 16px; card inner padding 8px outer / 16px inner (see Shapes).
- Content hierarchy: one clear focal point per screen. The graph or the Why? card is the focal point; everything else steps back (`text-secondary`, `surface-1`).
- Align optically: an icon next to text is nudged so its visual centre, not its box, aligns with the cap height. Play and arrow icons are shifted 1px toward their pointing direction.
- Hit areas: every interactive element has a hit area of at least 44x44px. Dense list controls may look 32 to 36px tall but get a 44px hit area (padding or a `::after` that extends the target).
- Landing page rhythm (if built): hero, numbered 01 / 02 / 03 explainer cards, a code card with the ten-line integration, a closing call to action. Generous vertical space (96 to 128px between sections), max content width 1120px.

## 5. Elevation and depth

Shadows over borders. Surfaces get depth from layered, low-opacity shadows plus a 1px inner top highlight, not from solid grey borders.

- **Card:** `0 0 0 1px rgba(255,255,255,0.06), 0 1px 1px rgba(0,0,0,0.40), 0 12px 32px -12px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.05)`.
- **Raised / hover:** same recipe, ring at 0.10, shadow slightly larger; transition only the properties that change.
- **Floating (tooltip, popover, toast):** `0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px -4px rgba(0,0,0,0.8)`.
- **Signal glow** (Why? card, highlighted path): `0 0 0 1px rgba(143,162,255,0.35), 0 0 48px -8px rgba(143,162,255,0.35)`.
- **Chrome ring** (selected NPC avatar, top edge of the Why? card): a 1.5px ring using `conic-gradient(from 210deg, #5B6478, #E6EAF2, #6B7388, #C9D0DF, #5B6478)` masked to the ring. Maximum two chrome elements on screen at once.
- **Background:** flat `background` with one very faint radial wash of `primary` at 6% opacity, top-left, plus optional 2% noise. No other gradients.
- Structural borders (input outlines, dividers, focus) still use `border` and `border-strong` where a shadow ring would be wrong.

## 6. Shapes

Concentric radii: **outer radius = inner radius + padding.** Panels and cards use `xl` (24px) with 8px padding around an inner surface of `lg` (16px). Controls (buttons, inputs) use `md` (12px). Small elements (tooltips, kbd) use `sm` (8px). Chips, badges and avatars use `full`. Never put two equal radii on a parent and a closely nested child.

- Avatars: circle, 1px inset outline `rgba(255,255,255,0.10)`; the selected NPC gets the chrome ring.
- Graph nodes: NPC = circle with faction ring; event = rounded diamond; player = small primary dot.
- Icons: lucide, stroke 1.75, 16/20/24px. Icon-only buttons are 40px with a 44px hit area.

## 7. Components

Property mappings are in the front matter. Behaviour and anatomy:

- **Buttons.** Primary (`primary` fill, white text) for the one main action per region (Advance Time, Send, Do it). Secondary (`surface-3`) for alternatives. Ghost for tertiary. Height 40. States: hover lightens; **pressed scales to 0.96** and darkens; disabled 40% opacity, no hover; focus-visible is a 2px `signal` ring with 2px offset. Loading shows a spinner inside the button without changing its width.
- **Cards.** Outer `card` (xl, 8px padding) wrapping `card-inner` (lg, 16px padding) for anything with a header band; simple content can use one level. The Why? card uses `card-hero` with the signal glow and chrome top edge.
- **NPC card.** Avatar (initials, faction ring) + name (headline) + role (caption, secondary) + attitude badge + knows chip. Selected: chrome ring on the avatar, `surface-3` background.
- **Attitude badge.** Pill, icon + label + score (tabular). Tinted background at 12% of the attitude colour, text at the full colour.
- **Knows chip.** `chip` (nothing known), `chip-signal` with an ear icon (heard via X), `chip-provenance` with an eye icon (saw it).
- **Inputs.** `surface-2`, `border`, 12px radius, 40px height; focus ring `signal`. Placeholder `text-tertiary`.
- **Tabs.** Text tabs, no boxes. Active tab `text-primary` with a 2px `primary` underline that slides between tabs (200ms). Inactive `text-secondary`.
- **Trace row.** Mono, `surface-2`, a 6px dot in the agent colour, query id in `text-secondary`, rows and ms right-aligned tabular. Hand-off connector between rows is a 1px `signal` line at 40% opacity.
- **Chat bubble.** Player: `surface-3`, right. NPC: `surface-2`, left, 2px left border in the faction colour. Meta row beneath in `caption` and `text-tertiary`.
- **Tooltip.** `surface-3`, `sm` radius, 150ms delay, never hides critical info.
- **Toast** (sonner): `surface-3` floating recipe, bottom right, max three.
- **Landing hero** (optional task L1): serif display headline with one italic word, subline in `body-lg` secondary, primary CTA "Open the town" plus a secondary "Read the docs", a framed product screenshot with the chrome ring, then the numbered explainer.
- **Code card:** `surface-1`, mono, syntax colours limited to `text-primary`, `signal`, `gold` (strings), `text-tertiary` (comments).

## 8. Motion

Motion explains cause and effect; it never decorates.

- Durations: 120ms (hover, press), 200ms (tabs, small state), 320ms (panels, reveals). Easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Never `transition: all`.** List the exact properties (`transform`, `opacity`, `background-color`, `box-shadow`, `color`).
- **Interruptible:** state toggles use CSS transitions (so they can reverse mid-way), not keyframes. Keyframes only for one-shot entrances.
- **Press feedback:** pressed buttons and cards scale to 0.96 (120ms).
- **Entrances:** opacity 0 to 1, `translateY(8px)` to 0, `blur(4px)` to 0, 320ms; lists stagger at 40ms per item (cap the total at 400ms). **Exits** are subtler and faster: opacity and `translateY(4px)`, 160ms.
- **Numbers:** changing numbers crossfade (120ms) in place with tabular figures; never let layout shift.
- **Rumor path:** continuous particles teller to listener (the one allowed looping animation), a 400ms ease-in when the highlight appears.
- **Reduced motion:** honour `prefers-reduced-motion`: no particles (static thick line), no blur or translate, transitions at most 120ms.
- No parallax, no bouncing, no confetti.

## 9. Craft checklist (apply to every component)

1. Nested radii are concentric (outer = inner + padding).
2. Shadows and ring-shadows for depth; solid borders only for structure and inputs.
3. Tabular numbers on anything that changes.
4. `text-wrap: balance` on headings, `pretty` on paragraphs.
5. Press scale 0.96 on buttons and clickable cards.
6. Specific transition properties; no `transition: all`.
7. Entrance stagger on lists; subtle exits.
8. Hit areas at least 44px; visible focus ring.
9. Optically aligned icons and labels.
10. Avatars and images get a 1px inset outline at 10% white.
11. No layout shift: reserve space for skeletons, images and changing numbers.
12. Contrast: text at least 4.5:1, large text and UI strokes at least 3:1. `npx @google/design.md lint` must pass.

## 10. Do's and Don'ts

**Do**
- Use only tokens from this file (as CSS variables and Tailwind theme values); add a token here first if something is missing.
- Use `primary` for fills and `signal` for text, strokes, glows and the rumor path.
- Reserve gold for provenance (origin of a chain, "saw it", source tags).
- Pair every colour signal with an icon or label.
- Keep one focal point per screen and let everything else recede.
- Set one word of a serif headline in italic for emphasis.
- Show real numbers (confidences, ms, ticks) in tabular mono; show real ids in the trace.
- Make the empty, loading and error states as polished as the populated state.

**Don't**
- Don't use pure white backgrounds, pure `#000`, or any light theme.
- Don't use `primary` as text colour on dark surfaces (it fails contrast).
- Don't use more than two chrome elements on screen, or gold for decoration.
- Don't use gradients beyond the vignette, the chrome ring and the signal glow; no rainbow or purple-pink gradients.
- Don't use emojis, stock illustrations, mascots or decorative icons.
- Don't use ALL CAPS body text, centred paragraphs longer than two lines, or italic sentences.
- Don't nest cards more than two levels deep.
- Don't use `transition: all`, bounce easing, or animations longer than 400ms (except the rumor particles).
- Don't use arbitrary values (`bg-[#...]`, `text-[13px]`); use tokens and the type scale.
- Don't add a UI library, icon set or font that is not named here.
- Don't ship a screen that is not on the `/styleguide` page.

## 11. Enforcement

- `npx @google/design.md lint DESIGN.md` on every change to this file (pre-commit runs it when this file is staged). It catches broken token references and contrast failures.
- `pnpm check:design` scans `apps/web` for hard-coded colours, arbitrary values and forbidden libraries.
- The `/styleguide` route renders every token and component state; compare the app against it.
- Screenshots at 1440x900 after each UI task, committed to `docs/duro/screens/`.
- Format note: DESIGN.md is an alpha format. Run `npx @google/design.md spec` once to see the current rules and fix anything `lint` reports in this file (key names, section order or extra sections such as Motion and the Craft checklist). Never delete a rule to make lint pass without moving it to another section.
