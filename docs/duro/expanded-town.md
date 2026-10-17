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

Art generation and browser evidence are recorded with the UI integration.
