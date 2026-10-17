import { describe, expect, it } from "vitest";
import { EventId, Id, TOOLS } from "./index";

describe("public tool boundaries", () => {
  it("rejects unsafe identifiers before they can select a graph", () => {
    for (const id of ["", "../a", "player:a", "a b", "A", "a".repeat(41)]) {
      expect(Id.safeParse(id).success).toBe(false);
    }
    expect(Id.parse("player_a-1")).toBe("player_a-1");
    expect(EventId.safeParse("event_1").success).toBe(false);
    expect(EventId.parse("ev_abc123")).toBe("ev_abc123");
  });

  it("requires a supported action, place and at least one witness", () => {
    const valid = { playerId: "a", type: "stole", placeId: "forge", witnesses: ["brom"] };
    expect(TOOLS.recordEvent.input.safeParse(valid).success).toBe(true);
    for (const invalid of [
      { ...valid, type: "harm" },
      { ...valid, witnesses: [] },
      { ...valid, witnesses: Array.from({ length: 7 }, () => "brom") },
      { ...valid, weight: 1.1 },
      { ...valid, placeId: "../forge" },
    ]) {
      expect(TOOLS.recordEvent.input.safeParse(invalid).success).toBe(false);
    }
  });

  it("applies documented gossip defaults and bounds", () => {
    expect(TOOLS.spread.input.parse({ playerId: "a", eventId: "ev_1" })).toEqual({
      playerId: "a", eventId: "ev_1", maxHops: 3, minCredibility: 0.25,
    });
    expect(TOOLS.spread.input.safeParse({ playerId: "a", eventId: "ev_1", maxHops: 5 }).success).toBe(false);
    expect(TOOLS.recall.input.parse({ playerId: "a", npcId: "garrick" }).limit).toBe(10);
  });

  it("accepts an honest absence of knowledge as a successful output", () => {
    expect(TOOLS.explain.output.parse({
      status: "not_in_graph", learnedFrom: null, chain: [], hopConfidences: [], edgeIds: [],
    }).status).toBe("not_in_graph");
    expect(TOOLS.recall.output.parse({ status: "not_in_graph", items: [] }).items).toEqual([]);
  });

  it("bounds dialogue input and rejects out-of-range graph confidence", () => {
    expect(TOOLS.say.input.safeParse({ playerId: "a", npcId: "brom", text: "" }).success).toBe(false);
    expect(TOOLS.say.input.safeParse({ playerId: "a", npcId: "brom", text: "a".repeat(401) }).success).toBe(false);
    expect(TOOLS.explain.output.safeParse({
      status: "known", learnedFrom: "mira", chain: [], hopConfidences: [1.1], edgeIds: [],
    }).success).toBe(false);
  });
});
