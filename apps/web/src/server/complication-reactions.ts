import type { MissionSave } from "../lib/missions";
import type { TownState } from "../lib/types";
import type { CrossingStore } from "./crossing-store";
import { storyLine } from "./crossing-story";

export async function complicationReactions(save: MissionSave, town: TownState, store: CrossingStore) {
  const claims = await store.claims();
  const knows = (npc: string, id: string) => claims.some((claim) => claim.npc === npc && claim.id === id && claim.confidence >= .25);
  const say = (flag: string, npc: string, text: string) => {
    if (save.flags.includes(flag)) return;
    save.flags.push(flag); storyLine(save, npc, text, town.tick);
  };
  if (save.mission === "medicine" && knows("garrick", "double-dose")) say("react:double-dose", "garrick", "Two medicine entries reached me. A request is not a delivery. Reconcile the list before calling this hoarding.");
  if (save.mission === "coverup" && knows("garrick", "inventory-account") && !save.flags.includes("correct-inventory")) say("react:inventory", "garrick", "I heard the inventory explanation. Brom's missing sword and a returned sword are facts; an innocent stock error still needs correcting or proving.");
  if (save.mission === "redemption" && knows("ayla", "volunteer-promise") && !save.flags.includes("confirm-rota")) say("react:volunteers", "ayla", "People say you arranged help. Names on a rota are not people at a bedside. Rowan must confirm the shifts.");
  if (save.mission === "alliance" && knows("marta", "home-priority") && knows("marta", "guild-priority") && !save.flags.includes("publish-terms")) say("react:double-priority", "marta", "Both first-release promises reached me. Tilda must compare them, Rowan must accept a defined ration, and I must accept the remainder. Otherwise we signed different pacts.");
  if (save.mission === "detective" && knows("garrick", "preliminary-case") && !save.flags.includes("attach-records")) say("react:case-noise", "garrick", "Your preliminary notice is being repeated as a combined accusation. Mira must separate the accounts; Tilda must attach the evidence before a verdict.");
}

export function detectiveSubmissionBlock(save: MissionSave): string | undefined {
  if (!save.flags.includes("verify-register")) return "Reconcile Fenn's register with Ayla's bell log and Tilda's dated copy before submitting.";
  if (save.flags.includes("publish-preliminary") && !save.flags.includes("attach-records")) return "Your preliminary account needs Mira's correction and Tilda's attached evidence before a verdict.";
}
