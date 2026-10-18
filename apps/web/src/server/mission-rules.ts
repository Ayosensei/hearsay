import type { TownState } from "../lib/types";
import type { ClaimMemory } from "../lib/crossing";
import type { MissionSave } from "../lib/missions";
import { storyLine } from "./crossing-story";
import type { CrossingStore } from "./crossing-store";
import { complicationReactions } from "./complication-reactions";

export const hasFlag = (s: MissionSave, flag: string) => s.flags.includes(flag);
export const addFlag = (s: MissionSave, flag: string) => { if (!hasFlag(s, flag)) s.flags.push(flag); };
export const knowsAction = (town: TownState, npc: string, key: string) => {
  const event = town.events.find((e) => e.subject === `mission: ${key}`);
  return Boolean(event && town.npcs.find((n) => n.id === npc)?.rumors.some((r) => r.eventId === event.id && r.confidence >= .25));
};
export function endMission(s: MissionSave, town: TownState, ending: string, won: boolean, npc: string, text: string) {
  if (s.ending) return;
  s.ending = ending; s.won = won; storyLine(s, npc, text, town.tick);
}
export function specialBlock(s: MissionSave, key: string, town: TownState): string | undefined {
  const has = (id: string) => hasFlag(s, id);
  if (s.mission === "medicine" && key === "close" && has("steal-dose") && !has("fine")) return "Garrick requires repayment for the stolen vial";
  if (s.mission === "watch" && key === "report" && has("seal") && !has("return-tools")) return "Return Brom's borrowed kit before closing the watch";
  if (s.mission === "alliance" && key === "sign-marta" && has("emergency") && !has("oversight")) return "Marta requires public oversight of the guard's emergency powers";
}
export async function missionReactions(s: MissionSave, town: TownState, store: CrossingStore) {
  await complicationReactions(s, town, store);
  const has = (id: string) => hasFlag(s, id);
  const emit = (id: string, npc: string, text: string) => {
    if (!has(`react:${id}`)) { addFlag(s, `react:${id}`); storyLine(s, npc, text, town.tick); }
  };
  if (s.mission === "medicine") {
    if (has("borrow-dose") && town.tick >= 2 && !has("brew")) emit("fenn-dose", "fenn", "Ayla says my dose went to Lysa. I'm glad she has it. What happens to me now?");
    if (knowsAction(town, "garrick", "steal-dose") && !has("fine")) emit("vial-summons", "garrick", "The vial theft reached me. Return with restitution. Treating Lysa doesn't make Marta's account disappear.");
  }
  if (s.mission === "watch") {
    const brace = town.events.find((e) => e.subject === "mission: brace");
    if (brace && town.tick > brace.tickOccurred && !has("brace-ready")) { addFlag(s, "brace-ready"); emit("brace-ready", "oren", "The brace has settled. Seal it before bell five, or switch to evacuation."); }
    if (town.tick >= 5 && !has("seal") && !has("divert")) emit("gate-broke", "silas", "The engineering window is gone. Evacuate now. We can still save the residents.");
    if (knowsAction(town, "marta", "divert")) emit("market-loss", "marta", "I heard who opened the relief channel. My stock is paying for the homes you saved. Come tell us before the water does.");
  }
  if (s.mission === "coverup") {
    const knowsTheft = town.npcs.find((n) => n.id === "garrick")?.rumors.some((r) => r.eventId === s.caseEventId);
    if (knowsTheft && !has("confess")) emit("sword-summons", "garrick", "Brom's theft account has reached me. By bell five I need a settlement or an account I can verify.");
    const sale = town.events.find((e) => e.subject === "mission: sell-sword");
    if (sale && town.tick > sale.tickOccurred + 1 && !has("bury-sale") && !has("sale-published")) {
      addFlag(s, "sale-published"); await store.claim("sword-sale", "fenn", "Fenn's dated sale ledger places the stolen sword in the traveller's hands.", town.tick);
      emit("sale-published", "fenn", "A buyer asked about that sword. My sale account is now part of the story.");
    }
  }
  if (s.mission === "redemption" && has("public-gift") && town.tick >= 2) emit("applause", "ayla", "I heard about the announcement. I still need a promise kept, not a crowd persuaded.");
  if (s.mission === "alliance" && knowsAction(town, "rowan", "monopoly")) emit("grain-demand", "rowan", "The guild-rights promise reached me. I need a protected household ration before I sign.");
  if (town.tick >= 3) {
    const reminders = {
      medicine: ["lysa", "The fever won't wait for the paperwork. Bring treatment, then settle the dispute."],
      watch: ["silas", "The water is rising. The fifth bell closes the repair window."],
      coverup: ["brom", "The inspector is coming. Returning the sword and clearing the record are separate decisions."],
      redemption: ["ayla", "The chapel closes at bell eight. Ask forgiveness for something you actually kept."],
      alliance: ["tilda", "The convoy leaves at bell eight. Three promises are not three signatures."],
      detective: ["garrick", "Dated statements can go stale. Check the route before you stake the case on it."],
    } as const;
    const reminder = reminders[s.mission]; emit("midpoint", reminder[0], reminder[1]);
  }
}
export function resolveMission(s: MissionSave, town: TownState, key: string, claims: ClaimMemory[]) {
  const has = (flag: string) => hasFlag(s, flag);
  const end = (title: string, won: boolean, npc: string, text: string) => endMission(s, town, title, won, npc, text);
  if (s.mission === "medicine" && key === "close") {
    const trust = (town.npcs.find((n) => n.id === "garrick")?.attitudeScore ?? -1);
    if (trust <= -.6) return "Garrick's standing is too low to settle the case. Make restitution before returning.";
    end(has("borrow-dose") && !has("brew") ? "A cure borrowed from another bed" : has("fine") ? "A rescue with restitution" : has("release") ? "The town carries the bill" : "Two patients, no stolen cure", true, "garrick", has("borrow-dose") && !has("brew") ? "Lysa is treated. Fenn's reserved medicine was never replaced. That cost stays in the record." : "Lysa is treated and the medicine account is settled. The record shows who paid, and why.");
  }
  if (s.mission === "watch" && key === "report") end(has("boats") ? "Homes lost, lives saved" : has("divert") ? "Dry homes, drowned market" : has("cause") ? "The gate held; the cause is on record" : "The gate held, the cause stayed hidden", true, "garrick", "The watch is closed. Your report records the people protected and the losses your route accepted.");
  if (s.mission === "coverup") {
    const guardClaims = claims.filter((c) => c.npc === "garrick" && c.confidence >= .25);
    if (key === "service") end("Accountable, but free", true, "garrick", "You admitted the theft and made restitution. Your name is in the ledger, with service instead of arrest.");
    if (key === "escape") end("Gone, not cleared", false, "silas", "You escaped the town. The sword case remains unresolved behind you.");
    if (key === "inspection") {
      if (guardClaims.some((c) => c.id === "sword-settled")) end("A settlement, not innocence", true, "garrick", "Brom's settlement reached me through a named source. The inspector will see restitution, not a clean past.");
      else if (guardClaims.some((c) => c.id === "inn-alibi") && !guardClaims.some((c) => c.id === "sword-sale")) end("An alibi held together by silence", true, "garrick", "Mira's account reached me. Without a contradictory sale record, the inspector cannot resolve the accusation today.");
      else return "No qualifying settlement or alibi has reached Garrick. The route matters; wait or use an honest settlement.";
    }
  }
  if (s.mission === "redemption" && key === "blessing") {
    const ayla = town.npcs.find((n) => n.id === "ayla");
    if ((ayla?.attitudeScore ?? -1) < .6 || (!knowsAction(town, "ayla", "return-fund") && !knowsAction(town, "ayla", "rescue"))) return "Ayla needs devotion and actual knowledge of your kept promise. Good news may still be travelling.";
    end(has("public-gift") ? "Forgiveness beyond the applause" : has("return-fund") ? "The promise returned whole" : "Service without an audience", true, "ayla", "I know what you kept. I remember the broken promise too. Devotion means I can trust what you do next.");
  }
  if (s.mission === "alliance" && key === "ratify") end(has("monopoly") ? "Winter under guild terms" : has("emergency") ? "A guarded pact, under review" : "A common winter table", true, "tilda", "Three leaders signed the same terms. The convoy leaves with a pact the graph can trace to their commitments.");
}
export function missionDeadline(s: MissionSave, town: TownState, maxTurns: number, claims: ClaimMemory[]) {
  if (s.ending) return;
  if (s.mission === "coverup" && town.tick >= 5 && !hasFlag(s, "confess")) {
    const knows = town.npcs.find((n) => n.id === "garrick")?.rumors.some((r) => r.eventId === s.caseEventId);
    const guard = claims.filter((c) => c.npc === "garrick");
    const supported = guard.some((c) => c.id === "sword-settled") || (guard.some((c) => c.id === "inn-alibi") && !guard.some((c) => c.id === "sword-sale"));
    if (knows && !supported) endMission(s, town, "The guard's summons expired", false, "garrick", "The accusation reached me and the fifth bell passed without a qualifying account. You are detained.");
  }
  if (!s.ending && town.tick >= maxTurns) {
    const endings = {
      medicine: hasFlag(s, "deliver") ? "A rescue without a settlement" : "The fever outlasted the argument",
      watch: "The river chose for you", coverup: "The inspector found an open case",
      redemption: "A promise left unfinished", alliance: "The convoy left without a pact", detective: "The case closed without a reconstruction",
    };
    endMission(s, town, endings[s.mission], false, "garrick", "The deadline arrived. Your completed deeds remain in the graph, but the mission's final obligation was not met.");
  }
}
