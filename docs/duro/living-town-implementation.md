# Living Town implementation

## Minimal refinement

The user requested less visual clutter after testing the first design. Main
navigation is now Hearsay, Your story, and Menu, with just two free-play actions.
Saves, view lenses, accessibility, replay/reset and engine tools are disclosed
inside Menu. The guide replaces the normal action area with one current step.
Floating deed cards, persistent confidence notes, the hero headline, brass dock,
location labels and ambient idles are removed from the main view. Confirmed
whispers still animate; selected characters retain memory, attitude and trace.
Mobile retains quiet location navigation so offscreen villagers remain reachable.

Verified the live menu, hidden view options, Escape, character memory and real
Brom → Mira → Garrick evidence, plus welcome/guided/waiting styleguide states.
Desktop and 390x844 mobile screenshots are `screens/minimal-*.png`. Typecheck,
136 tests, design guard, DESIGN.md lint and production build passed. No engine
or contract changes or new dependencies were required.

The user explicitly adopted `HEARSAY_LIVING_TOWN_DESIGN.md` on 2026-10-17.
Its town presentation supersedes the older dashboard layout. The contract,
queries, seed, save identities, and opinion/gossip algorithms are unchanged.

## Run and explain

Use `docker compose up -d falkordb` and `pnpm dev`, then localhost:3001.
The page uses the real HTTP/core adapter. The SVG stage only reads confirmed
state. `advanceTime.steps` becomes a sequential beat queue, with a single
non-looping whisper per actual step. CSS work idles never write to the graph.
Controls wait while a request or a beat is active; uncertain writes never retry.

Choose a deed in the Ledger. Knowledge notes and whisper trails refer to that
deed; attitude still comes from all graph memories. Explanation paths come from
the explain tool, while attitude contributions come from the attitude tool.
Trust arrows point from truster to trusted; gossip goes teller to listener.

The six-step sword introduction uses real calls. Editing it into a different
scenario exits the guided script instead of asserting a fabricated consequence.
Replay explicitly confirms resetting the selected save. Existing browser save
identities remain intact; chat continuity is retained while switching saves.

Movement (click road, WASD/arrows, Shift) is presentation only. The three-location
navigation follows the traveller on narrow screens. Paper drawers trap focus,
restore focus, close with Escape, and make background controls inert. Settings
offer reduced motion, larger text, and the same story/actions in text form.
System reduced motion is respected. Audio is intentionally silent (optional in
the brief); no sound permissions or new libraries are introduced.

## Artwork and implementation choices

Built-in image generation produced `public/town/hollowbrook.png` and
`public/town/puppets.png`, approximately 5 MB combined. The former is an opaque
panorama; the latter is a transparent four-character atlas. They are committed
local assets, with no external image host. Browser rendering uses React/SVG/CSS
instead of the brief's suggested Phaser/Pixi/Spine/Zustand dependencies. Source
components and CSS remain editable. This is a functional 2D implementation, not
a Blender model or a Figma/Spine source delivery. The panorama is flattened;
puppets have CSS movement and state tags rather than an eight-frame skeletal rig.
No unmeasured FPS or mobile-performance claim is made.

Generation prompt set (built-in image_gen, no API/CLI fallback):

- Panoramic layered paper village, indigo dusk and amber lanterns, upper-left
  lighting, exactly forge/inn/barracks from left to right, furnace and sword rack,
  copper kettle sign, violet guard banner, cobbled road and well, paper hills,
  moon and stars; no people, text, UI, or labels; opaque 3:1 landscape.
- Transparent 3:1 atlas, one row/four equal cells, full-body traveller with hood,
  satchel/lantern; broad bearded Brom with apron/hammer; Mira in teal and cream
  with tea towel/kettle; Garrick in steel/violet armor with helm. Oversized heads,
  neutral expressions, layered paper texture, consistent warm upper-left light,
  feet aligned, separate silhouettes, no labels, ground, or UI.

`DESIGN.md` owns the palette. Run `node scripts/design-tokens.mjs` to regenerate
the Tailwind theme, then `npx @google/design.md lint DESIGN.md` and
`pnpm check:design`. The styleguide has town, lenses, reduced-motion, five
attitudes, prepared/full forms, knowledge, evidence, empty/failure/reset states.

## Verification

Real database integration tests assert exact gossip steps and attitude
contributions as well as the existing full theft/gossip/explain flow.
Full workspace suite: 136 tests passed against real FalkorDB. Typecheck, design
guard, design-document lint, and production build passed. The build retains the
existing core seed-loader dynamic-filesystem tracing warning; no new build error.

Browser checks on the actual app:

- Traveller B began clean; the prepared sword card recorded one theft.
- Brom became hostile and an eyewitness; Mira and Garrick stayed unaware.
- Garrick replied “Nobody has told me.” with template source/knowledge check.
- Explain before gossip showed the explicit no-evidence state.
- First turn: Brom told Mira, confidence 90%; Garrick remained unaware.
- Second turn: Mira told Garrick, confidence 63%; Garrick became wary.
- Evidence returned Brom → Mira → Garrick, 100/90/63%, with expandable arithmetic.
- Attitude view separately showed the negative theft contribution.
- Traveller A retained its pre-existing three-deed history. B stayed separate.
- Reload preserved B's turn-two world and selected save; visible chat reset as documented.
- At 390x844, location navigation scrolled the 1100px stage to the barracks;
  Garrick's knowledge and attitude were readable in the mobile sheet.
- Escape closed drawers. Reduced motion and Story as text switched successfully;
  the text view retained the same character and action controls.
- Styleguide exposed prepared/full forms, preserved-failure choices, evidence,
  unaware/witness/attitude states and the new town/lenses.

Screenshots: `screens/living-town-{arrival,desktop,evidence,styleguide}-1440x900.png`
and `screens/living-town-mobile-390x844.png`. They are actual browser captures.
