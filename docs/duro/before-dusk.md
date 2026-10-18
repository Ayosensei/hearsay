# Family Feud: Before Dusk

The new `puzzle_crossing_*` scenario replaces Family Feud in the picker. Existing
`quest_feud_*` and `puzzle_feud_*` saves retain their old rules.

The objective is to escort Lysa to the chapel. General friendship is not a win
condition. Six gossip turns or six elapsed minutes end the attempt, whichever
comes first. Every two paid actions advance one turn; waiting forfeits unused AP.
The absolute deadline is saved in FalkorDB, survives reload/restart, and continues
through conversations and hidden tabs. The browser catches up through inspect;
the server also checks elapsed time before accepting any action.

## Decisions and endings

- Pay Marta with your travel purse, then escort Lysa. The original debt remains unresolved.
- Build Oren's alternative crossing, wait a turn, ask Silas to launch, then escort
  Lysa. It cannot be launched at or after turn 5. Paid passage is closed once this
  route is chosen. Marta may issue a distorted timber-theft accusation.
- Earn Elin's trust and hear her testimony, or press Rowan for an admission.
  Confront Garrick for the ledger. Expose it to Marta and wait for public
  verification, or make a faster private bargain. These are exclusive endings.
- Public defence of Rowan causes Marta to withdraw paid passage only once her
  actual graph memory contains that event. Proof can still change her position.
- Finding the receipt without escorting Lysa produces “The truth arrived too late.”
  Running out of time without the evidence produces “Dusk at a closed bridge.”

## Graph behaviour

Core recordEvent, gossip and attitude still handle player actions, nearby
witnesses and fading favours. Existing directed TRUSTS weights remain asymmetric.
The story director owns authored choices and NPC reactions; these are scripted
rules triggered by state and knowledge, not unconstrained AI agents.

Scenario-specific `FeudClaim` nodes and `CLAIM_KNOWS` edges distinguish accounts
from facts. The original crossing account remains when Marta issues her biased
version. `parent` records the source account; each knowledge edge retains teller,
confidence and learned turn. One-hop candidates come from actual TRUSTS queries,
with confidence multiplied by trust and .98, stopping below .25. First qualifying
receipt wins. Private payment/ledger facts do not gossip automatically.

Q110–Q116 persist the scenario and claims. Q90 excludes scenario-only labels from
the generic snapshot, preventing unknown-kind failures and keeping private facts
out of the generic dialogue prompt. After the ending, the brief reveals the
stored claim/source rows; the normal graph and trace reveal actual player events.
This is one authored distortion for this dilemma, not a general procedural lie
generator. Crossing uses authored chat replies; other modes retain Gemini dialogue.

## Interface and validation

Compact conversation bubbles with reply buttons replace large location cards in
this story. Replies remain open after choosing. The AP meter uses two illuminated
bars, a numeric counter, a dusk countdown, and the current turn. NPC interruptions
appear in town; the transcript and consequences live in the objective panel.
Other puzzle modes also receive the AP meter and compact character popup.

Seven real FalkorDB tests cover metadata isolation, exclusive routes, paid passage,
Elin's knowledge/trust gate, delayed verification, gossip-driven confrontation,
separate claim propagation and a restart with an expired deadline. The full suite
passes 165 tests. Visual fixtures are under “A living dilemma” on /styleguide.

Commands serialize per player in one service instance. Multiple core-tool and
story writes are not a single transaction; this remains a single-server demo.
No new dependency or shared contract schema was introduced.
