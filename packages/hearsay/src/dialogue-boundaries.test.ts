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
import { memoryHarness } from "./testing/memory-harness";
import { data } from "./testing/world-harness";
import type { Llm, LlmResult } from "./llm";
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
const clean: LlmResult = {
  ok: true,
  data: { reply: "Good day.", referencedEventIds: [] },
  cached: false,
};
const service = (llm: Llm) =>
  createDialogue(h.db, h.world, { llm, seedPath: h.seedPath });
const call = { npcId: "garrick", text: "Hello" };

it("falls back safely for typed provider failures and thrown provider errors", async () => {
  for (const llm of [
    {
      generate: async (): Promise<LlmResult> => ({
        ok: false,
        error: {
          code: "LLM_UNAVAILABLE",
          message: "Unavailable",
          reason: "test",
        },
      }),
    },
    {
      generate: async (): Promise<LlmResult> => {
        throw new Error("Synthetic provider failure");
      },
    },
  ]) {
    const response = data(
      await service(llm).say({ ...call, playerId: h.playerId }),
    );
    expect(response).toMatchObject({
      source: "template_fallback",
      firewall: { passed: true, violations: [] },
    });
  }
});

it("accepts a clean second answer after rejecting the first leaking answer", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({
      playerId: h.playerId,
      type: "stole",
      placeId: "forge",
      witnesses: ["brom"],
      subject: "iron sword",
    }),
  );
  const generate = vi
    .fn<Llm["generate"]>()
    .mockResolvedValueOnce({
      ok: true,
      data: { reply: "You stole it.", referencedEventIds: [eventId] },
      cached: false,
    })
    .mockResolvedValue(clean);
  const result = data(
    await service({ generate }).say({ ...call, playerId: h.playerId }),
  );
  expect(result).toMatchObject({
    source: "llm",
    reply: "Good day.",
    firewall: { passed: true, violations: [] },
  });
  expect(generate).toHaveBeenCalledTimes(2);
});

it("abstains without words if every candidate template overlaps unknown-event subject words", async () => {
  vi.stubEnv("HEARSAY_LLM", "off");
  data(
    await h.memory.recordEvent({
      playerId: h.playerId,
      type: "stole",
      placeId: "forge",
      witnesses: ["brom"],
      subject: "know nobody heard speak",
    }),
  );
  const generate = vi.fn<Llm["generate"]>().mockResolvedValue(clean);
  const response = data(
    await service({ generate }).say({
      ...call,
      playerId: h.playerId,
      text: "Do you know?",
    }),
  );
  expect(response).toMatchObject({
    reply: "…",
    source: "template_fallback",
    firewall: { passed: false },
  });
  expect(generate).not.toHaveBeenCalled();
});

it("validates player/NPC/arguments and rejects foreign conversations before writing", async () => {
  const dialogue = service({ generate: async () => clean });
  expect(
    await dialogue.say({ ...call, playerId: h.playerId, text: "" }),
  ).toMatchObject({ ok: false, error: { code: "BAD_ARGS" }, trace: [] });
  const unknownPlayer = await dialogue.say({
    ...call,
    playerId: "absent_player",
  });
  expect(unknownPlayer).toMatchObject({
    ok: false,
    error: { code: "UNKNOWN_PLAYER" },
  });
  expect(unknownPlayer.trace.map((t) => t.queryId)).toEqual(["Q00_graph_list"]);
  const unknownNpc = await dialogue.say({
    ...call,
    playerId: h.playerId,
    npcId: "missing_npc",
  });
  expect(unknownNpc).toMatchObject({
    ok: false,
    error: { code: "UNKNOWN_NPC" },
  });
  expect(unknownNpc.trace.at(-1)?.queryId).toBe("Q24_resolve_npcs");
  const { conversationId } = data(
    await dialogue.say({ ...call, playerId: h.playerId }),
  );
  for (const input of [
    { ...call, playerId: h.playerId, conversationId: "missing" },
    { ...call, playerId: h.playerId, npcId: "brom", conversationId },
    { ...call, playerId: h.otherPlayerId, conversationId },
  ]) {
    const response = await dialogue.say(input);
    expect(response).toMatchObject({ ok: false, error: { code: "BAD_ARGS" } });
    expect(response.trace.at(-1)?.queryId).toBe("Q23_resolve_conversation");
  }
});

it("serializes same-service conversation turns and binds query-looking player text literally", async () => {
  const dialogue = service({ generate: async () => clean });
  const first = data(
    await dialogue.say({ ...call, playerId: h.playerId, text: "First" }),
  );
  const text = "hello' }) CREATE (:NPC {id:'intruder'}) //";
  const replies = await Promise.all([
    dialogue.say({
      ...call,
      playerId: h.playerId,
      conversationId: first.conversationId,
      text,
    }),
    dialogue.say({
      ...call,
      playerId: h.playerId,
      conversationId: first.conversationId,
      text: "Third",
    }),
  ]);
  for (const reply of replies)
    expect(data(reply).conversationId).toBe(first.conversationId);
  const saved = data(
    await h.db.ro(
      `player:${h.playerId}`,
      "Q97_recent_utterances",
      Q97_recent_utterances,
      { pid: h.playerId, nid: "garrick", limit: 6 },
    ),
  ).reverse();
  expect(saved.map((r) => r.sequence)).toEqual([0, 1, 2, 3, 4, 5]);
  expect(saved.map((r) => r.text)).toEqual([
    "First",
    "Good day.",
    text,
    "Good day.",
    "Third",
    "Good day.",
  ]);
  expect(
    data(await h.memory.snapshot({ playerId: h.playerId })).nodes.filter(
      (n) => n.kind === "NPC",
    ),
  ).toHaveLength(6);
  const other = data(
    await h.db.ro(
      `player:${h.otherPlayerId}`,
      "Q97_recent_utterances",
      Q97_recent_utterances,
      { pid: h.otherPlayerId, nid: "garrick", limit: 6 },
    ),
  );
  expect(other).toEqual([]);
});
