# Six stories with consequences

Start a fresh mission from the mission title badge → **Other stories** (or the scenario menu). New attempts use `story_<mission>_<id>` saves. Existing `quest_` and `puzzle_` saves keep their previous rules.

Every story has two AP per turn. A deed, a source question, or a refused trust-gated request spends one AP. Two actions advance the town and gossip; waiting forfeits remaining AP. Walking is free. The attempt ends at its turn limit or elapsed real-time limit, whichever arrives first. Conversations, reloads and hidden tabs do not pause the clock. Server time catches up on the next inspection.

| Story | Objective and dilemma | Possible consequences |
| --- | --- | --- |
| Missing Medicine: The Last Dose | Treat Lysa, then settle the dispute with Garrick within six bells/minutes. Earn and buy, obtain an emergency release, borrow Fenn's reserved dose, or steal and repay. | A clean rescue, a public bill, restitution for theft, or leaving another patient's bed without medicine. Gather herbs and brew a replacement to repair the borrowed-dose cost. |
| Night Watch: The Breaking Water | Secure the gate or evacuate Riverside within eight bells/minutes. Engineering must finish before bell five. Obtain trusted tools, consult Oren, fit a brace, allow a settling turn, seal, return the tools, and report. | Repair the gate, sacrifice market stalls through diversion and warn Marta, or lose the homes while rescuing residents by boat. Evacuation remains a fallback after an unfinished brace. Investigate the dumping cart without claiming it proves who ordered it. |
| Cover-up: The Inspector's Ledger | Resolve a witnessed theft before the inspector at bell eight. Once Garrick hears, his summons expires at bell five. | Confession, a repaired rack, Brom's confirmation and service can earn accountable freedom. A fabricated inn alibi must actually spread to Garrick. Selling the sword creates a later account unless suppressed. Escape abandons the objective. |
| Redemption: A Promise Kept | Admit a broken pledge and earn Ayla's actual devotion before bell eight. | Recover and return the missing relief fund, or keep a dangerous rescue promise. Private service builds trust; public applause closes that route. Ayla must know a kept promise before blessing it. Favours cannot be repeated to farm reputation. |
| Three Factions: Winter's Table | Secure three leaders' friendship and signatures, then ratify before the convoy leaves at bell eight. | A shared store and funded watch support common terms. A monopoly requires protection for Rowan's people. Emergency guard powers require merchant oversight. Different signed bargains produce different pacts. |
| Rumour Detective: A Borrowed Eyewitness | Identify the real witness, exact route to Garrick, Garrick's type of account, and the false eyewitness before bell eight. | One submission, four independently scored answers. Statements cost AP and are dated. A certain-sounding firsthand claim can be false; Fenn's private night register can contradict it. Witness and liar vary across attempts. |

## Graph behavior

Nearby villagers witness player deeds automatically. Core FalkorDB events, KNOWS edges, directed TRUSTS links, attitude calculations and explain paths remain the source of reputation and provenance. Story accounts additionally retain each teller, confidence, learned turn and parent account in claim nodes. They propagate one hop per turn using actual directed trust; private evidence does not spread. Authored NPC reactions trigger from time, decisions, or actual knowledge.

During an attempt, exact knowledge, scores, witness identities and paths are hidden. The public trust network stays visible. At the ending, the full event graph, case reconstruction and account history unlock. Authored story replies are deterministic; an LLM does not choose outcomes or grade the detective case.

When a turn advances, a visible gossip wave now shows luminous trails and travelling particles over the town. Its handoff total combines actual core gossip steps and newly learned public claim accounts, deduplicated by listener and account. A quiet turn reports zero rather than suggesting a transmission occurred. The trails are an activity illustration, not a revealed route: hidden identities remain hidden until the ending. The effect lasts briefly, does not interrupt controls or move the camera, and uses a static cue with reduced motion. Reloading does not replay an old turn's effect.

Mission state, decisions, AP, deadline and dialogue persist in each player's graph. A process-local queue serializes a player's commands. These multi-step writes are not a distributed transaction; concurrent requests across multiple server workers need a shared lock or transaction strategy before production scaling.

## Verification

`src/lib/__tests__/missions.test.ts` exercises all six directors against FalkorDB, including alternative medicine endings, exclusive choices, actual trust refusals, settling time, return obligations, graph-delivered alibis, the early summons deadline, devotion, pact variants, private evidence, four-part reconstruction, persistence and real-time expiration. Existing scenario tests cover compatibility with older saves.
