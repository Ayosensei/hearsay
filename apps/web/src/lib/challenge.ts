import type { TownState } from "./types";

export interface ChallengeSave { playerId: string; targetEventId?: string }
export type ChallengeStage = "briefing" | "race" | "won" | "lost" | "unavailable";
export function challengeStage(town: TownState, targetEventId?: string): ChallengeStage {
  const guard = town.npcs.find((npc) => npc.id === "garrick");
  if (!guard) return "unavailable";
  if (!targetEventId) return "briefing";
  if (!town.events.some((event) => event.id === targetEventId)) return "unavailable";
  // Learning the theft ends the race, even if later kindness restores his opinion.
  if (guard.rumors.some((memory) => memory.eventId === targetEventId)) return "lost";
  return guard.attitude === "friendly" || guard.attitude === "devoted" ? "won" : "race";
}
export function readChallenge(): ChallengeSave | undefined {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("hearsay-challenge") ?? "null");
    if (!value || typeof value !== "object" || !("playerId" in value) || typeof value.playerId !== "string" || !/^challenge_[a-z0-9]{20}$/.test(value.playerId)) return;
    const target = "targetEventId" in value ? value.targetEventId : undefined;
    if (target !== undefined && (typeof target !== "string" || !/^ev_[a-z0-9_-]{1,40}$/.test(target))) return;
    return { playerId: value.playerId, targetEventId: target };
  } catch { return undefined; }
}
export function saveChallenge(value: ChallengeSave) {
  localStorage.setItem("hearsay-challenge", JSON.stringify(value));
}
