---
version: alpha
name: Hearsay
description: A warm paper diorama at indigo dusk. Lantern-lit characters reveal real graph memory, with blue whispers and gold provenance.
colors:
  background: "#1B1E3F"
  surface-1: "#242447"
  surface-2: "#302D50"
  surface-3: "#3A3563"
  border: "#1A2030"
  border-strong: "#262E42"
  text-primary: "#F4E9D2"
  text-secondary: "#D9C9A6"
  text-tertiary: "#BFB6CE"
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
  skyDeep: "#1B1E3F"
  skyMid: "#3A3563"
  skyGlow: "#F2A65A"
  paperCream: "#F4E9D2"
  paperShade: "#D9C9A6"
  inkBlack: "#1C1A24"
  woodBrown: "#5A3E2B"
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
  border-subtle:
    backgroundColor: "{colors.border}"
  border-emphasis:
    backgroundColor: "{colors.border-strong}"
  text-hint:
    textColor: "{colors.text-tertiary}"
  status-danger:
    textColor: "{colors.danger}"
  status-success:
    textColor: "{colors.success}"
  attitude-hostile:
    textColor: "{colors.attitude-hostile}"
  attitude-wary:
    textColor: "{colors.attitude-wary}"
  attitude-neutral:
    textColor: "{colors.attitude-neutral}"
  attitude-friendly:
    textColor: "{colors.attitude-friendly}"
  attitude-devoted:
    textColor: "{colors.attitude-devoted}"
  event-harm:
    textColor: "{colors.event-harm}"
  event-help:
    textColor: "{colors.event-help}"
  agent-scribe:
    textColor: "{colors.agent-scribe}"
  agent-gossip:
    textColor: "{colors.agent-gossip}"
  agent-npc:
    textColor: "{colors.agent-npc}"
  agent-system:
    textColor: "{colors.agent-system}"
  faction-townsfolk:
    textColor: "{colors.faction-townsfolk}"
  faction-guard:
    textColor: "{colors.faction-guard}"
  faction-merchants:
    textColor: "{colors.faction-merchants}"
  town-sky:
    backgroundColor: "{colors.skyDeep}"
  town-sky-surface:
    backgroundColor: "{colors.skyMid}"
  town-lantern:
    textColor: "{colors.skyGlow}"
  paper-sheet:
    backgroundColor: "{colors.paperCream}"
  paper-caption:
    textColor: "{colors.paperShade}"
  paper-ink:
    textColor: "{colors.inkBlack}"
  paper-heading:
    textColor: "{colors.woodBrown}"
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

The user-approved Living Town brief in `docs/duro/HEARSAY_LIVING_TOWN_DESIGN.md`
replaces the former Obsidian and Signal presentation. The shared tool contract and
backend behavior remain authoritative. This palette is generated into globals.css
with `node scripts/design-tokens.mjs`.

## Identity and materials

A layered paper town at indigo dusk. Warm lanterns, cream paper, readable ink.
The town occupies the stage; controls are paper tags and a brass action dock.
Use the existing Instrument Serif, Geist and Geist Mono fonts. Serif italic for
one emphasized word; mono only for actual numbers and technical inspection.
No new UI, animation, icon or state library is needed for the SVG/React renderer.

## Meaning

Gold marks witnesses and provenance only. Signal blue marks confirmed gossip.
Attitudes use the existing five semantic colors plus explicit labels and faces.
Confidence is a labeled number and note texture, never a health bar.
Paper surfaces use paperCream with inkBlack; sky surfaces use text-primary.

## Layout and components

The full-screen town has an arrival invitation, Ledger at top left, traveller
saves at top right, narrator and action dock below, and closeable edge drawers.
Character knowledge and attitude are separate sections. Technical graph/trace
and comparison live in Under the hood. Existing shadcn Button/Input primitives
are used. Hit targets at least 44px; controls radius 12px, drawers radius 20px.
Responsive bottom sheets and location navigation keep the town usable on phones.

## Minimal presentation

User-requested minimal refinement: keep the town artwork but remove persistent
hero text, decorative dock frames, floating deed cards and confidence chips.
Main navigation is Hearsay, Town / Memory graph, Your story and Menu. Free play has
two controls: Explore this location and Pause/Resume town. A visible clock advances
gossip automatically. The location drawer offers witnessed local actions.
Trace lives with character memories.
Saves, lenses, accessibility, reset and engine tools use progressive disclosure
inside Menu. Guided play shows only its current instruction and primary action.
Ambient idles are off in the minimal view; confirmed whispers still play.

## Motion and accessibility

Walking determines proximity witnesses; only confirmed actions create memories. One-shot whisper
flights (up to 1600ms) and witness reactions require confirmed tool results.
Queue results in response order. UI transitions use 120/200/320ms; no transition-all.
Reduced motion removes parallax, flicker and flights; use static paths and narration.
Every beat has a text equivalent. Arrow/WASD walking never runs engine writes.
Escape closes drawers, Tab/Enter reaches all actions; focused dock Space advances.
Offer readable text mode, larger text and reduced motion. No unrequested audio.

## Enforcement and craft

Use semantic tokens, existing Tailwind scale, named exports and small components.
All new states appear on /styleguide. Run design lint and check:design, and save
1440x900 screenshots. Never imply stealth, calendar, arrest, cloud accounts or
unverified live dialogue. The user-requested scenarios display Garrick’s trust
as the actual attitude score mapped from -1..1 to 0..100; this is not confidence.
Trust at 20 or below ends play. Scenario medicine/tools derive from recorded events;
there is no general inventory system. Each scenario choice or wait advances one
gossip turn; walking and reading are free. The objective badge opens the brief,
progress, relevant destinations, verdict and retry. Nearby villagers witness actions within
240 world units, in the same district. Time pauses for drawers, hidden tabs,
offline state, errors and confirmed reaction playback; no background catch-up.
