import { missionChoice as c } from "./missions";
import type { MissionDefinition } from "./missions";

export const medicineMission: MissionDefinition = {
  id: "medicine", title: "Missing Medicine · The Last Dose", start: "lysa", deadline: 6,
  objective: "Treat Lysa and settle the medicine dispute before the sixth bell.",
  brief: "Lysa's fever is rising. Marta has a vial for sale; Ayla's only free dose is reserved for Fenn. You have one purse, and the guard will hear about any theft. Saving Lysa is urgent. Deciding who pays is yours.",
  opening: "I can't stop shaking. Please find medicine. Don't let everyone spend the daylight arguing about the price.",
  facts: [{ id: "fever", npc: "elin", text: "Elin's examination confirms Lysa needs treatment today. This is a medical emergency, not a merchant's favour." }, { id: "herbs", npc: "silas", text: "Silas knows a river herb Ayla can prepare as a replacement dose. Gathering and brewing take separate actions." }],
  choices: [
    c("examine", "elin", "“Write down how ill Lysa is.”", "Take my signed examination to Garrick if you need an emergency release.", { fact: "fever" }),
    c("wages", "brom", "“I'll work for the price of a vial.”", "You've earned a vial's price. Spend it at Marta's stall.", { type: "helped", hint: "Honest work costs time; your purse can fund only one solution." }),
    c("buy", "marta", "“Here's my earnings. Give me the vial.”", "Paid in full. The vial is yours, and no one owes me an explanation.", { needs: ["wages"], excludes: ["borrow-dose", "steal-dose", "release"], hint: "A clean purchase. Closes the other supply routes." }),
    c("clinic", "ayla", "“Let me help at the clinic.”", "Thank you. I can lend you Fenn's reserved dose—but only if you accept what that means.", { type: "helped" }),
    c("borrow-dose", "ayla", "“Give Lysa Fenn's reserved dose.”", "Take it. Fenn will need a replacement before the sixth bell. You haven't saved both of them yet.", { needs: ["clinic"], excludes: ["buy", "steal-dose", "release"], hint: "Fast, but transfers the shortage to Fenn." }),
    c("steal-dose", "marta", "“I'll take the vial. Stop me if you must.”", "Thief! I'll send word to Garrick. Your good intentions won't erase what I saw.", { type: "stole", excludes: ["buy", "borrow-dose", "release"], claim: { id: "vial-theft", text: "The traveller stole a vial from Marta." }, hint: "Everyone nearby sees it. Gossip can trigger a summons." }),
    c("permit", "garrick", "“Read Elin's examination. Authorise a release.”", "This is an emergency. Show Marta this order. The town will pay her later.", { needs: ["examine"], excludes: ["steal-dose"], hint: "Legal access, but the debt falls on the town." }),
    c("release", "marta", "“The guard has authorised emergency medicine.”", "I obey the order. Remember that an unpaid bill is still a bill.", { needs: ["permit"], excludes: ["buy", "borrow-dose", "steal-dose"] }),
    c("deliver", "lysa", "“Here. Take the medicine.”", "The fever is easing. Thank you. Please settle this before the guard decides what happened.", { type: "saved", any: ["buy", "borrow-dose", "steal-dose", "release"], hint: "Treatment is the main objective; the dispute still needs closing." }),
    c("gather", "silas", "“Help me find a replacement for Fenn.”", "These river herbs will work if Ayla prepares them. Go to the chapel.", { needs: ["borrow-dose"], fact: "herbs" }),
    c("brew", "ayla", "“Prepare these herbs for Fenn.”", "Fenn has his replacement. You didn't leave him behind.", { needs: ["gather"], type: "saved" }),
    c("fine", "garrick", "“I took it. Use my earnings to repay Marta.”", "Restitution recorded. Treat Lysa, then report back. I won't call this an honest purchase.", { needs: ["steal-dose", "wages"], type: "donated" }),
    c("close", "garrick", "“Lysa is treated. Settle the case.”", "I'll judge what was done, who was left waiting, and who paid for it.", { needs: ["deliver"], hint: "Ends the mission. A theft needs restitution; Fenn's borrowed dose needs replacing for the best ending." }),
  ],
};

