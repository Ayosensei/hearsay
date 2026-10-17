import { describe, expect, it } from "vitest";
import { getInitialTownState } from "../mock-data";
import { advanceSimulationTick, recordPlayerAction, sendMockDialogue } from "../mock-engine";
import { buildProvenance, pickHeadline, propagate, MIN_CONFIDENCE } from "../gossip";
import { answerFor } from "../dialogue";
import { PLACES } from "../places";
import { TownState } from "../types";

const must = <T>(env: { ok: true; data: T } | { ok: false; error: { code: string } }): T => {
  if (!env.ok) throw new Error(`expected ok, got ${env.error.code}`);
  return env.data;
};

const npcOf = (state: TownState, id: string) => {
  const npc = state.npcs.find((n) => n.id === id);
  if (!npc) throw new Error(`missing npc ${id}`);
  return npc;
};

describe("gossip propagation", () => {
  it("propagates rumors along TRUSTS edges with mathematical credibility decay", () => {
    const start = getInitialTownState();
    // Fenn knows the relic at 0.72 and trusts-edge (tilda -> fenn) is 0.50: 0.72 * 0.50 = 0.36
    const next = must(advanceSimulationTick(start));
    const tilda = npcOf(next, "tilda");
    expect(tilda.primaryRumor?.eventId).toBe("event_relic_theft");
    expect(tilda.primaryRumor?.confidence).toBeCloseTo(0.36, 2);
    expect(tilda.primaryRumor?.path).toEqual(["brom", "mira", "fenn", "tilda"]);
  });

  it("never lets a rumor fall below the cutoff (0.25) or echo back along its path", () => {
    let state = getInitialTownState();
    for (let i = 0; i < 6; i++) state = must(advanceSimulationTick(state));
    for (const npc of state.npcs) {
      for (const rumor of npc.rumors) {
        expect(rumor.confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE);
        expect(new Set(rumor.path).size).toBe(rumor.path.length);
      }
    }
  });

  it("does not mutate the previous state", () => {
    const start = getInitialTownState();
    const before = JSON.stringify(start.npcs);
    propagate(start.npcs, start.graphEdges);
    expect(JSON.stringify(start.npcs)).toBe(before);
  });

  it("prefers the most recently learned rumor on a full tie", () => {
    const [a, b] = [
      { ...npcOf(getInitialTownState(), "brom").rumors[0], eventId: "a" },
      { ...npcOf(getInitialTownState(), "brom").rumors[0], eventId: "b" },
    ];
    expect(pickHeadline([a, b])?.eventId).toBe("b");
  });
});

describe("provenance (Why? chain)", () => {
  it("rebuilds the golden path [brom -> mira -> garrick] with confidences [1.0, 0.90, 0.63]", () => {
    const state = getInitialTownState();
    const garrick = npcOf(state, "garrick");
    if (!garrick.primaryRumor) throw new Error("garrick should know the relic");
    const chain = buildProvenance(garrick.primaryRumor, state.npcs, state.graphEdges);
    expect(chain.hops.map((h) => h.npcId)).toEqual(["brom", "mira", "garrick"]);
    expect(chain.hops.map((h) => h.confidence)).toEqual([1, 0.9, 0.63]);
    expect(chain.hopCount).toBe(2);
    expect(chain.totalDecay).toBeCloseTo(0.37, 2);
  });
});

describe("knowledge firewall (mock dialogue)", () => {
  it("refuses to discuss an event the NPC never saw or heard", () => {
    const state = getInitialTownState();
    const tilda = npcOf(state, "tilda");
    const answer = answerFor(tilda, "What happened to the Sun-Stone relic?", state.events);
    expect(answer.rumor).toBeUndefined();
    expect(answer.text).toMatch(/don't know/i);
    expect(answer.topics).toContain("event_relic_theft");
  });

  it("answers from the rumor the question is actually about", () => {
    const state = getInitialTownState();
    const garrick = npcOf(state, "garrick");
    const answer = answerFor(garrick, "Tell me about the relic", state.events);
    expect(answer.rumor?.eventId).toBe("event_relic_theft");
  });

  it("returns UNKNOWN_NPC without touching state for a bad id", () => {
    const res = sendMockDialogue("nobody", "hi", getInitialTownState());
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNKNOWN_NPC");
  });

  it("rejects an empty message", () => {
    const res = sendMockDialogue("garrick", "   ", getInitialTownState());
    expect(res.ok).toBe(false);
  });
});

describe("recordPlayerAction", () => {
  it("only the witness knows at first; everyone else learns by gossip", () => {
    const start = getInitialTownState();
    const state = must(recordPlayerAction("Forge gate hinges", "help", "brom", PLACES[0], start));
    const known = state.npcs.filter((n) => n.rumors.some((r) => r.eventId.startsWith("event_player_")));
    expect(known.map((n) => n.id)).toEqual(["brom"]);
  });

  it("validates place, witness, action type and text before changing anything", () => {
    const s = getInitialTownState();
    const code = (r: ReturnType<typeof recordPlayerAction>) => (r.ok ? "OK" : r.error.code);
    expect(code(recordPlayerAction("x", "help", "brom", "Atlantis", s))).toBe("UNKNOWN_PLACE");
    expect(code(recordPlayerAction("x", "help", "ghost", PLACES[0], s))).toBe("UNKNOWN_NPC");
    // @ts-expect-error deliberately invalid action type
    expect(code(recordPlayerAction("x", "steal", "brom", PLACES[0], s))).toBe("INVALID_ACTION");
    expect(code(recordPlayerAction("   ", "help", "brom", PLACES[0], s))).toBe("EMPTY_ACTION");
  });

  it("keeps new event nodes inside the 640x440 graph viewBox", () => {
    let state = getInitialTownState();
    for (let i = 0; i < 12; i++) {
      state = must(recordPlayerAction(`Deed ${i}`, "help", "brom", PLACES[0], state));
    }
    for (const node of state.graphNodes) {
      expect(node.x ?? 0).toBeLessThanOrEqual(600);
      expect(node.y ?? 0).toBeLessThanOrEqual(400);
    }
  });

  it("gives unique ids to repeated actions and answers about the newest one", () => {
    let state = getInitialTownState();
    state = must(recordPlayerAction("Help forge iron", "help", "brom", PLACES[0], state));
    state = must(recordPlayerAction("Poison the well", "harm", "brom", PLACES[1], state));
    expect(new Set(state.events.map((e) => e.id)).size).toBe(state.events.length);
    expect(npcOf(state, "brom").primaryRumor?.eventTitle).toBe("Poison the well");
  });
});
