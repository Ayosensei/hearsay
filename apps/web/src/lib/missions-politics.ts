import { missionChoice as c } from "./missions";
import type { MissionDefinition } from "./missions";

export const coverupMission: MissionDefinition = {
  id: "coverup", title: "Cover-up · The Inspector's Ledger", start: "brom", deadline: 8,
  objective: "Resolve the stolen sword case before the inspector arrives.",
  brief: "Brom saw you take his sword. Returning it, confessing, or manufacturing an alibi lead to different outcomes. Once the theft reaches Garrick, he gives you only until bell five to produce restitution or a credible account. Selling the sword closes the honest return route.",
  opening: "That sword was mine. Before you ask what I want, decide whether you're returning it or asking me to forget what I saw.",
  facts: [{ id: "sale-record", npc: "fenn", text: "Fenn records every fenced item. Selling the sword leaves a dated sale entry that can contradict an innocent alibi." }],
  choices: [
    c("return-sword", "brom", "“The sword is here. Take it back.”", "Returned, not erased. Repair the damaged rack and I'll send a truthful settlement to the guard.", { excludes: ["sell-sword"], type: "donated" }),
    c("repair-rack", "brom", "“Let me put the forge right.”", "The sword is back and the damage is repaired. I'll issue a settlement. Garrick has to hear it.", { needs: ["return-sword"], type: "helped", claim: { id: "sword-settled", text: "Brom confirms the sword was returned and the forge damage repaired." } }),
    c("confess", "garrick", "“I took the sword. Let me make restitution.”", "Return it and repair the damage. Bring Brom's confirmation; I can recommend service instead of arrest.", { excludes: ["alibi", "sell-sword"] }),
    c("confirm", "brom", "“Give me a signed settlement for Garrick.”", "Signed. Deliver it yourself if you cannot wait for gossip.", { needs: ["repair-rack", "confess"] }),
    c("service", "garrick", "“Here is Brom's settlement. I'll accept service.”", "The inspector will hear the truth. You keep your freedom, and owe the town honest work.", { needs: ["confess", "confirm"], hint: "Ends with accountability rather than a spotless reputation." }),
    c("sell-sword", "fenn", "“Move this sword before anyone asks.”", "I can sell it. But my sale ledger will remember what your story leaves out.", { excludes: ["return-sword", "confess"], fact: "sale-record", type: "traded" }),
    c("alibi", "mira", "“Say I was at the inn when the sword vanished.”", "I'll put my name to that account. If Garrick learns of a sale, he'll know which story cannot be true.", { excludes: ["confess", "return-sword"], type: "lied", claim: { id: "inn-alibi", text: "Mira claims the traveller stayed at the inn during the sword theft." }, hint: "A fabricated account must actually reach Garrick." }),
    c("bury-sale", "fenn", "“Keep the sale record out of the public account.”", "I'll keep quiet for now. The ledger still exists. This is concealment, not innocence.", { needs: ["sell-sword", "alibi"], hint: "Stops Fenn publishing the sale; it does not rewrite the ledger." }),
    c("inspection", "garrick", "“Hear the accounts and decide the case.”", "I'll compare what reached me. A retraction or an alibi must have a source I can name.", { any: ["repair-rack", "alibi"], hint: "Ends the mission only if Garrick received a qualifying account." }),
    c("escape", "silas", "“Take me out of town before the inspector.”", "I can get you away. The accusation stays behind you, unresolved.", { hint: "A distinct failure ending: escape is not clearing the case." }),
  ],
};

