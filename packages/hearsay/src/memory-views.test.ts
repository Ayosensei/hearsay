import { beforeAll, afterAll, expect, it } from "vitest";
import { data } from "./testing/world-harness";
import { memoryHarness } from "./testing/memory-harness";
import { Q41_gossip_write } from "./queries/spike";
import { QG4_hidden_metadata, QG4_set_tick } from "./queries/memory-test";

let h: Awaited<ReturnType<typeof memoryHarness>>;
beforeAll(async () => {
  h = await memoryHarness();
});
afterAll(async () => {
  if (h) await h.cleanup();
});

it("reports one witness and five unaware NPCs from the live golden world", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({
      playerId: h.playerId,
      type: "stole",
      placeId: "forge",
      witnesses: ["brom"],
    }),
  );
  const result = await h.memory.whoKnows({ playerId: h.playerId, eventId });
  expect(data(result)).toEqual({
    witnesses: ["brom"],
    heardFrom: [],
    unaware: ["ayla", "fenn", "garrick", "mira", "tilda"],
  });
  expect(result.trace.find((t) => t.queryId === "Q42_who_knows")).toMatchObject(
    { agent: "gossip", tool: "whoKnows", rows: 6 },
  );
  const snapshot = data(
    await h.memory.snapshot({ playerId: h.playerId, focusEventId: eventId }),
  );
  expect(snapshot.tick).toBe(0);
  expect(snapshot.nodes).toContainEqual(
    expect.objectContaining({
      id: `Event:${eventId}`,
      kind: "Event",
      props: expect.objectContaining({ id: eventId }),
    }),
  );
  expect(snapshot.edges).toContainEqual(
    expect.objectContaining({
      id: `KNOWS:NPC:brom->Event:${eventId}:${eventId}`,
      from: "NPC:brom",
      to: `Event:${eventId}`,
      type: "KNOWS",
      props: expect.objectContaining({ confidence: 1, via: "witness" }),
    }),
  );
  expect(snapshot.edges).toContainEqual(
    expect.objectContaining({
      from: `Player:${h.playerId}`,
      to: `Event:${eventId}`,
      type: "PERFORMED",
    }),
  );
  expect(snapshot.edges).toContainEqual(
    expect.objectContaining({
      from: `Event:${eventId}`,
      to: "Place:forge",
      type: "HAPPENED_AT",
    }),
  );
  const other = data(await h.memory.snapshot({ playerId: h.otherPlayerId }));
  expect(other.nodes.some((n) => n.kind === "Event")).toBe(false);
});

it("reads heard knowledge and stable TOLD IDs from actual graph edges", async () => {
  const { eventId } = data(
    await h.memory.recordEvent({
      playerId: h.playerId,
      type: "helped",
      placeId: "forge",
      witnesses: ["brom"],
    }),
  );
  // This seeds one real retelling; automated propagation remains task G5.
  data(
    await h.db.run(
      `player:${h.playerId}`,
      "Q41_gossip_write",
      Q41_gossip_write,
      {
        rows: [
          {
            eventId,
            teller: "brom",
            listener: "mira",
            cred: 0.9,
            root: "brom",
            hop: 0,
          },
        ],
        tick: 1,
      },
    ),
  );
  expect(
    data(await h.memory.whoKnows({ playerId: h.playerId, eventId })),
  ).toEqual({
    witnesses: ["brom"],
    heardFrom: [{ npcId: "mira", from: "brom", confidence: 0.9, hop: 1 }],
    unaware: ["ayla", "fenn", "garrick", "tilda"],
  });
  expect(
    data(await h.memory.recall({ playerId: h.playerId, npcId: "mira" })).items,
  ).toContainEqual(
    expect.objectContaining({
      eventId,
      learnedFrom: "brom",
      confidence: 0.9,
      hop: 1,
    }),
  );
  const { edges } = data(await h.memory.snapshot({ playerId: h.playerId }));
  expect(edges).toContainEqual(
    expect.objectContaining({
      id: `TOLD:NPC:brom->NPC:mira:${eventId}`,
      from: "NPC:brom",
      to: "NPC:mira",
      type: "TOLD",
    }),
  );
});

it("excludes hidden nodes and every incident edge while preserving stable snapshot IDs", async () => {
  const before = data(await h.memory.snapshot({ playerId: h.playerId }));
  data(
    await h.db.run(
      `player:${h.playerId}`,
      "QG4_hidden_metadata",
      QG4_hidden_metadata,
      { pid: h.playerId },
    ),
  );
  const after = data(await h.memory.snapshot({ playerId: h.playerId }));
  expect(after).toEqual(before);
  const ids = new Set(after.nodes.map((n) => n.id));
  expect(ids.size).toBe(after.nodes.length);
  expect(new Set(after.edges.map((e) => e.id)).size).toBe(after.edges.length);
  for (const edge of after.edges) {
    expect(ids.has(edge.from)).toBe(true);
    expect(ids.has(edge.to)).toBe(true);
  }
});

it("records current tick and recalls the latest tick first with the requested limit", async () => {
  data(
    await h.db.run(`player:${h.playerId}`, "QG4_set_tick", QG4_set_tick, {
      pid: h.playerId,
      tick: 7,
    }),
  );
  const event = data(
    await h.memory.recordEvent({
      playerId: h.playerId,
      type: "saved",
      placeId: "forge",
      witnesses: ["brom"],
    }),
  );
  expect(event).toMatchObject({ tick: 7, weight: 0.9 });
  expect(
    data(
      await h.memory.recall({ playerId: h.playerId, npcId: "brom", limit: 1 }),
    ).items,
  ).toEqual([expect.objectContaining({ eventId: event.eventId, tick: 7 })]);
  expect(data(await h.memory.snapshot({ playerId: h.playerId })).tick).toBe(7);
});
