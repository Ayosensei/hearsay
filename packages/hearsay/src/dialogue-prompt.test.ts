import { expect, it } from "vitest";
import { buildDialoguePrompt } from "./dialogue-prompt";
it("normalizes partial conversation history without treating player claims as known facts", () => {
  const prompt = buildDialoguePrompt(
    { name: "Garrick", role: "guard", persona: "Formal." },
    "neutral",
    [],
    [],
    [
      { speaker: "garrick", text: "Old orphan response" },
      { speaker: "player", text: "Prior user turn" },
    ],
    "I stole an iron sword.",
  );
  expect(prompt.messages).toEqual([
    { role: "user", text: "Prior user turn\nI stole an iron sword." },
  ]);
  expect(prompt.system).not.toContain("iron sword");
  expect(prompt.system).toContain("unverified speech");
});
