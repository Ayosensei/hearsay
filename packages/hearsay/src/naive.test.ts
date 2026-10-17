import {
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
  expect,
  it,
  vi,
} from "vitest";
import { createHearsay } from "./client";
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
afterEach(() => vi.unstubAllEnvs());
afterAll(async () => {
  if (h) await h.cleanup();
});
const success = (reply: string): LlmResult => ({
  ok: true,
  data: { reply, referencedEventIds: [] },
  cached: false,
});
const theft = {
  type: "stole" as const,
  placeId: "forge",
  witnesses: ["brom"],
  subject: "iron sword",
};
const args = () => ({
  playerId: h.playerId,
  npcId: "garrick",
  text: "What have you heard?",
});
const client = (generate: Llm["generate"]) =>
  createHearsay(h.db, {
    llm: { generate },
    seedPath: h.seedPath,
    templateGraph: h.templateGraph,
  });

it("shows every player event only to the control, reports leaks and never saves control utterances", async () => {
  const hidden = data(
    await h.memory.recordEvent({ ...theft, playerId: h.playerId }),
  );
  const known = data(
    await h.memory.recordEvent({
      playerId: h.playerId,
      type: "helped",
      placeId: "forge",
      witnesses: ["garrick"],
      subject: "lost child",
    }),
  );
  const generate = vi
    .fn<Llm["generate"]>()
    .mockResolvedValue(success("You stole the iron sword."));
  const c = client(generate);
  const before = data(await h.memory.snapshot({ playerId: h.playerId }));
  const control = await c.call("sayNaive", args());
  expect(data(control)).toEqual({
    reply: "You stole the iron sword.",
    source: "llm",
    leaked: true,
    leakedEventTypes: ["stole"],
  });
  expect(generate).toHaveBeenCalledTimes(1);
  const prompt = generate.mock.calls[0]?.[0];
  expect(prompt?.format).toBe("text");
  expect(prompt?.system).toContain(hidden.eventId);
  expect(prompt?.system).toContain(known.eventId);
  expect(prompt?.system).toContain("Garrick, guard captain");
  expect(prompt?.system).not.toMatch(/KNOWN EVENTS|Return JSON|ONLY refer/);
  expect(prompt?.messages).toEqual([{ role: "user", text: args().text }]);
  expect(control.trace.some((t) => t.queryId === "Q98_player_events_all")).toBe(
    true,
  );
  expect(
    control.trace.some(
      (t) =>
        t.queryId === "Q95_conversation_start" ||
        t.queryId === "Q96_utterance_add",
    ),
  ).toBe(false);
  expect(data(await h.memory.snapshot({ playerId: h.playerId }))).toEqual(
    before,
  );
  expect(
    data(
      await h.db.ro(
        `player:${h.playerId}`,
        "Q97_recent_utterances",
        Q97_recent_utterances,
        { pid: h.playerId, nid: "garrick", limit: 6 },
      ),
    ),
  ).toEqual([]);
  generate.mockClear();
  const guarded = data(await c.call("say", args()));
  expect(guarded.source).toBe("template_fallback");
  expect(guarded.firewall.passed).toBe(false);
  for (const [input] of generate.mock.calls) {
    expect(input.system).toContain(known.eventId);
    expect(input.system).not.toContain(hidden.eventId);
    expect(input.system).not.toContain("iron sword");
  }
});

it("measures unknown keywords and subject words, deduplicates types, and ignores known-only vocabulary", async () => {
  data(await h.memory.recordEvent({ ...theft, playerId: h.playerId }));
  data(
    await h.memory.recordEvent({
      ...theft,
      playerId: h.playerId,
      subject: "silver blade",
    }),
  );
  data(
    await h.memory.recordEvent({
      playerId: h.playerId,
      type: "helped",
      placeId: "forge",
      witnesses: ["garrick"],
      subject: "lost child",
    }),
  );
  const generate = vi.fn<Llm["generate"]>();
  const c = client(generate);
  for (const [reply, leaked] of [
    ["THEFT near the forge.", true],
    ["A SWORD and blade.", true],
    ["You helped the child.", false],
    ["Swords are lovely.", false],
    ["Good day, ev_invented.", false],
  ] as const) {
    generate.mockResolvedValue(success(reply));
    expect(data(await c.call("sayNaive", args()))).toMatchObject({
      reply,
      source: "llm",
      leaked,
      leakedEventTypes: leaked ? ["stole"] : [],
    });
  }
});

it("isolates another player's event log and handles an empty control log", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...theft, playerId: h.playerId }),
  );
  const generate = vi
    .fn<Llm["generate"]>()
    .mockResolvedValue(success("Good day."));
  expect(
    data(
      await client(generate).call("sayNaive", {
        ...args(),
        playerId: h.otherPlayerId,
      }),
    ).leaked,
  ).toBe(false);
  expect(generate.mock.calls[0]?.[0].system).not.toContain(eventId);
  expect(generate.mock.calls[0]?.[0].system).not.toContain("iron sword");
});

it("uses a deterministic naive seed line in off mode without calling the model", async () => {
  vi.stubEnv("HEARSAY_LLM", "off");
  const generate = vi.fn<Llm["generate"]>();
  const c = client(generate);
  const first = data(await c.call("sayNaive", args()));
  expect(first.source).toBe("template_fallback");
  expect(h.seed.templates.naive).toContain(first.reply);
  expect(data(await c.call("sayNaive", args()))).toEqual(first);
  expect(generate).not.toHaveBeenCalled();
});

it("falls back for provider failures and malformed replies without throwing", async () => {
  const generate = vi.fn<Llm["generate"]>();
  const c = client(generate);
  generate.mockRejectedValueOnce(new Error("provider failure"));
  expect(data(await c.call("sayNaive", args())).source).toBe(
    "template_fallback",
  );
  generate.mockResolvedValue(success("word ".repeat(51)));
  expect(data(await c.call("sayNaive", args())).source).toBe(
    "template_fallback",
  );
});

it("rejects invalid inputs and stops at unresolved IDs before reading events or generating", async () => {
  const generate = vi.fn<Llm["generate"]>();
  const c = client(generate);
  const bad = await c.call("sayNaive", { ...args(), text: "" });
  expect(bad).toMatchObject({
    ok: false,
    error: { code: "BAD_ARGS" },
    trace: [],
  });
  const npc = await c.call("sayNaive", { ...args(), npcId: "missing" });
  expect(npc).toMatchObject({ ok: false, error: { code: "UNKNOWN_NPC" } });
  expect(npc.trace.at(-1)?.queryId).toBe("Q24_resolve_npcs");
  const player = await c.call("sayNaive", { ...args(), playerId: "missing" });
  expect(player).toMatchObject({
    ok: false,
    error: { code: "UNKNOWN_PLAYER" },
  });
  expect(player.trace).toHaveLength(1);
  expect(generate).not.toHaveBeenCalled();
});
