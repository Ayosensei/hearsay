# 06 — Behaviour specs (exact formulas and flows)

Both owners must read this. These specs are deterministic so that tests, the UI and the demo agree.

## 1. Gossip

Constants: `MIN_WEIGHT = 0.3` (only events with `|weight| >= 0.3` are gossip-worthy), `MIN_CRED = 0.25` (default `minCredibility`).

A listener `b` hears event `e` from teller `a` when:
- `a` KNOWS `e` and `b` does not.
- `b` TRUSTS `a` (an edge `(b)-[:TRUSTS]->(a)` exists).
- `credibility = a.confidence x trust(b -> a) >= minCredibility`.

Rules:
1. Per tick (or per round in `spread`), compute all candidates first (Q40), then pick **one teller per (event, listener)**: highest credibility, ties by teller id ascending.
2. Write all picks together (Q41). People who learn something this tick do not tell it until the next tick.
3. New edge on the listener: `KNOWS {via: teller, root: teller.root, hop: teller.hop + 1, confidence: credibility, tick}`. Also `TOLD {event, root, tick, confidence}` from teller to listener.
4. `advanceTime`: one round over all events, then `Player.tick += 1`. Returned `tick` is the new tick. Steps are tagged with the **new** hop number of the listener.
5. `spread {eventId, maxHops, minCredibility}`: repeat rounds restricted to that event until `maxHops` rounds have run or no candidates remain. `stoppedBecause`: `max_hops` if it ran the full count with candidates remaining; `min_credibility` if candidates existed but all were below the threshold; `no_listeners` otherwise. `spread` does **not** change `Player.tick`.
6. Gossip never changes the event itself. Confidence only decays along the chain; it never increases.

Golden test: see the table in `03-graph-model.md`. Credibilities: mira 0.9, ayla 0.5 (tick 1); fenn 0.72, garrick 0.63 (tick 2); tilda 0.36 via fenn (tick 3); nothing at tick 4. Compare with a tolerance of 1e-9.

## 2. Attitude (opinion) — pure function in `opinion.ts`

Inputs: NPC traits (`loyalty`, `greed`), the current player `tick`, and every event the NPC KNOWS about this player: `{weight, tick, confidence}`.

```
recency(e)     = max(0.3, 1 - 0.05 * (currentTick - e.tick))
traitFactor(e) = e.weight < 0 ? 0.7 + 0.6 * loyalty      // loyal NPCs punish harm harder
                              : 0.7 + 0.6 * (1 - greed)  // greedy NPCs reward kindness less
effect(e)      = e.weight * e.confidence * recency(e) * traitFactor(e)
score          = clamp(sum(effect(e)), -1, 1)
```

Labels:

| score | label |
| --- | --- |
| <= -0.6 | hostile |
| <= -0.2 | wary |
| < 0.2 | neutral |
| < 0.6 | friendly |
| >= 0.6 | devoted |

(boundary rule: the first row that matches from the top wins; e.g. exactly -0.2 is `wary`.)

`attitude` returns `score`, `label`, and `contributions` (one per event, with `effect`, `confidence`, `learnedFrom`). The UI shows these as the "why" breakdown. No NPC knows nothing -> score 0, label `neutral`, empty contributions.

Worked example (current tick 2): Garrick (loyalty 0.9) knows the theft (weight -0.8, tick 0, confidence 0.63): recency = 0.9, traitFactor = 0.7 + 0.54 = 1.24, effect = -0.8 x 0.63 x 0.9 x 1.24 = -0.562464 -> `wary`. Brom (loyalty 0.6, confidence 1.0, tick 0): traitFactor = 1.06, effect = -0.8 x 1.0 x 0.9 x 1.06 = -0.7632 -> `hostile`. Unit tests assert these unrounded values. Garrick rounds to -0.5625 at four decimal places; the formula is unchanged (see R-004).

## 3. Explain

1. Q60 for `(npc, event)`. No row -> `{status:'not_in_graph', learnedFrom:null, chain:[], hopConfidences:[], edgeIds:[]}`.
2. If `hop = 0`: chain is `[npc]`, no hop confidences, `learnedFrom: 'witness'`.
3. Else run Q61 (or the `via`-walk fallback) with `root`. Build `chain`, `hopConfidences`, and `edgeIds` (the `TOLD` edge ids `TOLD:{from}->{to}:{eventId}` plus the final `KNOWS` edge id).
4. The explanation is **only** this path. The LLM is never asked to explain.

## 4. The NPC reply pipeline (`say`)

```
say(playerId, npcId, text, conversationId?)
 1. resolve player, NPC (UNKNOWN_*), create/continue Conversation (Q95)
 2. recall (Q50) + attitude (Q51)         -> knownEvents[], attitude{score,label}
 3. recent utterances (Q97, last 6)       -> continuity
 4. log player Utterance (Q96)
 5. if HEARSAY_LLM=off or LLM fails       -> template reply (step 8)
 6. build prompt from ONLY known facts    -> llm.generate()  (JSON output)
 7. firewall(reply, knownEvents, allEvents) -> if violations: retry once with stricter instruction; still failing -> template
 8. template reply from seed templates (never mentions an event)
 9. log NPC Utterance (Q96); return {reply, source, firewall, attitude, usedEventIds}
```

