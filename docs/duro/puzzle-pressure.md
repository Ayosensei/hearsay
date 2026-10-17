# Rumour puzzles: pressure, clues and a final reveal

New attempts use `puzzle_<mission>_<random>` graphs; existing `quest_*` saves
retain their one-action-per-turn rules. There are two AP per turn. A deed,
structured question, conversation or refused request spends one AP. Exhausting
the budget ends the turn and runs real gossip. Ending a turn early forfeits AP.
Inspecting or walking is free. Receipts in the graph reconstruct the budget after
reload; no local AP or outcome flag is authoritative.

Active puzzle responses omit KNOWS/TOLD links, recall items, provenance, exact
attitude scores, verdict receipts and query traces. Body-language labels and the
public TRUSTS network remain available. A structured question records a dated
note from the queried NPC's actual recall: eyewitness, immediate teller and
confidence, or not heard. It does not reveal the whole path. Notes never silently
refresh when gossip changes. The full graph and trace unlock at the verdict.

The new missions are Cover-up (stay above wary until turn 8), Redemption (Ayla
devoted before turn 10), Three Factions (mean attitude >=.2 in each faction at
turn 8), and Rumour Detective. Existing medicine, feud and watch objectives also
use the new rules when started afresh. A hostile Garrick who knows a serious
crime arrests the traveller. The existing trust-collapse rule still applies.

Detective creates a synthetic accusation in its own graph with a random actual
eyewitness, then uses `spread(maxHops:3)` to prepare the case without spending
investigation turns. The player identifies the witness, Garrick's exact route
and firsthand/secondhand/unheard status. One submission is graded by the real
`explain` tool, scored out of three, persisted and revealed. Gossip can change
the answer between turns. Detective is an investigation, so suspect attitudes
do not themselves arrest the investigator.

No LLM writes game state or queries. Ordinary dialogue remains the core `say`
pipeline; questions use existing structured recall, so template fallback does
not block evidence collection. All scenario writes remain existing recordEvent
calls, including zero-weight administrative receipts. No new core contract.

Limits: this is spoiler control in the game protocol, not anti-cheat security.
The generic developer tool endpoint remains available. Same-player commands
serialize in one service instance; multi-tool writes are not transactional.
Uncertain writes require inspecting the saved story; never retry automatically.
Framing another NPC and identifying deliberate NPC lies need an approved actor/
claim model; secondhand information is not evidence that someone is lying.
