import type { ScenarioChoice } from "./scenarios";

export const CROSSING_TURN_MS = 60_000;
export interface StoryLine { id: string; npc: string; text: string; tick: number; to?: string }
export interface ClaimMemory { id: string; text: string; parent: string; private: boolean; npc: string; via: string; confidence: number; tick: number }
export interface CrossingSave {
  version: 1; deadlineAt: number; flags: string[]; lines: StoryLine[];
  ending?: string; won?: boolean; lastTick: number; spreadCount?: number;
}
export interface CrossingView {
  deadlineAt: number; serverNow: number; lines: StoryLine[]; flags: string[];
  ending?: string; claims?: ClaimMemory[]; spreadCount?: number;
}
const choice = (id: string, npc: string, label: string, hint: string, type: ScenarioChoice["type"] = "traded"): ScenarioChoice => ({ id: `cross-${id}`, scenario: "crossing", npc, label, hint, type, subject: `bridge: ${id}` });
export const crossingChoices = [
  choice("mediate-first", "elin", "“Let's hear both sides before settling the toll.”", "Elin can record a joint account after Rowan and Marta have both given their terms."),
  choice("mediation-note", "elin", "“Put Rowan's account beside Marta's terms.”", "Confirm what each person actually claimed before you commit money or publish a conclusion."),
  choice("promise", "rowan", "“I'll get Lysa across.”", "Promise Rowan a crossing before dusk. Hear his side of the debt."),
  choice("press", "rowan", "“Who did you actually pay?”", "Press his changing account. He may admit an uncomfortable detail."),
  choice("defend", "rowan", "“Rowan paid. I'll say it publicly.”", "Take a side. If this reaches Marta, she withdraws her paid-crossing offer.", "helped"),
  choice("support", "elin", "“Let me help. Then tell me what you saw.”", "Earn Elin's confidence. Costs time, but opens her testimony.", "helped"),
  choice("witness", "elin", "“Did you see the payment?”", "Elin shares her evidence only if she trusts you."),
  choice("receipt", "garrick", "“Show me the bridge toll ledger.”", "Bring Elin's testimony or Rowan's admission. Garrick cannot dismiss a precise question."),
  choice("terms", "marta", "“What will it take to open the bridge?”", "Hear her offer before taking a side."),
  choice("pay", "marta", "“Take my travel money. Let her cross.”", "Spend your purse. Closes the secret-crossing route; the original debt stays buried.", "donated"),
  choice("expose", "marta", "“This receipt proves the toll was paid.”", "Requires the receipt. Expose the truth publicly; release of the bridge takes one more turn.", "helped"),
  choice("quiet", "marta", "“Keep this private. Give me your word she'll cross.”", "Requires the receipt. A quiet deal trades accountability for speed."),
  choice("planks", "oren", "“Build a crossing with me, without Marta.”", "Choose the secret route. No paid passage after this. Marta may call it timber theft.", "helped"),
  choice("launch", "silas", "“Is the hidden crossing ready?”", "Construction takes a turn. A late rush is unsafe."),
  choice("escort", "lysa", "“Come with me. We're crossing now.”", "Requires an open bridge or ready secret crossing. Ends the story.", "saved"),
  choice("question-rowan", "rowan", "“What are people saying?”", "Hear this villager's current account. A teller can pass on a distorted version."),
  choice("question-marta", "marta", "“What are people saying?”", "Trace the account to its immediate source."),
  choice("question-elin", "elin", "“What are people saying?”", "Compare a rumour with Elin's private evidence."),
  choice("question-garrick", "garrick", "“What are people saying?”", "Find out which version reached the guard."),
];
export function crossingBlocked(flags: string[], id: string, tick: number): string | undefined {
  const has = (flag: string) => flags.includes(flag);
  if (has(id) && !id.startsWith("question-")) return "Already said or done";
  if (id === "mediate-first" && ["pay", "quiet", "expose", "planks"].some(has)) return "You've already committed to a crossing route";
  if (id === "mediation-note" && (!has("mediate-first") || !has("press") || !has("terms"))) return "Hear Rowan's payment account and Marta's terms before returning to Elin";
  if (["pay", "quiet", "expose"].includes(id) && has("mediate-first") && !has("mediation-note")) return "You opened mediation. Return both accounts to Elin before settling the toll";
  if (id === "pay" && (has("planks") || has("expose") || has("quiet"))) return "That route is closed";
  if (id === "pay" && has("marta-confronted")) return "Marta withdrew her offer after hearing your public defence";
  if (id === "planks" && (has("pay") || has("expose") || has("quiet"))) return "You've committed to the bridge route";
  if (["quiet", "expose"].includes(id) && (!has("receipt") || has("pay") || has("planks") || has(id === "quiet" ? "expose" : "quiet"))) return "Requires the receipt and an uncommitted route";
  if (id === "receipt" && !has("witness") && !has("press")) return "Bring a witness or a specific admission";
  if (id === "launch" && (!has("secret-ready") || tick >= 5)) return "Crossing needs a turn to settle; the river becomes unsafe at turn 5";
  if (id === "escort" && !has("bridge-open") && !has("secret-open")) return "No safe passage yet";
}