export const allianceMission: MissionDefinition = {
  id: "alliance", title: "Three Factions · Winter's Table", start: "rowan", deadline: 8,
  objective: "Get Rowan, Garrick and Marta to sign a winter pact before the convoy leaves.",
  brief: "The grain convoy leaves at bell eight. Rowan wants affordable food, Garrick wants a funded watch, and Marta wants trading security. Promise a guild monopoly and Rowan demands an exemption. Give the guard emergency powers and the merchants demand public oversight. Friendship opens a meeting; it does not substitute for signatures.",
  opening: "No pact, no grain convoy. We need the townsfolk, the guard and the merchants at one table. Don't promise all three the same purse.",
  facts: [{ id: "convoy", npc: "tilda", text: "The convoy charter permits shared storage and public oversight. A monopoly is an option, not a legal requirement." }],
  choices: [
    c("relief", "rowan", "“Reserve affordable grain for households.”", "That gives me a reason to talk. Don't sell the same grain to a monopoly without an exemption.", { excludes: ["monopoly"], type: "helped", claim: { id: "grain-relief", text: "The traveller pledged affordable grain for households." } }),
    c("watch-fund", "garrick", "“Fund a watch without emergency powers.”", "A smaller watch, accountable to the town. I can work with that.", { excludes: ["emergency"], type: "helped" }),
    c("emergency", "garrick", "“Take emergency control of the convoy.”", "You'll have guards. The merchants will want guarantees against arbitrary seizure.", { excludes: ["watch-fund"], type: "helped", claim: { id: "guard-control", text: "The traveller offered the guard emergency control of the convoy." } }),
    c("charter", "tilda", "“Read the convoy charter with me.”", "Shared storage is allowed. It takes a little more negotiation than selling exclusive rights.", { fact: "convoy" }),
    c("shared-store", "marta", "“Use shared storage, with published accounts.”", "A public ledger protects our stock. Show the others the same terms.", { needs: ["charter"], excludes: ["monopoly"], type: "helped" }),
    c("monopoly", "marta", "“Give the guild exclusive grain rights.”", "Then we can move quickly. Rowan's households will pay guild prices unless you secure an exemption.", { excludes: ["relief", "shared-store"], type: "helped", claim: { id: "guild-rights", text: "The traveller pledged exclusive grain rights to the merchants." } }),
    c("exemption", "rowan", "“Households get a protected ration under the guild deal.”", "Then my signature doesn't have to mean surrendering the winter food supply.", { needs: ["monopoly"], type: "helped" }),
    c("oversight", "marta", "“The guard's powers will face public review.”", "Put that in the pact. We can protect stock without giving the captain a blank cheque.", { needs: ["emergency"], type: "helped" }),
    c("sign-rowan", "rowan", "“Will you sign these household terms?”", "I sign for the households. Make sure the final pact matches what you promised.", { any: ["relief", "exemption"], trust: .2 }),
    c("sign-garrick", "garrick", "“Will you sign the watch commitment?”", "The guard signs. I'm relying on the terms in the public pact.", { any: ["watch-fund", "emergency"], trust: .2 }),
    c("sign-marta", "marta", "“Will the merchants sign?”", "The guild signs these terms. Bring all three signatures before the convoy leaves.", { any: ["shared-store", "monopoly"], trust: .2, hint: "Emergency guard powers require oversight first." }),
    c("ratify", "tilda", "“Publish the signed pact. Send the convoy.”", "The convoy will carry the pact you actually made—not three different promises.", { needs: ["sign-rowan", "sign-garrick", "sign-marta"], hint: "Ends the mission. The ending reflects whose terms won." }),
  ],
};

export const detectiveMission: MissionDefinition = {
  id: "detective", title: "Rumour Detective · A Borrowed Eyewitness", start: "garrick", deadline: 8,
  objective: "Separate the overlapping stories, verify the night records, and reconstruct the seal accusation.",
  brief: "A silver seal, missing packing and an unpaid bridge toll are being discussed together. A real witness started the seal account; another villager claims firsthand knowledge. Compare Fenn's register, Ayla's bell log and Tilda's dated copy before reconstructing the witness, route, account type and false eyewitness. Publicising preliminary findings creates a correction to resolve. One reconstruction before bell eight.",
  opening: "Somebody says they saw the seal taken. I need the route, not the loudest story. Fenn keeps a night register; it may rule out a false eyewitness.",
  facts: [],
  choices: [
    c("register", "fenn", "“Who could not have witnessed the theft?”", "I wrote down who was with me at the time. Compare that with anyone claiming they saw it firsthand.", { fact: "alibi", hint: "Reveals an independently stored alibi. It does not reveal the real witness." }),
    c("preserve", "garrick", "“Keep the original accusation on record.”", "The original route stays recorded. Later claims will be compared against it.", { hint: "Useful context, but the clock and gossip continue." }),
  ],
};
