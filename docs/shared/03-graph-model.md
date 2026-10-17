# 03 — Graph model and seed world

## Graph names

- `world_template` — the town as designed. Read-only during play.
- `player:{playerId}` — a full copy per player. All gameplay writes happen here.

## Nodes

```
(:Player   {id, name, tick, createdAt})            tick = current game time (int)
(:NPC      {id, name, role, faction, greed, courage, loyalty, persona})   traits 0..1
(:Faction  {id, name})
(:Place    {id, name})
(:Event    {id, type, weight, tick, at, subject})  weight -1..+1; subject may be '' (e.g. 'iron sword')
(:Fact     {id, text, topic})
(:Policy   {id, kind, markup, minMarkup, maxMarkup, step})   haggling policy (flat props, no maps)
(:Conversation {id, tick, at})
(:Utterance    {id, speaker, text, tick, at})      speaker = 'player' or an NPC id
```

`id` is a stable slug (`brom`, `forge`, `ev_...`). Create a range index on `id` for Player, NPC, Event, Place (see FalkorDB docs: Indexing). Verify the exact DDL syntax in Browser.

## Edges

```
(Player)-[:PERFORMED]->(Event)
(Event)-[:HAPPENED_AT]->(Place)

(NPC)-[:KNOWS {via, root, hop, confidence, tick}]->(Event)
    via        'witness' or the id of the NPC who told them
    root       id of the NPC who originally witnessed the event
    hop        0 for witnesses, teller.hop + 1 for listeners
    confidence 0..1, 1.0 for witnesses; credibility for listeners
    tick       when they learned it

(NPC)-[:TOLD {event, root, tick, confidence}]->(NPC)       one edge per retelling (teller -> listener)

(NPC)-[:TRUSTS {weight}]->(NPC)                             truster -> trusted, 0..1
(NPC)-[:MEMBER_OF]->(Faction)
(Faction)-[:ALLIED_WITH]->(Faction)    (Faction)-[:HOSTILE_TO]->(Faction)
(NPC)-[:BELIEVES {confidence}]->(Fact)
(NPC)-[:FOLLOWS {tries, wins}]->(Policy)

(Player)-[:STARTED]->(Conversation)
(Conversation)-[:BETWEEN]->(NPC)
(Conversation)-[:HAS]->(Utterance)
```

Direction of TRUSTS matters. `(mira)-[:TRUSTS {weight:0.9}]->(brom)` means **Mira trusts Brom at 0.9**, so when Brom tells Mira something, Mira believes it at `0.9 x Brom's confidence`.

## Seed world: Hollowbrook

