# Location-based social scenarios

The web-owned scenario director composes the existing contract tools. No core,
Cypher, or shared-schema changes are needed. Three isolated player namespaces
(`quest_medicine_*`, `quest_feud_*`, `quest_watch_*`) select the scenario. Each
attempt has its own graph. Free-play A/B and the original sword race survive.

The server reloads graph facts before each choice, checks proximity and
prerequisites, computes all nearby witnesses, records an ordinary event, then
advances one gossip tick. Fixed event subjects identify completed choices;
items are derived from these receipts rather than client inventory flags.
Each choice can be done once. Invalid/remote/repeated choices write no event.
Walking and reading are free. Wait advances one tick; verdict commits the
remaining ticks. Full gossip rounds still run automatically after each choice.

Garrick’s trust is `(attitude.score + 1) * 50`: 50 is neutral, not a confidence
percentage. Trust <=20 ends the scenario immediately, before recency softens
the score. A final zero-weight traded event records Garrick’s scenario verdict
in the existing Event/KNOWS graph so a result survives reload. These adjudication
receipts are not LLM decisions and do not change attitudes or spread as gossip.

Medicine: deliver medicine through paid, charity or theft routes; trust >=40
at turn 6. Feud: repair the bridge, get Rowan and Marta friendly, and ensure both
know the actual repair at turn 7. Watch: obtain tools and repair with Oren,
who must know the survey or briefing; Garrick must know a warning or repair and
have trust >=60 at turn 7. Meeting objectives early does not bypass later news.

NPC reactions are deterministic, graph-gated decisions: Ayla offers charity
only when friendly, Brom lends tools only when friendly, and Oren requires
knowledge. Gemini still only writes dialogue from the existing firewall prompt.
The original opinion formula, gossip rules and seed traits stay intact.

Same-player scenario commands serialize inside one director instance. Existing
tool writes/refreshes/gossip are not transactional; errors do not auto-retry.
Inspect the saved story after an uncertain write. This demo does not claim
distributed locking or tamper-proof multiplayer; the generic tool API remains
available for developers. Production scenario authority across instances would
need an approved core idempotency/transaction contract, not ad hoc Cypher here.

Verification: 149 workspace tests pass (including six real-FalkorDB scenario
tests), typecheck and design guard pass, and production build succeeds. The
existing seed-loader filesystem tracing warning remains. Live browser play
verified charity locked before helping Ayla, the unlocked medicine receipt,
delivery at Lysa’s home, gossip after every choice, a turn-6 win and restoration
in a second browser tab. Screenshots: scenario-town.png and
scenario-medicine-win.png in screens/. DESIGN.md lint has zero errors/warnings;
on Windows its npm script shell must be Git Bash to execute the .md-named bin.
