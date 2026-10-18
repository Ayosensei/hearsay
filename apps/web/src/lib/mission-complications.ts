import { missionChoice as c } from "./missions";
import type { MissionChoice, MissionDefinition, MissionId } from "./missions";

const gates: Partial<Record<MissionId, Record<string, NonNullable<MissionChoice["needsWhen"]>>>> = {
  medicine: {
    buy: [{ when: ["reserve-dose"], needs: ["release-reservation"], hint: "Marta needs the reservation reconciled with Elin's patient list." }],
    release: [{ when: ["reserve-dose"], needs: ["release-reservation"], hint: "The emergency order does not clear the duplicate reservation. Ask Elin, then Marta." }],
  },
  coverup: {
    service: [{ when: ["public-inventory"], needs: ["correct-inventory"], hint: "Resolve the public inventory account with Mira and Garrick first." }],
    inspection: [{ when: ["public-inventory"], needs: ["correct-inventory"], hint: "The public inventory account still contradicts the settlement." }],
  },
  redemption: {
    "return-fund": [{ when: ["audit-purse"], needs: ["verify-purse"], hint: "You opened an audit. Elin needs Fenn's package record before accepting the count." }],
    blessing: [{ when: ["delegate-vigil"], needs: ["confirm-rota"], hint: "You promised a volunteer rota. Get Rowan's confirmation before asking Ayla." }],
  },
  alliance: {
    "sign-garrick": [{ when: ["bonded-watch"], needs: ["bond-receipt"], hint: "The bonded watch needs Tilda's authorisation and Fenn's collateral receipt." }],
    ratify: [{ when: ["priority-home", "priority-guild"], needs: ["publish-terms"], hint: "Two first-priority promises cannot share one convoy. Publish reconciled terms first." }],
  },
};

