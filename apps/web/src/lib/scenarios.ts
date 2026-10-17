import type { EventType } from "@hearsay/contract";
import type { TownState } from "./types";

export const scenarios = {
  medicine: { title: "The Missing Medicine", deadline: 6, start: "lysa", brief: "Lysa is ill. Obtain medicine from Marta or the chapel, deliver it, and keep Garrick’s trust at least 40 at nightfall." },
  feud: { title: "The Family Feud", deadline: 7, start: "rowan", brief: "Repair the disputed footbridge. Get Rowan and Marta to become friendly and both learn about your repair before the town meeting." },
  watch: { title: "The Night Watch", deadline: 7, start: "silas", brief: "Survey the floodgate, obtain tools, and repair it with Oren. Garrick must know the danger or repair and trust you at least 60 by nightfall." },
  coverup: { title: "The Cover-up", deadline: 8, start: "brom", brief: "Brom saw you steal the forge sword. Keep Garrick neutral or better until the inspector arrives at turn 8. If he becomes wary, your cover is blown." },
  redemption: { title: "Redemption", deadline: 10, start: "ayla", brief: "Ayla remembers your broken promise. Earn her devotion before turn 10. Choose who sees your good deeds and let truthful news travel." },
  alliance: { title: "Three Factions", deadline: 8, start: "mira", brief: "Make the townsfolk, guards and merchants friendly by the inspector’s arrival at turn 8. Each faction is judged by its members’ average attitude." },
  detective: { title: "Rumour Detective", deadline: 8, start: "garrick", brief: "Reconstruct the silver-seal accusation against your traveller. Identify the eyewitness, the exact route to Garrick, and whether his account is firsthand, secondhand or unheard. One answer before turn 8." },
} as const;
export type ScenarioId = keyof typeof scenarios;
export interface ScenarioChoice {
  id: string; npc: string; label: string; hint: string; subject: string;
  type: EventType; scenario?: ScenarioId; requires?: string[];
}
export const scenarioChoices: ScenarioChoice[] = [
  { id: "redeem-aid", scenario: "redemption", npc: "ayla", label: "Prepare the soup kitchen", hint: "Ayla sees your work. A single kindness may not outweigh the broken promise.", type: "helped", subject: "preparing the chapel soup kitchen" },
  { id: "redeem-gift", scenario: "redemption", npc: "ayla", label: "Donate kitchen supplies", hint: "A separate act of generosity. It competes with the memory of your lie.", type: "donated", subject: "supplies for the chapel soup kitchen" },
  { id: "med-work", scenario: "medicine", npc: "brom", label: "Earn medicine money", hint: "Work at the forge. Honest, but costs a turn.", type: "helped", subject: "repairing tools for medicine money" },
  { id: "med-buy", scenario: "medicine", npc: "marta", label: "Buy the medicine", hint: "Spend your forge earnings. No theft to explain.", type: "traded", subject: "medicine bought for Lysa", requires: ["med-work"] },
  { id: "med-clinic", scenario: "medicine", npc: "ayla", label: "Help prepare remedies", hint: "Earn Ayla’s trust so she will offer charity medicine.", type: "helped", subject: "preparing chapel remedies" },
  { id: "med-charity", scenario: "medicine", npc: "ayla", label: "Request charity medicine", hint: "Ayla must be friendly. Her opinion comes from what she knows.", type: "traded", subject: "charity medicine for Lysa" },
  { id: "med-steal", scenario: "medicine", npc: "marta", label: "Steal the medicine", hint: "A fast route. Everyone nearby sees the theft; news can reach Garrick.", type: "stole", subject: "medicine taken for Lysa" },
  { id: "med-deliver", scenario: "medicine", npc: "lysa", label: "Deliver the medicine", hint: "Requires medicine. The rescue also becomes a memory that can spread.", type: "saved", subject: "Lysa with delivered medicine" },
  { id: "feud-bridge", scenario: "feud", npc: "rowan", label: "Repair the disputed bridge", hint: "Rowan sees your work. Marta must learn it through the network.", type: "helped", subject: "repairing the disputed footbridge" },
  { id: "feud-supplies", scenario: "feud", npc: "marta", label: "Donate bridge supplies", hint: "Win Marta’s goodwill, but this alone does not tell her about your repair.", type: "donated", subject: "supplies for the disputed footbridge" },
  { id: "feud-mediate", scenario: "feud", npc: "elin", label: "Help Elin mediate", hint: "Elin is trusted by both sides. Her story can carry your goodwill.", type: "helped", subject: "mediating the footbridge dispute" },
  { id: "feud-lie", scenario: "feud", npc: "marta", label: "Lie about your bridge work", hint: "Creates a harmful memory, not proof of a repair. You cannot bluff the objective.", type: "lied", subject: "your work on the disputed footbridge" },
  { id: "watch-survey", scenario: "watch", npc: "silas", label: "Survey the floodgate", hint: "Silas witnesses the danger. His report can spread through trusted people.", type: "helped", subject: "surveying the damaged floodgate" },
  { id: "watch-borrow", scenario: "watch", npc: "brom", label: "Borrow repair tools", hint: "Brom must be friendly. Help him first, or let good news reach him.", type: "traded", subject: "borrowed floodgate repair tools", requires: ["watch-survey"] },
  { id: "watch-steal", scenario: "watch", npc: "brom", label: "Steal repair tools", hint: "Saves a favour, but gives Brom a theft to report.", type: "stole", subject: "stolen floodgate repair tools", requires: ["watch-survey"] },
  { id: "watch-brief", scenario: "watch", npc: "oren", label: "Show Oren your survey", hint: "A direct briefing if the survey news has not reached him yet.", type: "traded", subject: "floodgate survey briefing", requires: ["watch-survey"] },
  { id: "watch-repair", scenario: "watch", npc: "silas", label: "Repair the floodgate", hint: "Fit the repair at the docks. Requires tools and Oren’s knowledge of the survey or briefing.", type: "helped", subject: "repairing the river floodgate" },
  { id: "watch-warn", scenario: "watch", npc: "garrick", label: "Report the flood danger", hint: "Give Garrick an eyewitness warning. Earn trust as the report spreads.", type: "helped", subject: "warning the guard about the floodgate", requires: ["watch-survey"] },
];

