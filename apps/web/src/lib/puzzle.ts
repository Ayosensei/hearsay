import { choicesFor, scenarioFromPlayer } from "./scenarios";
import { scenarioState } from "./scenario-state";
import type { ScenarioState } from "./scenario-state";
import type { TownState } from "./types";

export const CASE_SUBJECT = "Case: the missing silver seal";
export interface DetectiveAnswer { witnessId: string; route: string[]; account: "eyewitness" | "secondhand" | "unaware"; liarId?: string }
export interface PuzzleClue { npcId: string; eventId: string; title: string; source: string; confidence: number; tick: number }
export interface PuzzleView {
  story?: import("./missions").MissionView;
  crossing?: import("./crossing").CrossingView;
  fog: boolean; ap: number; maxAp: number; state: ScenarioState; clues: PuzzleClue[];
  feedback?: string; caseEventId?: string; detective?: { score?: number; truth?: DetectiveAnswer; maxScore?: number };
}
export const isPuzzle = (id?: string) => Boolean((id?.startsWith("puzzle_") || id?.startsWith("story_")) && scenarioFromPlayer(id));
export function gameplayEvents(town: TownState) {
  return town.events.filter((event) => !/^(Note\||Talk\||Refused\||Case prepared|Detective score:|Scenario verdict:)/.test(event.subject ?? ""));
}
export function eventKey(town: TownState, eventId: string): string | undefined {
  const event = town.events.find((item) => item.id === eventId);
  if (event?.subject?.startsWith("Case:")) return "case";
  const id = scenarioFromPlayer(town.playerId);
  return id ? choicesFor(id, town.npcs).find((choice) => choice.subject === event?.subject && choice.type === event?.actionType)?.id : undefined;
}
export function pointsLeft(town: TownState) {
  const id = scenarioFromPlayer(town.playerId);
  const choices = id ? choicesFor(id, town.npcs) : [];
  const used = town.events.filter((event) => event.tickOccurred === town.tick && (
    /^(Note\||Talk\||Refused\||Detective score:)/.test(event.subject ?? "") || choices.some((choice) => choice.subject === event.subject && choice.type === event.actionType)
  )).length;
  return Math.max(0, 2 - used);
}
export function puzzleClues(town: TownState): PuzzleClue[] {
  return town.events.flatMap((event) => {
    const [kind, npcId, key, source, confidence, tick] = (event.subject ?? "").split("|");
    if (kind !== "Note" || !npcId || !key || !source || !Number.isFinite(Number(confidence)) || !Number.isFinite(Number(tick))) return [];
    const target = gameplayEvents(town).find((item) => eventKey(town, item.id) === key);
    return target ? [{ npcId, eventId: target.id, title: target.title, source, confidence: Number(confidence), tick: Number(tick) }] : [];
  });
}
export function puzzleView(town: TownState, truth?: DetectiveAnswer): TownState {
  const state = scenarioState(town);
  if (!isPuzzle(town.playerId) || !state) return town;
  const fog = state.stage === "playing";
  const caseEvent = gameplayEvents(town).find((event) => event.subject?.startsWith("Case:"));
  const score = town.events.find((event) => event.subject?.startsWith("Detective score:"))?.subject?.match(/(\d)\/3/)?.[1];
  const refusal = town.events.find((event) => event.subject?.startsWith("Refused|"));
  const refusalChoice = refusal?.subject?.split("|")[1];
  const publicState = fog ? { ...state, trust: undefined, reason: "Information is incomplete. Question villagers, read their reactions, and protect your objective before the deadline.", goals: state.goals.map((goal) => /trust|friendly|know|devoted|neutral/i.test(goal.text) ? { text: goal.text } : goal) } : state;
  const puzzle: PuzzleView = { fog, ap: pointsLeft(town), maxAp: 2, state: publicState, clues: puzzleClues(town), caseEventId: caseEvent?.id,
    feedback: refusal ? `A request was refused (${refusalChoice}) at turn ${refusal.tickOccurred}. The attempt spent 1 AP; build trust or bring the required knowledge before trying again next turn.` : undefined,
    detective: state.id === "detective" ? { score: score === undefined ? undefined : Number(score), truth: fog ? undefined : truth } : undefined };
  if (!fog) return { ...town, events: gameplayEvents(town), puzzle };
  const events = gameplayEvents(town).map((event) => ({ ...event, witnessId: "", witnessName: "Hidden until the verdict" }));
  return { ...town, puzzle, events, npcs: town.npcs.map((npc) => ({ ...npc, knowledgeHidden: true, attitudeScore: 0, contributions: [], rumors: [], primaryRumor: undefined, knowledgeState: "none" })),
    graphNodes: town.graphNodes.filter((node) => node.type === "npc"), graphEdges: town.graphEdges.filter((edge) => edge.type === "TRUSTS"),
    activeProvenance: undefined, activePathEdgeIds: [], recentTraces: [], gossipSteps: [], dialogueHistory: Object.fromEntries(Object.entries(town.dialogueHistory).map(([id, messages]) => [id, messages.map((message) => ({ ...message, provenance: undefined, firewall: message.firewall ? { passed: message.firewall.passed, violations: [] } : undefined }))])) };
}
