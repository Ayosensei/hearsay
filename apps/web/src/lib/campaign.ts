import type { ScenarioId } from "./scenarios";

export const campaignOrder = ["watch", "medicine", "crossing", "coverup", "redemption", "alliance", "detective"] as const satisfies readonly ScenarioId[];
export const campaignDifficulty: Partial<Record<ScenarioId, string>> = {
  watch: "One practical detour", medicine: "Linked requests", crossing: "Two sides of one payment",
  coverup: "Competing public accounts", redemption: "Promises within promises", alliance: "Conflicting obligations", detective: "Overlapping stories and records",
};
export interface CampaignProgress { demo: boolean; completed: ScenarioId[] }
export const emptyCampaign = (): CampaignProgress => ({ demo: false, completed: [] });
export function parseCampaign(raw: string | null): CampaignProgress {
  try {
    const value = JSON.parse(raw ?? "null");
    return { demo: value?.demo === true, completed: campaignOrder.filter((id) => Array.isArray(value?.completed) && value.completed.includes(id)) };
  } catch { return emptyCampaign(); }
}
export function canPlayLevel(progress: CampaignProgress, id: ScenarioId): boolean {
  const index = campaignOrder.findIndex((level) => level === id);
  return progress.demo && index >= 0 && campaignOrder.slice(0, index).every((level) => progress.completed.includes(level));
}
export function nextCampaignLevel(progress: CampaignProgress): ScenarioId | undefined {
  return progress.demo ? campaignOrder.find((id) => !progress.completed.includes(id)) : undefined;
}
const key = "hearsay-campaign-v1";
export const readCampaign = (): CampaignProgress => typeof window === "undefined" ? emptyCampaign() : parseCampaign(localStorage.getItem(key));
export function saveCampaign(progress: CampaignProgress) {
  localStorage.setItem(key, JSON.stringify(progress));
  window.dispatchEvent(new Event("hearsay-campaign"));
}
