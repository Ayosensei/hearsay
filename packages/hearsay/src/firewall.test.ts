import { expect, it } from "vitest";
import { checkFirewall } from "./firewall";
import { templateCandidates } from "./templates";
import { loadSeed } from "./seed-schema";

const theft = {
  eventId: "ev_theft",
  keywords: ["stole", "theft", "thief"],
  subject: "iron sword",
};
it("blocks unknown referenced and literal event IDs", () => {
  expect(checkFirewall("Greetings.", ["ev_theft"], [], [theft]).passed).toBe(
    false,
  );
  expect(checkFirewall("I know ev_invented.", [], [], []).passed).toBe(false);
  expect(checkFirewall("ev_known", ["ev_known"], ["ev_known"], []).passed).toBe(
    true,
  );
});
it("blocks unknown keywords and subject words as whole words without case sensitivity", () => {
  expect(
    checkFirewall("THEFT! An iron sword?", [], [], [theft]).violations,
  ).toHaveLength(3);
  expect(
    checkFirewall("The swordsmith greets you.", [], [], [theft]).passed,
  ).toBe(true);
});
it("blocks confirmation even when the player introduced the event", () => {
  expect(checkFirewall("Yes, you stole it.", [], [], [theft]).passed).toBe(
    false,
  );
  expect(checkFirewall("Nobody has told me.", [], [], [theft])).toEqual({
    passed: true,
    violations: [],
  });
});
it("allows known event references and handles Unicode word boundaries", () => {
  expect(
    checkFirewall("You stole the iron sword.", ["ev_theft"], ["ev_theft"], [])
      .passed,
  ).toBe(true);
  expect(
    checkFirewall("ÉPÉE!", [], [], [{ ...theft, subject: "épée" }]).passed,
  ).toBe(false);
});
it("selects deterministic templates for awareness, questions, mood and NPC override", async () => {
  const { templates } = await loadSeed();
  const context = {
    npcId: "brom",
    conversationId: "conv_a",
    utteranceCount: 2,
    label: "hostile" as const,
    aware: false,
    text: "Hello",
  };
  expect(templateCandidates(templates, context)).toEqual(
    templateCandidates(templates, context),
  );
  expect(templateCandidates(templates, context)[0]).toBe("Keep your distance.");
  expect(templateCandidates(templates, { ...context, aware: true })[0]).toBe(
    "I have little patience for you.",
  );
  expect(templates.unknownTopic).toContain(
    templateCandidates(templates, { ...context, text: "Did you hear?" })[0],
  );
  expect(
    templateCandidates(
      {
        ...templates,
        byNpc: { brom: { unknownTopic: ["No word reached me."] } },
      },
      { ...context, text: "Do you know?" },
    )[0],
  ).toBe("No word reached me.");
});