const extra: Record<MissionId, MissionChoice[]> = {
  watch: [
    c("waterline", "silas", "“Let's check the water pressure first.”", "A sensible check. The high-water mark is older than this storm; Oren must compare it with the hinge reading before we use it.", { excludes: ["survey"], type: "helped" }),
    c("compare-level", "oren", "“Let's compare the pressure and hinge readings.”", "The old mark exaggerated the pressure. The gate is jammed. This corrected survey is enough for the repair plan; bring Brom's kit.", { needs: ["waterline"], grants: ["survey"], showAfter: ["waterline"] }),
    c("check-cart", "fenn", "“Let's check what the delivery cart carried.”", "Packing crates, not repair timber. I can identify the cart, but that won't tell Oren how to brace the hinge.", { needs: ["waterline"], showAfter: ["waterline"] }),
  ],
  medicine: [
    c("reserve-dose", "marta", "“Put a vial aside while I check the patient list.”", "Reserved under Lysa's household. Elin's list already requests a clinic dose for that household. Ask her to reconcile it before I release this vial.", { excludes: ["buy", "release", "borrow-dose", "steal-dose"], claim: { id: "double-dose", text: "Marta's reservation and the clinic list both name Lysa's household; the traveller is checking the apparent duplicate." } }),
    c("patient-list", "elin", "“Does the clinic entry reserve another vial?”", "No. It records a request, not medicine supplied. Take that distinction back to Marta; the two entries refer to one sick patient.", { needs: ["reserve-dose"], showAfter: ["reserve-dose"], fact: "patient-entries" }),
    c("release-reservation", "marta", "“Match the request to my reservation.”", "One request, one reservation. The hold is clear. We still need earnings or the guard's release order.", { needs: ["patient-list"], showAfter: ["reserve-dose"] }),
    c("ask-delivery", "tilda", "“Can the next shipment cover the patient list?”", "The shipment is tomorrow. A sensible supply plan, but it will not treat today's fever. Elin can clarify the current request.", { needs: ["reserve-dose"], showAfter: ["reserve-dose"] }),
  ],
  coverup: [
    c("public-inventory", "brom", "“Let's record the sword's return publicly.”", "I'll post that the missing sword is being reconciled. Mira is already calling it an inventory misunderstanding. Check her wording before the guard treats that as your account.", { excludes: ["sell-sword", "return-sword"], grants: ["return-sword"], type: "donated", claim: { id: "inventory-account", text: "A forge inventory notice says the sword's disappearance is being reconciled; some readers call it an inventory error." } }),
    c("check-notice", "mira", "“What exactly did the inventory notice say?”", "I called it an inventory mistake. Brom only confirmed a return. Garrick needs that distinction in the record.", { needs: ["public-inventory"], showAfter: ["public-inventory"], fact: "notice-wording" }),
    c("correct-inventory", "garrick", "“Keep the return and the explanation separate.”", "Correction recorded: returned property does not establish an innocent removal. Bring the repaired-rack settlement and we can close this honestly.", { needs: ["check-notice"], showAfter: ["public-inventory"], claim: { id: "inventory-correction", text: "Garrick records that the returned sword was not proof of an inventory error.", parent: "inventory-account" } }),
    c("ask-insurance", "tilda", "“Could a stock certificate settle the missing item?”", "It can confirm the forge's stock value, not who removed the sword. Mira can tell you why people are calling it a stock error.", { needs: ["public-inventory"], showAfter: ["public-inventory"] }),
  ],
  redemption: [
    c("audit-purse", "julian", "“Let's check the purse before I carry it back.”", "A careful choice. The wrapping seal differs from Elin's ledger. Fenn packed it; ask him whether this is a new package or missing money.", { needs: ["ledger"], excludes: ["recover"], grants: ["recover"] }),
    c("packing-record", "fenn", "“Which wrapping did the chapel purse leave in?”", "I replaced a torn wrapper, not its contents. Elin can compare this packing receipt with her count.", { needs: ["audit-purse"], showAfter: ["audit-purse"], fact: "purse-wrapper" }),
    c("verify-purse", "elin", "“Compare the packing receipt with the ledger.”", "The contents match. You can return the fund without implying Julian stole from it.", { needs: ["packing-record"], showAfter: ["audit-purse"] }),
    c("delegate-vigil", "ayla", "“I'll organise people to cover the vigil.”", "Then it is your responsibility to make sure they arrive. Mira knows the volunteers; Rowan can confirm who actually attends.", { needs: ["admit"], excludes: ["vigil"], grants: ["vigil"], type: "helped", claim: { id: "volunteer-promise", text: "The traveller promised volunteers for Ayla's vigil; names have not yet been confirmed." } }),
    c("find-volunteers", "mira", "“Who agreed to the chapel rota?”", "Some agreed to bring food, not stay overnight. Rowan can distinguish the helpers from the people taking a shift.", { needs: ["delegate-vigil"], showAfter: ["delegate-vigil"] }),
    c("confirm-rota", "rowan", "“Confirm who is covering the overnight shifts.”", "The shifts are covered. Ayla can rely on the promise now, rather than a list of people who meant well.", { needs: ["find-volunteers"], showAfter: ["delegate-vigil"], type: "helped", claim: { id: "volunteer-confirmed", text: "Rowan confirms the traveller's chapel volunteers are covering the overnight rota.", parent: "volunteer-promise" } }),
  ],
  alliance: [
    c("priority-home", "rowan", "“I'll guarantee households the first release.”", "Put first release in the final terms. Affordable prices do not mean much if the grain is already allocated elsewhere.", { needs: ["relief"], claim: { id: "home-priority", text: "The traveller promised households first release of the winter grain." } }),
    c("priority-guild", "marta", "“I'll guarantee traders the first release.”", "Then my carts move first. Make sure your household commitments allow that; the same sacks cannot leave twice.", { any: ["shared-store", "monopoly"], claim: { id: "guild-priority", text: "The traveller promised traders first release of the winter grain." } }),
    c("compare-terms", "tilda", "“Read both release promises against the charter.”", "Both are plausible separately. Together they promise the same grain twice. Rowan must accept a protected first ration, and Marta the release of the remainder.", { needs: ["priority-home", "priority-guild"], showAfter: ["priority-home", "priority-guild"], fact: "release-order" }),
    c("home-ration", "rowan", "“Protect a household ration; release the remainder.”", "I accept a defined first ration instead of every household order going first. Get the guild to accept the same wording.", { needs: ["compare-terms"], showAfter: ["compare-terms"] }),
    c("publish-terms", "marta", "“Use the same ration-and-remainder terms.”", "Agreed. Publish this correction with all three signatures. The original promises remain in the account history.", { needs: ["home-ration"], showAfter: ["compare-terms"], claim: { id: "release-correction", text: "The pact protects a household ration first and releases the remainder through the guild.", parent: "guild-priority" } }),
    c("bonded-watch", "garrick", "“Secure the watch through a bonded guarantee.”", "That can protect the convoy without new powers. Tilda must authorise the bond and Fenn must record the collateral before I sign.", { excludes: ["watch-fund", "emergency"], grants: ["watch-fund"], type: "helped" }),
    c("authorise-bond", "tilda", "“Authorise the convoy watch bond.”", "Authorised against recorded collateral, not a promise of future stock. Fenn holds the receipt.", { needs: ["bonded-watch"], showAfter: ["bonded-watch"] }),
    c("bond-receipt", "fenn", "“Record the collateral against Tilda's bond.”", "The guarantee is funded. Garrick can sign without relying on an unbacked promise.", { needs: ["authorise-bond"], showAfter: ["bonded-watch"] }),
  ],
  detective: [
    c("bell-log", "ayla", "“Compare the night entry with the chapel bell.”", "Fenn's page uses the old watch clock. The chapel bell anchors the time. Tilda copied the original entry before the accusation spread.", { needs: ["register"], showAfter: ["register"], fact: "chapel-time" }),
    c("copy-check", "tilda", "“Compare the copied entry with the original.”", "My copy predates the seal accusation. It is a time record, not the later story about a cart or the bridge toll. Take both records back to Fenn.", { needs: ["bell-log"], showAfter: ["register"], fact: "register-copy" }),
    c("verify-register", "fenn", "“Reconcile the bell, the copy and your entry.”", "Together they place the person in my entry with me when the seal was taken. A later firsthand claim from that person cannot be true.", { needs: ["copy-check"], showAfter: ["register"] }),
    c("square-account", "mira", "“Tell me which missing item people were discussing.”", "A cartload of packing, a bridge payment and a silver seal. People are repeating all three. The cart story does not identify the seal eyewitness.", { fact: "square-stories" }),
    c("cart-account", "silas", "“Check the missing-cart account against the seal.”", "I saw packing at a drain, not a seal taken. Someone hearing both stories could mix the witnesses. Ask for the source of the seal accusation specifically.", { needs: ["square-account"], showAfter: ["square-account"] }),
    c("publish-preliminary", "garrick", "“Put the current accounts before the town.”", "Posted as preliminary. Mira has repeated the cart witness alongside the seal accusation. Before a verdict, correct the wording and have Tilda attach the original records.", { claim: { id: "preliminary-case", text: "The traveller published preliminary seal, cart and payment accounts before reconciling their witnesses." } }),
    c("correct-preliminary", "mira", "“Separate the cart witness from the seal witness.”", "Correction issued. Tilda must attach the dated records so the correction is more than another competing account.", { needs: ["publish-preliminary", "cart-account"], showAfter: ["publish-preliminary"], claim: { id: "case-correction", text: "Mira clarifies that the cart witness is not proof of who witnessed the missing seal.", parent: "preliminary-case" } }),
    c("attach-records", "tilda", "“Attach the dated records to the correction.”", "The correction and its evidence are filed together. You can submit a reconstruction based on sources rather than the loudest combined story.", { needs: ["correct-preliminary", "verify-register"], showAfter: ["publish-preliminary"] }),
  ],
};

