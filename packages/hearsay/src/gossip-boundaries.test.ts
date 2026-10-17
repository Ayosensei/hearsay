import { beforeAll, beforeEach, afterAll, expect, it } from "vitest";
import { createGossip } from "./gossip";
import { data } from "./testing/world-harness";
import { memoryHarness } from "./testing/memory-harness";
import * as q from "./queries/gossip";

let h: Awaited<ReturnType<typeof memoryHarness>>;
let gossip: ReturnType<typeof createGossip>;
beforeAll(async () => {
  h = await memoryHarness();
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

it("reaches all five NPCs from a fresh theft at depth three with contract defaults", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  const result = data(await gossip.spread({ playerId: h.playerId, eventId }));
  expect(result.reached).toEqual(["ayla", "mira", "fenn", "garrick", "tilda"]);
  expect(result.steps.map((s) => s.hop)).toEqual([1, 1, 2, 2, 3]);
  expect(result.stoppedBecause).toBe("no_listeners");
  expect(data(await h.memory.snapshot({ playerId: h.playerId })).tick).toBe(0);
});

it("distinguishes credibility cutoff from lack of eligible listeners", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  const strict = data(
    await gossip.spread({ playerId: h.playerId, eventId, minCredibility: 0.9 }),
  );
  expect(strict.reached).toEqual(["mira"]);
  expect(strict.stoppedBecause).toBe("min_credibility");
  const stricter = data(
    await gossip.spread({ playerId: h.playerId, eventId, minCredibility: 1 }),
  );
  expect(stricter).toEqual({
    steps: [],
    reached: [],
    stoppedBecause: "min_credibility",
  });
  const quiet = data(
    await h.memory.recordEvent({
      ...action,
      playerId: h.playerId,
      type: "traded",
    }),
  );
  expect(
    data(
      await gossip.spread({
        playerId: h.playerId,
        eventId: quiet.eventId,
        minCredibility: 0,
      }),
    ),
  ).toEqual({ steps: [], reached: [], stoppedBecause: "no_listeners" });
});

it("processes every eligible event and includes the exact absolute-weight boundary", async () => {
  const boundary = data(
    await h.memory.recordEvent({
      ...action,
      playerId: h.playerId,
      weight: 0.3,
    }),
  );
  const negative = data(
    await h.memory.recordEvent({
      ...action,
      playerId: h.playerId,
      weight: -0.3,
    }),
  );
  const quiet = data(
    await h.memory.recordEvent({
      ...action,
      playerId: h.playerId,
      weight: 0.299,
    }),
  );
  const { steps, tick } = data(
    await gossip.advanceTime({ playerId: h.playerId }),
  );
  expect(tick).toBe(1);
  expect(steps).toHaveLength(4);
  for (const id of [boundary.eventId, negative.eventId])
    expect(
      steps.filter((s) => s.eventId === id).map((s) => s.listenerId),
    ).toEqual(["ayla", "mira"]);
  expect(steps.some((s) => s.eventId === quiet.eventId)).toBe(false);
});

it("advances an empty world and serializes concurrent ticks in one service", async () => {
  expect(data(await gossip.advanceTime({ playerId: h.playerId }))).toEqual({
    tick: 1,
    steps: [],
  });
  data(await h.memory.recordEvent({ ...action, playerId: h.playerId }));
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      gossip.advanceTime({ playerId: h.playerId }),
    ),
  );
  expect(results.map((r) => data(r).tick)).toEqual([2, 3, 4, 5]);
  expect(results.map((r) => data(r).steps.length)).toEqual([2, 2, 1, 0]);
  const { edges } = data(await h.memory.snapshot({ playerId: h.playerId }));
  expect(edges.filter((e) => e.type === "KNOWS")).toHaveLength(6);
  expect(edges.filter((e) => e.type === "TOLD")).toHaveLength(5);
});

it("serializes spread with advanceTime and keeps independent player clocks isolated", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  const [a, b, c] = await Promise.all([
    gossip.spread({ playerId: h.playerId, eventId, maxHops: 1 }),
    gossip.advanceTime({ playerId: h.playerId }),
    gossip.advanceTime({ playerId: h.otherPlayerId }),
  ]);
  expect(data(a).reached).toEqual(["ayla", "mira"]);
  expect(data(b).steps.map((s) => s.listenerId)).toEqual(["fenn", "garrick"]);
  expect(data(b).tick).toBe(1);
  expect(data(c)).toEqual({ tick: 1, steps: [] });
});

it("guards repeated write batches and refuses to overwrite a changed game tick", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  const graph = `player:${h.playerId}`;
  const rows = [
    {
      eventId,
      teller: "brom",
      listener: "mira",
      cred: 0.9,
      root: "brom",
      hop: 0,
    },
  ];
  const results = await Promise.all([
    h.db.run(graph, "Q41_gossip_write", q.Q41_gossip_write, { rows, tick: 0 }),
    h.db.run(graph, "Q41_gossip_write", q.Q41_gossip_write, { rows, tick: 0 }),
  ]);
  expect(results.map((r) => data(r).length).sort()).toEqual([0, 1]);
  expect(
    data(
      await h.db.run(graph, "Q21_set_tick", q.Q21_set_tick, {
        pid: h.playerId,
        previousTick: 0,
      }),
    ),
  ).toEqual([{ tick: 1 }]);
  expect(
    data(
      await h.db.run(graph, "Q21_set_tick", q.Q21_set_tick, {
        pid: h.playerId,
        previousTick: 0,
      }),
    ),
  ).toEqual([]);
  const { edges } = data(await h.memory.snapshot({ playerId: h.playerId }));
  expect(edges.filter((e) => e.type === "KNOWS")).toHaveLength(2);
  expect(edges.filter((e) => e.type === "TOLD")).toHaveLength(1);
});

it("validates arguments and resolves player/event IDs before any gossip write", async () => {
  expect(
    await gossip.spread({
      playerId: h.playerId,
      eventId: "ev_absent",
      maxHops: 0,
    }),
  ).toMatchObject({ ok: false, error: { code: "BAD_ARGS" }, trace: [] });
  expect(
    await gossip.advanceTime({ playerId: "invalid player" }),
  ).toMatchObject({ ok: false, error: { code: "BAD_ARGS" }, trace: [] });
  for (const result of [
    await gossip.advanceTime({ playerId: "absent_player" }),
    await gossip.spread({ playerId: "absent_player", eventId: "ev_absent" }),
  ]) {
    expect(result).toMatchObject({
      ok: false,
      error: { code: "UNKNOWN_PLAYER" },
    });
    expect(result.trace.map((t) => t.queryId)).toEqual(["Q00_graph_list"]);
  }
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  for (const id of [eventId, "ev_absent"]) {
    const result = await gossip.spread({
      playerId: h.otherPlayerId,
      eventId: id,
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "UNKNOWN_EVENT" },
    });
    expect(result.trace.at(-1)?.queryId).toBe("Q26_resolve_event");
  }
});
