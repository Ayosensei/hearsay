import { beforeAll, beforeEach, afterAll, expect, it } from "vitest";
import { createOpinion } from "./opinion-tools";
import { createGossip } from "./gossip";
import { memoryHarness } from "./testing/memory-harness";
import { data } from "./testing/world-harness";

let h: Awaited<ReturnType<typeof memoryHarness>>;
let opinion: ReturnType<typeof createOpinion>;
let gossip: ReturnType<typeof createGossip>;
beforeAll(async () => {
  h = await memoryHarness();
  opinion = createOpinion(h.db, h.world);
  gossip = createGossip(h.db, h.world);
});
beforeEach(async () => {
  data(await h.world.resetPlayer({ playerId: h.playerId }));
});
afterAll(async () => {
  if (h) await h.cleanup();
});
const action = {
  type: "stole" as const,
  placeId: "forge",
  witnesses: ["brom"],
};

it("returns neutral with no events and no contributions for an unaware NPC", async () => {
  expect(
    data(await opinion.attitude({ playerId: h.playerId, npcId: "garrick" })),
  ).toEqual({ score: 0, label: "neutral", contributions: [] });
  data(await h.memory.recordEvent({ ...action, playerId: h.playerId }));
  expect(
    data(await opinion.attitude({ playerId: h.playerId, npcId: "garrick" })),
  ).toEqual({ score: 0, label: "neutral", contributions: [] });
});

it("scores actual memories and explains Garrick through Brom and Mira with snapshot edge IDs", async () => {
  const playerId = h.playerId;
  const { eventId } = data(await h.memory.recordEvent({ ...action, playerId }));
  data(await gossip.advanceTime({ playerId }));
  data(await gossip.advanceTime({ playerId }));
  const attitude = await opinion.attitude({ playerId, npcId: "garrick" });
  expect(data(attitude).score).toBeCloseTo(-0.562464, 12);
  expect(data(attitude)).toMatchObject({
    label: "wary",
    contributions: [
      { eventId, type: "stole", confidence: 0.63, learnedFrom: "mira" },
    ],
  });
  expect(
    attitude.trace.find((t) => t.queryId === "Q51_attitude_inputs"),
  ).toMatchObject({ agent: "npc", tool: "attitude", rows: 1 });
  const brom = data(await opinion.attitude({ playerId, npcId: "brom" }));
  expect(brom.score).toBeCloseTo(-0.7632, 12);
  expect(brom.label).toBe("hostile");
  const result = await opinion.explain({ playerId, npcId: "garrick", eventId });
  const explanation = data(result);
  expect(explanation).toEqual({
    status: "known",
    learnedFrom: "mira",
    chain: [
      { npcId: "brom", name: "Brom" },
      { npcId: "mira", name: "Mira" },
      { npcId: "garrick", name: "Garrick" },
    ],
    hopConfidences: [0.9, 0.63],
    edgeIds: [
      `TOLD:NPC:brom->NPC:mira:${eventId}`,
      `TOLD:NPC:mira->NPC:garrick:${eventId}`,
      `KNOWS:NPC:garrick->Event:${eventId}:${eventId}`,
    ],
  });
  expect(
    result.trace.find((t) => t.queryId === "Q61_explain_chain"),
  ).toMatchObject({ tool: "explain", agent: "npc", rows: 1 });
  const snapshot = data(await h.memory.snapshot({ playerId }));
  for (const id of explanation.edgeIds)
    expect(snapshot.edges.some((edge) => edge.id === id)).toBe(true);
  expect(
    data(
      await opinion.attitude({ playerId: h.otherPlayerId, npcId: "garrick" }),
    ),
  ).toEqual({ score: 0, label: "neutral", contributions: [] });
  expect(
    await opinion.explain({
      playerId: h.otherPlayerId,
      npcId: "garrick",
      eventId,
    }),
  ).toMatchObject({ ok: false, error: { code: "UNKNOWN_EVENT" } });
});

it("distinguishes direct witnessing from a valid event an NPC has not learned", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  const witness = await opinion.explain({
    playerId: h.playerId,
    npcId: "brom",
    eventId,
  });
  expect(data(witness)).toEqual({
    status: "known",
    learnedFrom: "witness",
    chain: [{ npcId: "brom", name: "Brom" }],
    hopConfidences: [],
    edgeIds: [`KNOWS:NPC:brom->Event:${eventId}:${eventId}`],
  });
  expect(witness.trace.some((t) => t.queryId === "Q61_explain_chain")).toBe(
    false,
  );
  expect(
    data(
      await opinion.explain({ playerId: h.playerId, npcId: "tilda", eventId }),
    ),
  ).toEqual({
    status: "not_in_graph",
    learnedFrom: null,
    chain: [],
    hopConfidences: [],
    edgeIds: [],
  });
});

it("keeps different events' paths and contribution provenance separate", async () => {
  const playerId = h.playerId;
  const theft = data(await h.memory.recordEvent({ ...action, playerId }));
  const help = data(
    await h.memory.recordEvent({
      ...action,
      playerId,
      type: "helped",
      witnesses: ["mira"],
    }),
  );
  data(await gossip.advanceTime({ playerId }));
  data(await gossip.advanceTime({ playerId }));
  const first = data(
    await opinion.explain({
      playerId,
      npcId: "garrick",
      eventId: theft.eventId,
    }),
  );
  const second = data(
    await opinion.explain({
      playerId,
      npcId: "garrick",
      eventId: help.eventId,
    }),
  );
  expect(first.chain.map((n) => n.npcId)).toEqual(["brom", "mira", "garrick"]);
  expect(second.chain.map((n) => n.npcId)).toEqual(["mira", "garrick"]);
  expect(second.hopConfidences).toEqual([0.7]);
  expect(second.edgeIds.every((id) => id.endsWith(`:${help.eventId}`))).toBe(
    true,
  );
  const scored = data(await opinion.attitude({ playerId, npcId: "garrick" }));
  expect(scored.contributions).toHaveLength(2);
  expect(scored.score).toBeCloseTo(-0.562464 + 0.5 * 0.7 * 0.9 * 1.18, 12);
});