const facts: Partial<Record<MissionId, MissionDefinition["facts"]>> = {
  medicine: [{ id: "patient-entries", npc: "elin", text: "The clinic entry is an unfilled request. Marta's reservation is the same patient's prospective supply, not a second delivered dose." }],
  coverup: [{ id: "notice-wording", npc: "mira", text: "Brom's notice confirms return of the sword. The phrase 'inventory error' was Mira's interpretation, not Brom's eyewitness evidence." }],
  redemption: [{ id: "purse-wrapper", npc: "fenn", text: "Fenn replaced the purse's torn wrapping. The recorded contents did not change." }],
  alliance: [{ id: "release-order", npc: "tilda", text: "One convoy cannot satisfy two unconditional first-release promises. The charter permits a protected ration before general merchant release." }],
  detective: [
    { id: "chapel-time", npc: "ayla", text: "The chapel bell and old watch clock differ. Comparing the bell to the original night entry establishes the seal theft's time window." },
    { id: "register-copy", npc: "tilda", text: "Tilda's dated copy predates the accusation and matches Fenn's entry. Later cart and bridge stories were not present in that original record." },
    { id: "square-stories", npc: "mira", text: "Three public stories overlap: missing packing, an unpaid bridge toll, and a silver seal. Their eyewitnesses and accounts are separate." },
  ],
};

export function complicateMission(definition: MissionDefinition): MissionDefinition {
  const choices = definition.choices.map((choice): MissionChoice => ({ ...choice, needsWhen: [...(choice.needsWhen ?? []), ...(gates[definition.id]?.[choice.key] ?? [])] }));
  if (definition.id === "watch") {
    const survey = choices.find((choice) => choice.key === "survey");
    if (survey) survey.label = "“Let's check the gate mechanism first.”";
  }
  return { ...definition, choices: [...choices, ...extra[definition.id]], facts: [...definition.facts, ...(facts[definition.id] ?? [])] };
}
