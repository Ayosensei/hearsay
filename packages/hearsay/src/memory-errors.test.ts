import { beforeAll, afterAll, expect, it } from "vitest";
import { data } from "./testing/world-harness";
import { memoryHarness } from "./testing/memory-harness";
import { QG3_events } from "./queries/world-test";

let h: Awaited<ReturnType<typeof memoryHarness>>;
beforeAll(async () => {
  h = await memoryHarness();
});
afterAll(async () => {
  if (h) await h.cleanup();
});
const action = {
  type: "stole" as const,
  placeId: "forge",
  witnesses: ["brom"],
};

it("rejects malformed arguments before any database call", async () => {
  const results = await Promise.all([
    h.memory.recordEvent({ ...action, playerId: h.playerId, witnesses: [] }),
    h.memory.recordEvent({
      ...action,
      playerId: h.playerId,
      subject: "x".repeat(61),
    }),
    h.memory.recall({ playerId: h.playerId, npcId: "brom", limit: 0 }),
    h.memory.whoKnows({ playerId: h.playerId, eventId: "bad_event" }),
    h.memory.snapshot({ playerId: "invalid player" }),
  ]);
  for (const result of results)
    expect(result).toMatchObject({
      ok: false,
      error: { code: "BAD_ARGS" },
      trace: [],
    });
});

it("returns UNKNOWN_PLAYER for every tool and does not create a missing player graph", async () => {
  const playerId = `absent_${h.playerId.slice(-24)}`;
  const results = await Promise.all([
    h.memory.recordEvent({ ...action, playerId }),
    h.memory.recall({ playerId, npcId: "brom" }),
    h.memory.whoKnows({ playerId, eventId: "ev_absent" }),
    h.memory.snapshot({ playerId }),
  ]);
  for (const result of results) {
    expect(result).toMatchObject({
      ok: false,
      error: { code: "UNKNOWN_PLAYER" },
    });
    expect(result.trace.map((t) => t.queryId)).toEqual(["Q00_graph_list"]);
  }
  expect(data(await h.db.list())).not.toContain(`player:${playerId}`);
});

it("resolves every witness and location before writing an event", async () => {
  const graph = `player:${h.playerId}`;
  const before = data(await h.db.ro(graph, "QG3_events", QG3_events));
  const missingNpc = await h.memory.recordEvent({
    ...action,
    playerId: h.playerId,
    witnesses: ["brom", "missing_npc"],
  });
  expect(missingNpc).toMatchObject({
    ok: false,
    error: { code: "UNKNOWN_NPC" },
  });
  expect(missingNpc.trace.at(-1)?.queryId).toBe("Q24_resolve_npcs");
  const missingPlace = await h.memory.recordEvent({
    ...action,
    playerId: h.playerId,
    placeId: "missing_place",
  });
  expect(missingPlace).toMatchObject({
    ok: false,
    error: { code: "UNKNOWN_PLACE" },
  });
  expect(missingPlace.trace.at(-1)?.queryId).toBe("Q25_resolve_place");
  expect(data(await h.db.ro(graph, "QG3_events", QG3_events))).toEqual(before);
});

it("distinguishes an unknown NPC from a known NPC with no memories", async () => {
  const unknown = await h.memory.recall({
    playerId: h.playerId,
    npcId: "missing_npc",
  });
  expect(unknown).toMatchObject({ ok: false, error: { code: "UNKNOWN_NPC" } });
  expect(unknown.trace.at(-1)?.queryId).toBe("Q24_resolve_npcs");
  expect(
    data(await h.memory.recall({ playerId: h.playerId, npcId: "garrick" })),
  ).toEqual({ status: "not_in_graph", items: [] });
});

it("rejects nonexistent events and events belonging to another player before reading views", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({ ...action, playerId: h.playerId }),
  );
  for (const eid of [eventId, "ev_absent"]) {
    const results = [
      await h.memory.whoKnows({ playerId: h.otherPlayerId, eventId: eid }),
      await h.memory.snapshot({ playerId: h.otherPlayerId, focusEventId: eid }),
    ];
    for (const result of results) {
      expect(result).toMatchObject({
        ok: false,
        error: { code: "UNKNOWN_EVENT" },
      });
      expect(result.trace.at(-1)?.queryId).toBe("Q26_resolve_event");
    }
  }
});
