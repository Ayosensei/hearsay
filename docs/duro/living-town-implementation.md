# Living Town implementation

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
Browser and final build evidence are recorded after the final checks below.