### Places
`forge` (Brom's Forge), `inn` (The Copper Kettle), `barracks` (Guard Barracks), `market` (Market Row), `chapel` (Chapel of Ash), `square` (Town Square).

### Factions
`townsfolk`, `guard`, `merchants`. Relations: guard ALLIED_WITH townsfolk; merchants ALLIED_WITH townsfolk; guard HOSTILE_TO merchants is NOT used (keep it simple).

### NPCs (locked: the demo depends on these values)

| id | name | role | faction | greed | courage | loyalty |
| --- | --- | --- | --- | --: | --: | --: |
| brom | Brom | blacksmith | townsfolk | 0.4 | 0.7 | 0.6 |
| mira | Mira | innkeeper | townsfolk | 0.5 | 0.4 | 0.5 |
| garrick | Garrick | guard captain | guard | 0.2 | 0.9 | 0.9 |
| tilda | Tilda | merchant | merchants | 0.8 | 0.3 | 0.3 |
| fenn | Old Fenn | beggar, knows everyone | townsfolk | 0.3 | 0.2 | 0.2 |
| ayla | Sister Ayla | healer | townsfolk | 0.1 | 0.5 | 0.8 |

`persona` (string, written by DuroT in the seed file): 2 to 3 sentences of voice and manner, used in the LLM prompt. Example for Garrick: "Gruff, formal, speaks in short sentences. Takes oaths and theft seriously. Never swears."

### TRUSTS edges (locked; truster -> trusted : weight)

```
mira    -> brom     0.9
brom    -> mira     0.8
fenn    -> mira     0.8
mira    -> fenn     0.6
garrick -> mira     0.7
mira    -> garrick  0.6
tilda   -> fenn     0.5
fenn    -> tilda    0.3
ayla    -> mira     0.6
mira    -> ayla     0.7
tilda   -> garrick  0.5
garrick -> tilda    0.4
ayla    -> brom     0.5
```

Deliberately absent: `garrick -> brom`, `garrick -> fenn`, `brom -> garrick`. Garrick does not trust Brom or Fenn directly, so the rumor must travel through Mira. This is what makes the demo chain interesting. Do not add edges without telling Goodness; tests assert these numbers.

### Expected gossip result (golden test)

Player steals from Brom (type `stole`, weight -0.8, witness `brom`), then `advanceTime` x4. Gossip requires `|weight| >= 0.3` and credibility `>= 0.25`.

| Tick processed | New KNOWS | via | credibility | hop |
| --- | --- | --- | --: | --: |
| 1 | mira | brom | 0.90 | 1 |
| 1 | ayla | brom | 0.50 | 1 |
| 2 | fenn | mira | 0.72 | 2 |
| 2 | garrick | mira | 0.63 | 2 |
| 3 | tilda | fenn | 0.36 | 3 |
| 4 | (nobody) | | | rumor dies out |

Notes: on tick 3 Tilda is also reachable from Garrick at `0.63 x 0.5 = 0.315`; she hears it from Fenn because `0.36 > 0.315` (highest credibility wins; one KNOWS edge per NPC per event). `explain(garrick)` returns chain `[brom, mira, garrick]`, confidences `[0.9, 0.63]`.

With `spread {maxHops: 1}` the reach is {mira, ayla}; with `maxHops: 3` it is {mira, ayla, fenn, garrick, tilda}. Use this contrast in the demo.

### Facts (semantic memory; DuroT writes ~12, 2 per NPC)

`Fact {id, text, topic}` plus `(NPC)-[:BELIEVES {confidence}]->(Fact)`. Example: "The Merchants Guild raised grain prices before harvest." Topics: `prices`, `guard`, `weather`, `chapel`, `rumor`. NPCs may mention facts they BELIEVE; they may not mention player events they do not KNOW.

### Policies (procedural memory)

One policy for the demo:

```
Policy {id:'haggle_tilda', kind:'haggle', markup:0.10, minMarkup:0.05, maxMarkup:0.30, step:0.05}
(tilda)-[:FOLLOWS {tries:0, wins:0}]->(haggle_tilda)
```

### Event types (shared by contract and seed)

| type | default weight | firewall keywords (strong words only) |
| --- | --: | --- |
| stole | -0.8 | stole, stolen, steal, theft, thief |
| attacked | -0.9 | attacked, assault, assaulted |
| lied | -0.4 | liar, lied |
| helped | +0.5 | (none) |
| donated | +0.4 | donation, donated |
| saved | +0.9 | rescued |
| traded | +0.1 | (none) |

Keywords are matched case-insensitively as whole words. `subject` words (e.g. `sword`) are added at runtime. Keep keyword lists short and specific: common words like "help" cause false violations.

## Seed file format: `seed/hollowbrook.json`

```json
{
  "version": 1,
  "factions": [{ "id": "townsfolk", "name": "Townsfolk" }],
  "places": [{ "id": "forge", "name": "Brom's Forge" }],
  "npcs": [{
    "id": "brom", "name": "Brom", "role": "blacksmith", "faction": "townsfolk",
    "greed": 0.4, "courage": 0.7, "loyalty": 0.6,
    "persona": "Broad, blunt, proud of his work. Speaks plainly."
  }],
  "trusts": [{ "truster": "mira", "trusted": "brom", "weight": 0.9 }],
  "factionRelations": [{ "from": "guard", "to": "townsfolk", "type": "ALLIED_WITH" }],
  "facts": [{ "id": "f_grain", "text": "The Merchants Guild raised grain prices before harvest.", "topic": "prices" }],
  "believes": [{ "npc": "tilda", "fact": "f_grain", "confidence": 0.9 }],
  "policies": [{ "id": "haggle_tilda", "kind": "haggle", "markup": 0.1, "minMarkup": 0.05, "maxMarkup": 0.3, "step": 0.05 }],
  "follows": [{ "npc": "tilda", "policy": "haggle_tilda" }],
  "eventTypes": [{ "type": "stole", "weight": -0.8, "keywords": ["stole", "stolen", "steal", "theft", "thief"] }],
  "templates": {
    "greeting": { "hostile": ["..."], "wary": ["..."], "neutral": ["..."], "friendly": ["..."], "devoted": ["..."] },
    "unknownTopic": ["I wouldn't know anything about that."],
    "aware": { "hostile": ["I know what you did. Stay away from me."] }
  }
}
```

Rules for the seed file:
- All ids are lowercase slugs matching `^[a-z0-9][a-z0-9_-]{0,39}$`.
- Every `trusts`, `believes`, `follows` reference must point to an existing id. The loader validates and fails loudly.
- Templates must exist for all five attitude labels. They are the fallback when the LLM is unavailable or the firewall rejects a reply, so they must read naturally and **must not mention any specific event**.
- Also add `templates.naive`: 3 lines used only by `sayNaive` when the LLM is off (for example "Oh, I know everything that goes on in this town."). They may be generic and boastful; they do not need to avoid events because that control is meant to look leaky.
- Template strings may be per-NPC: add optional `"byNpc": { "garrick": { ... } }` for voice. Fall back to the generic lines.
