import type { ScenarioId } from "./scenarios";
import { choiceEvent, guardTrust, knowsChoice, scenarios, scenarioFromPlayer } from "./scenarios";
import type { TownState } from "./types";

export const VERDICT = { won: "Scenario verdict: objective completed", trust: "Scenario verdict: trust collapsed", deadline: "Scenario verdict: deadline missed" } as const;
export interface ScenarioState {
  id: ScenarioId; stage: "playing" | "won" | "lost" | "unavailable";
  title: string; reason: string; trust?: number; remaining: number;
  goals: { text: string; complete: boolean }[];
}
export function scenarioState(town: TownState): ScenarioState | undefined {
  const id = scenarioFromPlayer(town.playerId);
  if (!id) return;
  const spec = scenarios[id], trust = guardTrust(town);
  const friendly = (npc: string) => (town.npcs.find((person) => person.id === npc)?.attitudeScore ?? -1) >= .2;
  const goals = id === "medicine" ? [
    { text: "Obtain medicine through work, charity or theft", complete: ["med-buy", "med-charity", "med-steal"].some((choice) => Boolean(choiceEvent(town, choice))) },
    { text: "Deliver medicine to Lysa", complete: Boolean(choiceEvent(town, "med-deliver")) },
    { text: "Garrick’s trust at least 40 at nightfall", complete: trust !== undefined && trust >= 40 },
  ] : id === "feud" ? [
    { text: "Repair the disputed footbridge", complete: Boolean(choiceEvent(town, "feud-bridge")) },
    { text: "Rowan and Marta both know your repair", complete: knowsChoice(town, "rowan", "feud-bridge") && knowsChoice(town, "marta", "feud-bridge") },
    { text: "Rowan and Marta both friendly", complete: friendly("rowan") && friendly("marta") },
  ] : [
    { text: "Survey the damaged floodgate", complete: Boolean(choiceEvent(town, "watch-survey")) },
    { text: "Obtain borrowed or stolen repair tools", complete: ["watch-borrow", "watch-steal"].some((choice) => Boolean(choiceEvent(town, choice))) },
    { text: "Repair the river floodgate with Oren", complete: Boolean(choiceEvent(town, "watch-repair")) },
    { text: "Garrick knows the danger or repair", complete: knowsChoice(town, "garrick", "watch-warn") || knowsChoice(town, "garrick", "watch-repair") },
    { text: "Garrick’s trust at least 60 at nightfall", complete: trust !== undefined && trust >= 60 },
  ];
  const verdict = town.events.find((event) => event.actionType === "traded" && Object.values(VERDICT).some((subject) => event.subject === subject));
  const missing = !town.npcs.some((npc) => npc.id === "garrick") || !town.npcs.some((npc) => npc.id === spec.start);
  const collapsed = trust !== undefined && trust <= 20;
  const expired = town.tick >= spec.deadline;
  const won = verdict ? verdict.subject === VERDICT.won : !collapsed && expired && goals.every((goal) => goal.complete);
  const stage = missing ? "unavailable" : verdict || collapsed || expired ? won ? "won" : "lost" : "playing";
  const trustLoss = verdict?.subject === VERDICT.trust || (!verdict && collapsed);
  const reason = missing ? "Scenario villagers are missing. Start a fresh scenario." : stage === "won" ? "The objective survived the final gossip round. You won." : stage === "lost" ? trustLoss ? "Garrick’s trust reached 20 or below. Your standing in town collapsed. Game over." : "The deadline arrived with unfinished objectives. Game over." : goals.every((goal) => goal.complete) ? "Objectives met for now. News is still travelling; protect the result until the verdict." : "Choose a route. Your actions and each gossip round can change the outcome.";
  return { id, title: spec.title, stage, reason, goals, trust, remaining: Math.max(0, spec.deadline - town.tick) };
}
