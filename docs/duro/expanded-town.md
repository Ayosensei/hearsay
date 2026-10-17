# Hollowbrook: thirteen lives

The user requested ten additional villagers and a more complex social network.
The expanded web edition adds a family of four, priest/healer, beggar, bachelor,
butcher, fisherman and merchant. All characters are synthetic; the Vale children
are adults. The classic seed remains intact for compatibility and golden tests.

| Resident | Life in town | District |
| --- | --- | --- |
| Rowan Vale | Carpenter; Elin's husband, Lysa and Oren's father | Vale Lane |
| Elin Vale | Baker; Rowan's wife, Lysa and Oren's mother | Vale Lane |
| Lysa Vale | Adult daughter; courier | Vale Lane |
| Oren Vale | Adult son; apprentice | Vale Lane |
| Sister Ayla | Priest and healer | Riverside |
| Old Fenn | Beggar and observer | Riverside |
| Julian Reed | Bachelor and musician; Silas's friend | Riverside |
| Marta Flint | Butcher; supplies the bakery and river crew | Riverside |
| Silas Brook | Fisherman; Julian's trusted friend | Riverside |
| Tilda Moss | Merchant; linked to Fenn, the bakery and guard | Riverside |

Original residents Brom, Mira and Garrick remain in Old Town. There are 12
graph-resolved places, 41 directional TRUSTS edges, family/world Facts linked
through BELIEVES, and distinct personas plus event-safe fallback voices.
Family ties are expressed through actual graph facts and trust, not invented
contract relationship types. Run `node scripts/build-expanded-world.mjs` to
regenerate `seed/hollowbrook-expanded.json` from the classic seed and new content.

## A branching example, verified on real FalkorDB

Record the sword theft with Brom as witness:

- Turn 1: Mira 90%, Rowan 85%, Ayla 50%.
- Turn 2: Elin 80.75%, Lysa 68%, Oren 63.75%, Fenn 72%, Garrick 63%.
- Turn 3: Marta 64.6%. Tilda hears from Elin at 52.4875%, beating the simultaneous
  Fenn route (36%) and guard route (31.5%). This differs intentionally from the
  classic six-person golden fixture, which has no Vale family route.
- Turn 4: Silas hears from Marta at 54.91%. Fenn's earlier 21.6% route was too weak.
- Turn 5: Julian hears from Silas at 43.928%. Tilda's earlier 20.995% route failed.
- Turn 6: no new gossip.

Julian's actual explain chain is Brom → Rowan → Elin → Marta → Silas → Julian.
The existing core's verified via-walk fallback handles this five-hop path, beyond
the bounded Q61 traversal. No query or scoring changes are necessary. Existing
knowledge is not upgraded when a later stronger rumor arrives; strongest-source
selection applies to candidates in the round where a person first learns.

Real integration coverage also verifies four family witnesses, Julian remaining
unaware of a new family action, the dialogue firewall, and a separate clean save.

## Publication and saves

The web app uses a new `world_template_hollowbrook13` template with the expanded
seed, and a new `_x_a` / `_x_b` browser-player namespace. Existing classic graphs
and browser identities are retained, not reset or overwritten. The expanded town
therefore begins with fresh histories. Explicit custom server seed/template
settings are still respected. CLI/MCP integrations can opt into the same seed
through their existing world configuration; the classic default is unchanged.

## UI and artwork

The minimal main screen remains two actions. A district picker reveals three,
four or six local residents; Menu → Meet the villagers lists/searches all thirteen
by graph-provided name and occupation. Selecting a resident changes the district.
Confirmed gossip follows its listener across districts; an incoming label names
the outside teller instead of pretending they are physically in the same place.
The inspector lays out all thirteen graph nodes without coordinate collisions.

The deed form starts with the selected villager and their graph-resolved place.
Select 1–6 witnesses, or use the explicit four-person Vale family shortcut.
Changing witness selection never submits the form. Each confirmed witness gets
their own reaction beat. The existing contract already supports multiple witnesses;
the real-database four-witness test verifies the extension before enabling it.

New local assets: `apps/web/public/town/residents.png` (ten transparent puppets,
five columns/two rows), `vale-lane.png`, `riverside.png`, and a normalized atlas
manifest. Built-in image_gen generated all three; no API-key/CLI fallback or new
rendering dependency. Original initial district assets stay approximately 5 MB;
new district artwork loads on demand. No FPS/total-payload benchmark is claimed.

Generation prompt set: layered paper cutout storybook, warm upper-left lantern
light and indigo dusk, visible paper texture, full-body chunky adult puppets,
no text. The transparent atlas's top row is Rowan carpenter, Elin baker, Lysa
courier, Oren apprentice, Ayla priest; bottom row Fenn beggar, Julian musician,
Marta butcher, Silas fisherman, Tilda merchant. Vale Lane is a 3:1 opaque paper
panorama with timber yard, bakery, family cottage and workshop around a garden.
Riverside is a 3:1 opaque panorama with chapel, square/well, market, boarding
house, butcher shop and fishing dock. Both backgrounds exclude people and labels.

## Verification (2026-10-17)

- `pnpm typecheck` and `pnpm check:design` pass.
- Full `pnpm test`: 139 passing tests (5 contract, 105 core, 19 web, 2 MCP,
  8 CLI), using real local FalkorDB. The web suite includes three expanded-world
  integration tests with isolated temporary graphs and cleanup.
- Browser: a single Brom theft reached Julian on turn 5; the explanation displayed
  all six people in the real five-hop chain. No new duplicate-key errors after
  distinguishing animation and evidence SVG keys.
- Separate traveller A began clean. A single roof-repair action with all four
  Vale witnesses made all four friendly witnesses; Julian remained neutral and
  unaware. Family selection itself did not submit the form.
- The styleguide includes the expanded cast and resident directory. Directory
  search by `fisherman` returned Silas and opened his details.
- Tested 1440x900 desktop and 390x844 mobile. The mobile district selector stays
  fixed while the panorama scrolls. Screenshots are in `docs/duro/screens/expanded-*`.
