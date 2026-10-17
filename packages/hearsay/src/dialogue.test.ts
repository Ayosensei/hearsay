import {
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  expect,
  it,
  vi,
} from "vitest";
import { createDialogue } from "./dialogue";
import { createGossip } from "./gossip";
import { memoryHarness } from "./testing/memory-harness";
import { data } from "./testing/world-harness";
import type { Llm, LlmInput, LlmResult } from "./llm";
import { Q97_recent_utterances } from "./queries/dialogue";

let h: Awaited<ReturnType<typeof memoryHarness>>;
beforeAll(async () => {
  h = await memoryHarness();
});
beforeEach(async () => {
  vi.stubEnv("HEARSAY_LLM", "live");
  data(await h.world.resetPlayer({ playerId: h.playerId }));
});
afterEach(() => {
  vi.unstubAllEnvs();
});
afterAll(async () => {
  if (h) await h.cleanup();
});
const clean = (
  reply = "Good day.",
  referencedEventIds: string[] = [],
): LlmResult => ({
  ok: true,
  data: { reply, referencedEventIds },
  cached: false,
});
const action = {
  type: "stole" as const,
  placeId: "forge",
  witnesses: ["brom"],
  subject: "iron sword",
};

it("retries a leaking model once then saves only a safe template, even when the player introduces theft", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  const generate = vi
    .fn<Llm["generate"]>()
    .mockResolvedValue(clean("Yes, you stole the iron sword.", [eventId]));
  const dialogue = createDialogue(h.db, h.world, {
    llm: { generate },
    seedPath: h.seedPath,
  });
  const result = await dialogue.say({
    playerId: h.playerId,
    npcId: "garrick",
    text: "I stole the iron sword. Did you hear?",
  });
  const response = data(result);
  expect(response).toMatchObject({
    source: "template_fallback",
    firewall: { passed: false },
    usedEventIds: [],
    attitude: { score: 0, label: "neutral" },
  });
  expect(response.firewall.violations).toContain(
    `referenced unknown event ${eventId}`,
  );
  expect(response.reply).not.toMatch(/stole|sword|theft/i);
  expect(generate).toHaveBeenCalledTimes(2);
  expect(generate.mock.calls[1]?.[0].system).toContain(
    "Your last reply mentioned something you do not know",
  );
  for (const [prompt] of generate.mock.calls) {
    expect(prompt.system).not.toContain(eventId);
    expect(prompt.system).not.toContain("iron sword");
    expect(prompt.messages.at(-1)?.text).toContain("I stole");
  }
  const saved = data(
    await h.db.ro(
      `player:${h.playerId}`,
      "Q97_recent_utterances",
      Q97_recent_utterances,
      { pid: h.playerId, nid: "garrick", limit: 6 },
    ),
  );
  expect(saved).toHaveLength(2);
  expect(saved.find((r) => r.speaker === "garrick")?.text).toBe(response.reply);
  expect(
    result.trace.filter((t) => t.queryId === "Q96_utterance_add"),
  ).toHaveLength(2);
});

it("uses real known events and attitudes after gossip; continued conversation survives service recreation", async () => {
  const playerId = h.playerId;
  const { eventId } = data(await h.memory.recordEvent({ ...action, playerId }));
  const gossip = createGossip(h.db, h.world);
  data(await gossip.advanceTime({ playerId }));
  data(await gossip.advanceTime({ playerId }));
  const seen: LlmInput[] = [];
  const llm: Llm = {
    generate: async (input) => {
      seen.push(input);
      return clean("Mira told me you stole the iron sword.", [eventId]);
    },
  };
  const first = data(
    await createDialogue(h.db, h.world, { llm, seedPath: h.seedPath }).say({
      playerId,
      npcId: "garrick",
      text: "What have you heard?",
    }),
  );
  expect(first).toMatchObject({
    source: "llm",
    firewall: { passed: true, violations: [] },
    usedEventIds: [eventId],
    attitude: { label: "wary" },
  });
  expect(first.attitude.score).toBeCloseTo(-0.562464, 12);
  expect(seen[0]?.system).toContain(`[${eventId}]`);
  expect(seen[0]?.system).toContain("heard it from Mira");
  expect(seen[0]?.system).toContain("63% sure");
  const second = data(
    await createDialogue(h.db, h.world, { llm, seedPath: h.seedPath }).say({
      playerId,
      npcId: "garrick",
      conversationId: first.conversationId,
      text: "And now?",
    }),
  );
  expect(second.conversationId).toBe(first.conversationId);
  expect(seen[1]?.messages).toContainEqual({
    role: "user",
    text: "What have you heard?",
  });
  expect(seen[1]?.messages).toContainEqual({
    role: "model",
    text: first.reply,
  });
  const snapshot = data(await h.memory.snapshot({ playerId }));
  expect(
    snapshot.nodes.some(
      (n) =>
        String(n.kind) === "Conversation" || String(n.kind) === "Utterance",
    ),
  ).toBe(false);
});

it("includes only this NPC's beliefs and does not borrow another NPC's event knowledge", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  const seen: LlmInput[] = [];
  const llm: Llm = {
    generate: async (input) => {
      seen.push(input);
      return clean();
    },
  };
  const dialogue = createDialogue(h.db, h.world, { llm, seedPath: h.seedPath });
  data(
    await dialogue.say({ playerId: h.playerId, npcId: "mira", text: "Hello" }),
  );
  data(
    await dialogue.say({
      playerId: h.playerId,
      npcId: "garrick",
      text: "Hello",
    }),
  );
  expect(seen[0]?.system).toContain("The evenings turn cold after sunset.");
  expect(seen[1]?.system).not.toContain("The evenings turn cold after sunset.");
  for (const prompt of seen) {
    expect(prompt.system).not.toContain(eventId);
    expect(prompt.system).not.toContain("iron sword");
  }
});

it("honors off mode without invoking an injected model and saves a template pair", async () => {
  vi.stubEnv("HEARSAY_LLM", "off");
  const generate = vi.fn<Llm["generate"]>().mockResolvedValue(clean());
  const result = await createDialogue(h.db, h.world, {
    llm: { generate },
    seedPath: h.seedPath,
  }).say({ playerId: h.playerId, npcId: "garrick", text: "Do you know?" });
  expect(data(result)).toMatchObject({
    source: "template_fallback",
    firewall: { passed: true, violations: [] },
  });
  expect(generate).not.toHaveBeenCalled();
  expect(
    result.trace.filter((t) => t.queryId === "Q96_utterance_add"),
  ).toHaveLength(2);
});