export function choicesFor(scenario: ScenarioId, npcs: TownState["npcs"]): ScenarioChoice[] {
  return [...scenarioChoices.filter((choice) => choice.scenario === scenario), ...npcs.map((npc): ScenarioChoice => ({
    id: `help-${npc.id}`, npc: npc.id, label: `Help ${npc.name}`, hint: "One local favour. No repeat farming; their opinion depends on their memories.",
    type: "helped", subject: `helping ${npc.name} with daily work`,
  })), { id: "threaten-guard", npc: "garrick", label: "Threaten Garrick", hint: "An assault will collapse his trust. This can end your game immediately.", type: "attacked", subject: "Garrick at his guard post" }];
}

export function scenarioFromPlayer(playerId?: string): ScenarioId | undefined {
  const match = /^(?:quest|puzzle)_([a-z]+)_[a-z0-9]{20}$/.exec(playerId ?? "");
  return match && Object.hasOwn(scenarios, match[1]) ? match[1] as ScenarioId : undefined;
}
export function choiceEvent(town: TownState, id: string) {
  const scenario = scenarioFromPlayer(town.playerId);
  const choice = scenario && choicesFor(scenario, town.npcs).find((item) => item.id === id);
  return choice ? town.events.find((event) => event.subject === choice.subject && event.actionType === choice.type) : undefined;
}
export function knowsChoice(town: TownState, npcId: string, id: string) {
  const event = choiceEvent(town, id);
  return Boolean(event && town.npcs.find((npc) => npc.id === npcId)?.rumors.some((memory) => memory.eventId === event.id && memory.confidence >= .25));
}
export function guardTrust(town: TownState) {
  const guard = town.npcs.find((npc) => npc.id === "garrick");
  return guard ? (guard.attitudeScore + 1) * 50 : undefined;
}
export function choiceBlocked(town: TownState, choice: ScenarioChoice): string | undefined {
  if (choiceEvent(town, choice.id)) return "Already completed";
  if (choice.requires?.some((id) => !choiceEvent(town, id))) return "Complete the prerequisite first";
  const medicine = ["med-buy", "med-charity", "med-steal"].some((id) => choiceEvent(town, id));
  if (["med-buy", "med-charity", "med-steal"].includes(choice.id) && medicine) return "You already have medicine";
  if (choice.id === "med-deliver" && !medicine) return "Obtain medicine first";
  if (!town.puzzle?.fog && ["med-charity", "watch-borrow"].includes(choice.id) && (town.npcs.find((npc) => npc.id === choice.npc)?.attitudeScore ?? -1) < .2) return `${choice.npc === "ayla" ? "Ayla" : "Brom"} must be friendly first`;
  if (["watch-borrow", "watch-steal"].includes(choice.id) && ["watch-borrow", "watch-steal"].some((id) => choiceEvent(town, id))) return "You already have tools";
  if (choice.id === "watch-repair") {
    if (!["watch-borrow", "watch-steal"].some((id) => choiceEvent(town, id))) return "Obtain repair tools first";
    if (!town.puzzle?.fog && !knowsChoice(town, "oren", "watch-survey") && !knowsChoice(town, "oren", "watch-brief")) return "Oren needs the survey news or a direct briefing";
  }
}
