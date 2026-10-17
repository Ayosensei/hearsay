import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { TOOLS } from "@hearsay/contract";
import { data } from "./testing/world-harness";
import { memoryHarness } from "./testing/memory-harness";
import { QG3_events, QG3_nodes } from "./queries/world-test";

let h: Awaited<ReturnType<typeof memoryHarness>>;
beforeAll(async () => {
  h = await memoryHarness();
});
afterAll(async () => {
  if (h) await h.cleanup();
});

describe("live event recording and recall tools", () => {
  it("only Brom remembers a theft he witnessed; Garrick successfully knows nothing", async () => {
    const result = await h.memory.recordEvent({
      playerId: h.playerId,
      type: "stole",
      placeId: "forge",
      witnesses: ["brom"],
      subject: "iron sword",
    });
    const event = TOOLS.recordEvent.output.parse(data(result));
    expect(event).toMatchObject({ tick: 0, weight: -0.8, witnesses: ["brom"] });
    expect(event.eventId).toMatch(/^ev_[a-z0-9]+$/);
    const write = result.trace.find((t) => t.queryId === "Q30_record_event");
    expect(write).toMatchObject({
      agent: "scribe",
      tool: "recordEvent",
      rows: 1,
    });
    expect(write?.ms).toBeGreaterThanOrEqual(0);
    const brom = data(
      await h.memory.recall({ playerId: h.playerId, npcId: "brom" }),
    );
    expect(TOOLS.recall.output.parse(brom)).toEqual({
      status: "known",
      items: [
        {
          eventId: event.eventId,
          type: "stole",
          placeId: "forge",
          weight: -0.8,
          tick: 0,
          learnedFrom: "witness",
          confidence: 1,
          hop: 0,
        },
      ],
    });
    expect(
      data(await h.memory.recall({ playerId: h.playerId, npcId: "garrick" })),
    ).toEqual({ status: "not_in_graph", items: [] });
    expect(
      data(await h.memory.recall({ playerId: h.otherPlayerId, npcId: "brom" })),
    ).toEqual({ status: "not_in_graph", items: [] });
  });

  it("supports multiple witnesses, deduplicates them and preserves an explicit zero weight", async () => {
    const event = data(
      await h.memory.recordEvent({
        playerId: h.playerId,
        type: "traded",
        placeId: "inn",
        witnesses: ["mira", "mira", "ayla"],
        weight: 0,
      }),
    );
    expect(event.witnesses).toEqual(["mira", "ayla"]);
    expect(event.weight).toBe(0);
    for (const npcId of ["mira", "ayla"]) {
      const items = data(
        await h.memory.recall({ playerId: h.playerId, npcId }),
      ).items;
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        eventId: event.eventId,
        confidence: 1,
        learnedFrom: "witness",
      });
    }
  });

  it("returns valid unique event IDs for concurrent records and honors recall limits", async () => {
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        h.memory.recordEvent({
          playerId: h.playerId,
          type: "helped",
          placeId: "forge",
          witnesses: ["fenn"],
        }),
      ),
    );
    const ids = results.map((r) => data(r).eventId);
    expect(new Set(ids).size).toBe(4);
    expect(
      data(
        await h.memory.recall({
          playerId: h.playerId,
          npcId: "fenn",
          limit: 2,
        }),
      ).items,
    ).toHaveLength(2);
  });

  it("binds query-looking subject text without creating extra events or NPCs", async () => {
    const graph = `player:${h.playerId}`;
    const before = data(await h.db.ro(graph, "QG3_events", QG3_events));
    const subject = "sword' }) CREATE (:NPC {id:'intruder'}) //";
    data(
      await h.memory.recordEvent({
        playerId: h.playerId,
        type: "stole",
        placeId: "forge",
        witnesses: ["brom"],
        subject,
      }),
    );
    const after = data(await h.db.ro(graph, "QG3_events", QG3_events));
    expect(Number(after[0]?.count)).toBe(Number(before[0]?.count) + 1);
    const nodes = data(await h.db.ro(graph, "QG3_nodes", QG3_nodes));
    expect(
      nodes.filter((n) => Array.isArray(n.labels) && n.labels.includes("NPC")),
    ).toHaveLength(6);
    expect(nodes).toContainEqual({
      labels: ["Event"],
      props: expect.objectContaining({ subject }),
    });
  });
});
