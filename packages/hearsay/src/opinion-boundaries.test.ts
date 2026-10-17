import { beforeAll, beforeEach, afterAll, expect, it } from "vitest";
import { createOpinion } from "./opinion-tools";
import { createGossip } from "./gossip";
import { memoryHarness } from "./testing/memory-harness";
import { data } from "./testing/world-harness";
import { QG2_seed_trust } from "./queries/spike";
import * as q from "./queries/opinion-test";

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

it("walks and verifies real provenance beyond the four-hop traversal bound", async () => {
  const playerId = h.playerId,
    graph = `player:${playerId}`;
  data(await h.db.run(graph, "QG6_clear_trust", q.QG6_clear_trust));
  const ids = ["brom", "mira", "garrick", "fenn", "ayla", "tilda"];
  const trusts = ids
    .slice(1)
    .map((truster, index) => ({
      truster,
      trusted: ids[index] ?? "",
      weight: 1,
    }));
  data(await h.db.run(graph, "QG2_seed_trust", QG2_seed_trust, { trusts }));
  const { eventId } = data(await h.memory.recordEvent({ ...action, playerId }));
  for (let i = 0; i < 5; i++) data(await gossip.advanceTime({ playerId }));
  const result = await opinion.explain({ playerId, npcId: "tilda", eventId });
  const explanation = data(result);
  expect(explanation.chain.map((n) => n.npcId)).toEqual(ids);
  expect(explanation.hopConfidences).toEqual([1, 1, 1, 1, 1]);
  expect(explanation.edgeIds).toHaveLength(6);
  expect(
    result.trace.find((t) => t.queryId === "Q61_explain_chain")?.rows,
  ).toBe(0);
  expect(
    result.trace.filter((t) => t.queryId === "Q62_explain_link"),
  ).toHaveLength(5);
  const snapshot = data(await h.memory.snapshot({ playerId }));
  for (const id of explanation.edgeIds)
    expect(snapshot.edges.some((e) => e.id === id)).toBe(true);
});

it("returns INTERNAL when knowledge survives but its TOLD provenance is missing", async () => {
  const playerId = h.playerId;
  const { eventId } = data(await h.memory.recordEvent({ ...action, playerId }));
  data(await gossip.advanceTime({ playerId }));
  data(
    await h.db.run(`player:${playerId}`, "QG6_delete_told", q.QG6_delete_told, {
      eid: eventId,
    }),
  );
  const result = await opinion.explain({ playerId, npcId: "mira", eventId });
  expect(result).toMatchObject({
    ok: false,
    error: {
      code: "INTERNAL",
      message: "Knowledge provenance is incomplete or inconsistent.",
    },
  });
  expect(result.trace.at(-1)?.queryId).toBe("Q62_explain_link");
});

it("rejects a source pointer inconsistent with the returned graph path", async () => {
  const playerId = h.playerId;
  const { eventId } = data(await h.memory.recordEvent({ ...action, playerId }));
  data(await gossip.advanceTime({ playerId }));
  data(await gossip.advanceTime({ playerId }));
  data(
    await h.db.run(`player:${playerId}`, "QG6_corrupt_via", q.QG6_corrupt_via, {
      nid: "garrick",
      eid: eventId,
      via: "garrick",
    }),
  );
  expect(
    await opinion.explain({ playerId, npcId: "garrick", eventId }),
  ).toMatchObject({ ok: false, error: { code: "INTERNAL" } });
});

it("rejects malformed or missing identifiers before attitude/path business queries", async () => {
  expect(
    await opinion.attitude({ playerId: "invalid player", npcId: "brom" }),
  ).toMatchObject({ ok: false, error: { code: "BAD_ARGS" }, trace: [] });
  expect(
    await opinion.explain({
      playerId: h.playerId,
      npcId: "brom",
      eventId: "bad",
    }),
  ).toMatchObject({ ok: false, error: { code: "BAD_ARGS" }, trace: [] });
  const absentPlayer = await opinion.attitude({
    playerId: "absent_player",
    npcId: "brom",
  });
  const absentPlayerExplain = await opinion.explain({
    playerId: "absent_player",
    npcId: "brom",
    eventId: "ev_absent",
  });
  for (const result of [absentPlayer, absentPlayerExplain]) {
    expect(result).toMatchObject({
      ok: false,
      error: { code: "UNKNOWN_PLAYER" },
    });
    expect(result.trace.map((t) => t.queryId)).toEqual(["Q00_graph_list"]);
  }
  for (const result of [
    await opinion.attitude({ playerId: h.playerId, npcId: "missing_npc" }),
    await opinion.explain({
      playerId: h.playerId,
      npcId: "missing_npc",
      eventId: "ev_absent",
    }),
  ]) {
    expect(result).toMatchObject({ ok: false, error: { code: "UNKNOWN_NPC" } });
    expect(result.trace.at(-1)?.queryId).toBe("Q24_resolve_npcs");
  }
  const unknownEvent = await opinion.explain({
    playerId: h.playerId,
    npcId: "brom",
    eventId: "ev_absent",
  });
  expect(unknownEvent).toMatchObject({
    ok: false,
    error: { code: "UNKNOWN_EVENT" },
  });
  expect(unknownEvent.trace.at(-1)?.queryId).toBe("Q26_resolve_event");
});
