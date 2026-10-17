import { afterAll, beforeAll, expect, it } from "vitest";
import { createGossip } from "./gossip";
import { data } from "./testing/world-harness";
import { memoryHarness } from "./testing/memory-harness";

let h: Awaited<ReturnType<typeof memoryHarness>>;
let gossip: ReturnType<typeof createGossip>;
beforeAll(async () => {
  h = await memoryHarness();
  gossip = createGossip(h.db, h.world);
});
afterAll(async () => {
  if (h) await h.cleanup();
});

it("advances the golden rumor exactly one hop per tick and preserves provenance", async () => {
  const original = data(await h.memory.snapshot({ playerId: h.playerId }));
  const { eventId } = data(
    await h.memory.recordEvent({
      playerId: h.playerId,
      type: "stole",
      placeId: "forge",
      witnesses: ["brom"],
    }),
  );
  const recorded = data(
    await h.memory.snapshot({ playerId: h.playerId }),
  ).nodes.find((n) => n.id === `Event:${eventId}`);
  const rounds = [
    [
      { listenerId: "ayla", tellerId: "brom", credibility: 0.5, hop: 1 },
      { listenerId: "mira", tellerId: "brom", credibility: 0.9, hop: 1 },
    ],
    [
      { listenerId: "fenn", tellerId: "mira", credibility: 0.72, hop: 2 },
      { listenerId: "garrick", tellerId: "mira", credibility: 0.63, hop: 2 },
    ],
    [{ listenerId: "tilda", tellerId: "fenn", credibility: 0.36, hop: 3 }],
    [],
  ];
  for (const [index, expected] of rounds.entries()) {
    const result = await gossip.advanceTime({ playerId: h.playerId });
    const actual = data(result);
    expect(actual.tick).toBe(index + 1);
    expect(actual.steps).toHaveLength(expected.length);
    for (const [i, step] of actual.steps.entries()) {
      const target = expected[i];
      expect(step).toMatchObject({
        eventId,
        listenerId: target?.listenerId,
        tellerId: target?.tellerId,
        hop: target?.hop,
      });
      expect(step.credibility).toBeCloseTo(target?.credibility ?? 0, 9);
    }
    expect(
      result.trace.find((t) => t.queryId === "Q40_gossip_candidates_all"),
    ).toMatchObject({ tool: "advanceTime", agent: "gossip" });
    if (index === 0)
      expect(
        data(await h.memory.recall({ playerId: h.playerId, npcId: "garrick" }))
          .status,
      ).toBe("not_in_graph");
  }
  const snapshot = data(await h.memory.snapshot({ playerId: h.playerId }));
  expect(snapshot.nodes.find((n) => n.id === `Event:${eventId}`)).toEqual(
    recorded,
  );
  const knows = snapshot.edges.filter((e) => e.type === "KNOWS");
  expect(knows).toHaveLength(6);
  expect(new Set(knows.map((e) => e.id)).size).toBe(6);
  expect(snapshot.edges.filter((e) => e.type === "TOLD")).toHaveLength(5);
  expect(knows.find((e) => e.from === "NPC:tilda")?.props).toMatchObject({
    via: "fenn",
    root: "brom",
    hop: 3,
    tick: 3,
  });
  expect(
    data(await h.memory.recall({ playerId: h.otherPlayerId, npcId: "brom" }))
      .items,
  ).toEqual([]);
  expect(
    data(await h.memory.snapshot({ playerId: h.otherPlayerId })).nodes,
  ).toHaveLength(original.nodes.length);
});

it("spreads to depth one then depth three without advancing game time or duplicating knowledge", async () => {
  const playerId = h.otherPlayerId;
  const { eventId } = data(
    await h.memory.recordEvent({
      playerId,
      type: "stole",
      placeId: "forge",
      witnesses: ["brom"],
    }),
  );
  const shallow = data(await gossip.spread({ playerId, eventId, maxHops: 1 }));
  expect(shallow.reached).toEqual(["ayla", "mira"]);
  expect(shallow.stoppedBecause).toBe("max_hops");
  const deep = data(await gossip.spread({ playerId, eventId, maxHops: 3 }));
  expect(deep.reached).toEqual(["fenn", "garrick", "tilda"]);
  expect(deep.stoppedBecause).toBe("no_listeners");
  expect(data(await gossip.spread({ playerId, eventId, maxHops: 3 }))).toEqual({
    steps: [],
    reached: [],
    stoppedBecause: "no_listeners",
  });
  const snapshot = data(await h.memory.snapshot({ playerId }));
  expect(snapshot.tick).toBe(0);
  expect(snapshot.edges.filter((e) => e.type === "KNOWS")).toHaveLength(6);
  expect(snapshot.edges.filter((e) => e.type === "TOLD")).toHaveLength(5);
  for (const edge of snapshot.edges.filter((e) => e.type === "TOLD"))
    expect(edge.props.tick).toBe(0);
});
