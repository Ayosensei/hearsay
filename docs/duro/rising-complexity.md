# Rising campaign complexity

The campaign now adds plausible, longer routes rather than treating every non-optimal choice as an immediately wrong action. Every new reply costs the existing one AP. Walking remains free; deadlines and exclusive major routes retain their normal rules. Most levels retain a short viable route. Optional caution, mediation or public commitments can add obligations which must be resolved before the relevant final action. The final detective level always requires corroboration.

| Level | Added decision and consequence |
| --- | --- |
| Night Watch | Inspect the gate mechanism or measure pressure first. The older waterline needs Oren's comparison before it becomes a usable survey. Checking the delivery cart is credible investigation but does not repair a hinge. |
| Missing Medicine | Reserve a dose while checking the clinic list. A request and a reservation look like two supplies until Elin explains the duplicate and Marta clears the hold. Tomorrow's delivery is useful planning but cannot treat today's fever. |
| Family Feud | Ask Elin to mediate before settling the toll. Rowan must name his payee, Marta must give her terms, and Elin must reconcile both accounts. Mediation costs time without making either person a liar. |
| Cover-up | Publicly record the sword's return. Mira's interpretation turns a returned item into an inventory-error account. Check her wording and correct the guard's record before closing the case. The correction retains its parent account. |
| Redemption | Audit the recovered purse and reconcile its changed wrapper with Fenn and Elin. Alternatively, organise a vigil instead of taking it personally: Mira distinguishes food donors from overnight volunteers, and Rowan confirms attendance. Both are reasonable approaches with extra accountability. |
| Three Factions | A bonded watch needs authorisation and collateral. Separate first-release guarantees to households and merchants conflict, even though each sounds helpful. Tilda compares terms, Rowan accepts a ration, and Marta publishes the matching remainder agreement before ratification. |
| Rumour Detective | Three independent public accounts spread through directed trust. Source questions distinguish the seal accusation from other circulating accounts. The old watch-clock entry must be compared to the chapel bell and a dated copy, then reconciled with Fenn. Publishing preliminary combined accounts adds a correction and attached-evidence chain. |

`mission-complications.ts` decorates the existing mission definitions with choices, private evidence and conditional obligations. Granted progress allows a longer alternative to satisfy the original preparation requirement; it does not synthesize a missing eyewitness event. The actual alternate action is recorded in FalkorDB. Prerequisites are checked by the same function in chat and on the server. The detective verdict has an additional server gate mirrored in the notebook.

NPC interruptions require the relevant public account to have actually reached that NPC. Private evidence stays private. Public corrections retain parent links and do not delete the original account. All required follow-ups are stated after the commitment in the NPC reply, with contextual locked-action explanations. The implementation uses authored branching stories, not arbitrary generated objectives or fabricated graph paths.