### Prompt contract (`llm.ts` input)

System message (assembled in code, not by the LLM):
```
You are {name}, {role} of Hollowbrook. {persona}
Reply in character, in at most 50 words. You are speaking to a traveller.
Your current attitude toward the traveller: {label}. Let it colour your tone.
You may ONLY refer to the events listed under KNOWN EVENTS. If the traveller mentions anything else about their past,
you do not know about it: say so in character, and do not confirm or deny it.
Do not invent people, places, items or events.
KNOWN EVENTS (what you know about the traveller):
- [{eventId}] {typeSentence} (you {learnedFromSentence}, you are {confidencePercent}% sure)
BELIEFS (general world facts you hold):
- {fact text}
Return JSON: {"reply": string, "referencedEventIds": string[]}
```
- `typeSentence`: human sentence per type, e.g. `stole`: "The traveller stole {subject or 'something'} at {place}".
- `learnedFromSentence`: "saw it yourself" or "heard it from {teller name}".
- **Never include events the NPC does not know.** Never include other NPCs' private knowledge.
- Temperature low (<= 0.4). Request JSON output (response schema/mime type if the SDK supports it; otherwise parse robustly and treat parse failure as an LLM failure).

### Firewall (`firewall.ts`, pure and unit tested)

Input: `reply`, `referencedEventIds`, `knownEventIds`, `unknownEvents[]` (events performed by this player that the NPC does NOT know, each with its keywords + subject words).

Violations (all must be empty to pass):
1. `referencedEventIds` contains an id not in `knownEventIds` -> `referenced unknown event {id}`.
2. For each unknown event, any keyword or subject word appears in the reply as a whole word (case-insensitive) -> `mentions {word} of an event this NPC never learned`.
3. (Optional, if time) reply names a person or place not in the world gazetteer.

Important: the check also catches the case where the **player** brings up the event ("I stole the sword, did you hear?") and the NPC confirms it. The NPC must reply that it does not know.

On violation: retry once with an extra system line "Your last reply mentioned something you do not know. Do not mention it." Still failing -> template fallback with `source:'template_fallback'` and `firewall: {passed:false, violations:[...]}` so the UI can show it.

### Template fallback

From `seed.templates`. Selection: if the NPC knows any events about the player, use `templates.aware[label]` (or `byNpc` variant); else use `greeting[label]` and, if the player's text looks like a question about the past (contains `?` or words like "heard", "know", "remember"), use `unknownTopic`. Pick deterministically from a list using a hash of `(npcId, conversationId, utterance count)` so the demo is repeatable.

## 5. Procedural memory: Tilda's haggling

`adaptPolicy {outcome}`:
```
lowballed: newMarkup = min(maxMarkup, markup + step); winInc = 0
fair:      newMarkup = max(minMarkup, markup - 0.02);  winInc = 1
```
Always increments `FOLLOWS.tries`. Returns before/after markup, tries, wins. When Tilda quotes a price in `say`, include in the system prompt: "Your opening price markup is {markup*100}%." Sequence for the demo: 3 lowballs -> markup 0.10 -> 0.25; her stated prices visibly rise. The UI shows the Policy node's `markup` changing.

## 6. Isolation guarantees (tests)

- Events recorded in `player:a` are invisible in `player:b` (Q50, Q42, Q90 return nothing).
- `resetPlayer(a)` restores `tick=0`, removes events, restores policy markup to the template value.
- `world_template` is never modified by any tool except `ensureWorld`.

## 7. Concurrency notes (for the load test)

- Reads (`recall`, `attitude`, `snapshot`) use `roQuery` and should scale with concurrent players.
- Writes to different player graphs are independent keys. Do not assume write throughput; **measure** and report. Do not claim numbers that were not measured.
- Do not share a mutable module-level state between requests other than the DB client.

## 8. Control NPC (`sayNaive`) — demo only

Purpose: make the value of the graph visible side by side. `sayNaive` is the "ordinary LLM NPC given the full log" baseline: same LLM wrapper, same persona, same player text, but **without** Hearsay's memory discipline. It is expected to leak.

Pipeline:
1. Resolve player and NPC (`UNKNOWN_*` as usual).
2. Q98: all events the player has done (regardless of who knows them).
3. Prompt: `You are {name}, {role} of Hollowbrook. {persona} Here is everything that has happened in town involving the traveller: {event sentences}. Reply in character in at most 50 words.` No JSON schema, no known/unknown split, no firewall.
4. Call `llm.generate`. If the LLM is off or fails: return a line from `templates.naive` with `source:'template_fallback'`.
5. Measure the leak, never block: run the firewall's keyword scan against the events this NPC does **not** know (Q50 gives the known set). `leaked = violations.length > 0`; `leakedEventTypes` = the types whose keywords/subject words appeared.
6. Do not write Utterances for `sayNaive` (it must not pollute Hearsay's conversation memory).

It is not registered in MCP and is only called by the UI's Compare view. If time is short it is the first SHOULD item to cut after the graph panel is done.
