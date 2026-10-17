# Cinematic flow refinement

The user wanted the beauty and flow restored while retaining the simpler UI.

- A closer, horizontally explorable panorama uses the original art at full
  brightness. Characters keep their aspect ratio; scene coordinates and actions
  remain presentation-only. A subtle sky fade protects overlay text.
- Confirmed gossip focuses the listener, lights their ground ring and shows
  teller → listener, actual confidence and progress through that returned round.
  Cross-district arrivals retain their source label. Narration remains available.
- Each normal-motion beat lasts 2.6 seconds, with a 1.6-second whisper flight.
  Reduced motion uses static evidence and 1.1-second text beats, without smooth
  camera movement. No idle animation or audio was added.
- Replay these whispers reuses only the last successful advanceTime result.
  It makes no tool request, does not advance the tick and cannot create memories.
  Replay data clears on save switches, resets, new deeds and a quiet round.
- Main actions remain Take an action and Let the town talk. District and local
  walking selectors stay reachable as the panorama scrolls. All new flow states
  (witness, travelling, settled/replay) appear on /styleguide.

Verification and screenshots are recorded with the implementation commit.

Verified: full workspace typecheck and design guard pass. Browser tested at
1440x900 and 390x844: actual five-whisper roof-repair round, cross-district
listener focus and source label, replay remaining at Turn 1, and reduced-motion
static paths. All thirteen residents remain reachable through district/local
selectors or the resident directory. No new browser errors in this pass.
Full regression suite: 139 tests passed against real FalkorDB. The production
build is checked separately to avoid competing with the CLI integration tests.
`pnpm build` passed; the existing seed-loader dynamic-filesystem tracing warning
remains. Design guard passes, no new dependencies, backend or contract changes.
Screens: cinematic-flow-1440x900.png and cinematic-mobile-390x844.png.