export const watchMission: MissionDefinition = {
  id: "watch", title: "Night Watch · The Breaking Water", start: "silas", deadline: 8,
  objective: "Secure the floodgate or evacuate Riverside before the storm breaks.",
  brief: "The gate is cracking. Repairing it needs tools, an engineer and time for the work to settle. Opening the relief channel is faster, but floods the market. Evacuation saves people while sacrificing their homes. Decide before the fifth bell makes engineering impossible.",
  opening: "Hear that knocking under the water? The gate won't last. Repair, divert, or get people out. Pick a route before the river picks for you.",
  facts: [{ id: "damage", npc: "silas", text: "Silas's survey finds a jammed gate and a blocked relief channel. Someone dumped market packing into the drain." }, { id: "dumping", npc: "fenn", text: "Fenn saw Tilda's hired cart leave packing at the drain. He can identify the cart; he did not see an order from Marta." }],
  choices: [
    c("survey", "silas", "“Show me exactly where it's failing.”", "Take this survey to Oren. If you want the cause, Fenn was here before the rain.", { fact: "damage", type: "helped" }),
    c("tool-work", "brom", "“I'll help if you'll lend the repair kit.”", "Earned your keep. Ask for the kit; I won't lend tools to a stranger.", { type: "helped" }),
    c("tools", "brom", "“Lend me the floodgate repair kit.”", "Bring it back after the work. Oren will know how to use it.", { needs: ["survey"], trust: .2 }),
    c("brief", "oren", "“Study Silas's survey with me.”", "I can fit the brace. Start before bell five; the work needs a whole turn to settle.", { needs: ["survey"] }),
    c("brace", "silas", "“Fit Oren's brace. We're repairing the gate.”", "The brace is fitted. Give it a turn before you seal the gate.", { needs: ["tools", "brief"], excludes: ["divert", "evacuate"], type: "helped", before: 5 }),
    c("seal", "silas", "“Seal the repaired gate.”", "It's holding. The kit still needs returning, and the guard needs the final report.", { needs: ["brace-ready"], type: "saved", before: 5 }),
    c("divert", "silas", "“Open the relief channel. Sacrifice the market.”", "The homes will stay dry. Marta's stock won't. Go warn the people losing their stalls.", { needs: ["survey"], excludes: ["brace", "evacuate"], before: 5, claim: { id: "market-sacrifice", text: "The traveller opened a channel that flooded the market to protect homes." } }),
    c("warn-market", "marta", "“Your stock is in danger. Move it now.”", "I'll move what I can. You chose our losses. At least you told us.", { needs: ["divert"], type: "helped" }),
    c("evacuate", "ayla", "“Open the chapel. We must leave Riverside.”", "I'll take the vulnerable. Silas must bring the last residents by boat.", { excludes: ["seal", "divert"], type: "helped" }),
    c("boats", "silas", "“Bring the remaining residents to the chapel.”", "The last boat is in. The houses are lost, but their people are here.", { needs: ["evacuate"], type: "saved" }),
    c("return-tools", "brom", "“Your kit is back, intact.”", "Good. Borrowing wasn't just another name for taking.", { needs: ["tools"] }),
    c("cause", "fenn", "“Who was at the blocked drain?”", "That's the extent of what I saw. Don't turn a cart into a conspiracy without evidence.", { needs: ["survey"], fact: "dumping" }),
    c("report", "garrick", "“Record what we saved, and what we lost.”", "The night watch will record your decision. Evidence about the blockage changes who answers for it.", { any: ["seal", "warn-market", "boats"], hint: "Ends the mission. Repairs require the borrowed kit back." }),
  ],
};

export const redemptionMission: MissionDefinition = {
  id: "redemption", title: "Redemption · A Promise Kept", start: "ayla", deadline: 8,
  objective: "Keep a difficult promise and earn Ayla's devotion before the chapel closes.",
  brief: "You promised the chapel money and never brought it. Ayla needs more than a performance. Recover the missing relief fund or save Fenn on the river road. A public donation can buy applause; private service can earn trust. Let the truth reach her before asking forgiveness.",
  opening: "I remember your promise. I need someone who does the work when no one is watching. Show me one reason to believe you again.",
  facts: [{ id: "fund", npc: "elin", text: "Elin's relief ledger identifies the unclaimed chapel purse at Julian's lodging. Returning it will not make the earlier broken promise disappear." }],
  choices: [
    c("admit", "ayla", "“I broke my promise. No excuses.”", "Then don't replace it with another easy promise. Stay useful.", { hint: "Opens honest service. An admission alone earns no devotion." }),
    c("vigil", "ayla", "“I'll take the night vigil.”", "You stayed when the room went quiet. That matters.", { needs: ["admit"], type: "helped" }),
    c("ledger", "elin", "“Help me trace the relief fund.”", "Julian kept the unclaimed purse. Ask for the ledger entry, not a favour.", { fact: "fund" }),
    c("recover", "julian", "“Elin's ledger names this purse. Return it.”", "I held it for collection. Take it straight to the chapel.", { needs: ["ledger"] }),
    c("return-fund", "ayla", "“The relief fund is here. Count it.”", "The purse is complete. You kept this promise; the earlier one still happened.", { needs: ["recover"], excludes: ["public-gift"], type: "saved" }),
    c("public-gift", "mira", "“Tell everyone about my chapel donation.”", "I can make sure the town hears. Whether Ayla calls it redemption is her decision.", { excludes: ["return-fund", "quiet-service"], type: "donated", claim: { id: "public-charity", text: "The traveller is publicising a large chapel donation." }, hint: "Applause is not proof of a difficult promise kept." }),
    c("quiet-service", "ayla", "“No announcement. Put me to work.”", "Then help me prepare Fenn's medicine. He has been waiting on the river road.", { needs: ["admit"], excludes: ["public-gift"], type: "donated" }),
    c("pack", "ayla", "“Prepare a medicine pack for Fenn.”", "Bring him home, or make sure he receives it. Don't just tell me you tried.", { needs: ["admit"] }),
    c("rescue", "fenn", "“Take this medicine. Let's get you somewhere safe.”", "You found me. I'll tell Ayla what you did—when the news reaches her.", { needs: ["pack"], type: "saved", claim: { id: "fenn-rescue", text: "The traveller treated Fenn on the river road." } }),
    c("second-shift", "ayla", "“I'll cover another shift while we wait.”", "You keep showing up. I notice the difference between a story and a habit.", { needs: ["vigil"], type: "helped" }),
    c("blessing", "ayla", "“Have I earned your trust again?”", "I will answer for what I know you kept, not what the crowd applauds.", { needs: ["admit"], any: ["return-fund", "rescue"], hint: "Ends only when Ayla is devoted and knows the kept promise. A premature request spends AP." }),
  ],
};
