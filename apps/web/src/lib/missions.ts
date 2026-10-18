import type { ScenarioId, ScenarioChoice } from "./scenarios";
import type { CrossingSave, CrossingView } from "./crossing";
import type { PuzzleClue } from "./puzzle";

export type MissionId = "medicine" | "watch" | "coverup" | "redemption" | "alliance" | "detective";
export interface MissionChoice extends ScenarioChoice {
  weight?: number;
  key: string; reply: string; needs?: string[]; any?: string[]; excludes?: string[];
  showAfter?: string[]; trust?: number; notBefore?: number; before?: number; fact?: string;
  claim?: { id: string; text: string; parent?: string };
  grants?: string[];
  needsWhen?: { when: string[]; needs: string[]; hint: string }[];
}
export interface MissionDefinition {
  id: MissionId; title: string; objective: string; brief: string; deadline: number; start: string;
  opening: string; choices: MissionChoice[]; facts: { id: string; npc: string; text: string }[];
}
export interface MissionSave extends CrossingSave {
  mission: MissionId; ap: number; clues: PuzzleClue[];
  caseEventId?: string; liarId?: string; detectiveScore?: number;
}
export interface MissionView extends CrossingView {
  mission: MissionId; maxTurns: number; objective: string;
}
export const isMissionId = (id: ScenarioId | undefined): id is MissionId => Boolean(id && ["medicine", "watch", "coverup", "redemption", "alliance", "detective"].includes(id));
export function missionFromPlayer(id?: string): MissionId | undefined {
  const match = /^story_([a-z]+)_[a-z0-9]{20}$/.exec(id ?? "");
  return match && isMissionId(match[1] as ScenarioId) ? match[1] as MissionId : undefined;
}
export function missionChoice(key: string, npc: string, label: string, reply: string, options: Partial<Omit<MissionChoice, "key" | "id" | "npc" | "label" | "reply" | "subject">> = {}): MissionChoice {
  return { key, id: `story-${key}`, npc, label, reply, hint: "", type: "traded", subject: `mission: ${key}`, ...options };
}
export function missionBlocked(choice: MissionChoice, flags: string[], tick: number): string | undefined {
  if (flags.includes(choice.key)) return "Already resolved";
  if (choice.needs?.some((flag) => !flags.includes(flag))) return "You need more evidence or preparation";
  if (choice.any && !choice.any.some((flag) => flags.includes(flag))) return "Secure one of the required routes first";
  for (const condition of choice.needsWhen ?? []) {
    if (condition.when.every((flag) => flags.includes(flag)) && condition.needs.some((flag) => !flags.includes(flag))) return condition.hint;
  }
  if (choice.excludes?.some((flag) => flags.includes(flag))) return "Your earlier commitment closed this route";
  if (choice.notBefore !== undefined && tick < choice.notBefore) return `Not ready until bell ${choice.notBefore}`;
  if (choice.before !== undefined && tick >= choice.before) return "That opportunity has passed";
}
