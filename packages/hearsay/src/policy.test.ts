import { beforeAll, afterAll, expect, it } from "vitest";
import { memoryHarness } from "./testing/memory-harness";
import { data } from "./testing/world-harness";
import { createPolicy } from "./policy";
import { Q04_seed_policies, Q04_seed_follows } from "./queries/seed";
let h: Awaited<ReturnType<typeof memoryHarness>>;
beforeAll(async () => {
  h = await memoryHarness();
});
afterAll(async () => {
  if (h) await h.cleanup();
});
it("adapts Tilda's real policy with caps, fair floor and persistent counters", async () => {
  const graph = `player:${h.playerId}`;
  data(
    await h.db.run(graph, "Q04_seed_policies", Q04_seed_policies, {
      rows: [
        {
          id: "haggle_tilda",
          kind: "haggle",
          markup: 0.1,
          minMarkup: 0.05,
          maxMarkup: 0.3,
          step: 0.05,
        },
      ],
    }),
  );
  data(
    await h.db.run(graph, "Q04_seed_follows", Q04_seed_follows, {
      rows: [{ npc: "tilda", policy: "haggle_tilda" }],
    }),
  );
  const policy = createPolicy(h.db, h.world);
  const args = {
    playerId: h.playerId,
    npcId: "tilda",
    policyId: "haggle_tilda",
  };
  for (const expected of [0.15, 0.2, 0.25, 0.3, 0.3])
    expect(
      data(await policy.adaptPolicy({ ...args, outcome: "lowballed" })).after
        .markup,
    ).toBeCloseTo(expected, 12);
  const fair = data(await policy.adaptPolicy({ ...args, outcome: "fair" }));
  expect(fair.after.markup).toBeCloseTo(0.28, 12);
  expect(fair).toMatchObject({ tries: 6, wins: 1 });
  for (let i = 0; i < 15; i++)
    data(await policy.adaptPolicy({ ...args, outcome: "fair" }));
  const floor = data(await policy.adaptPolicy({ ...args, outcome: "fair" }));
  expect(floor).toMatchObject({ after: { markup: 0.05 }, tries: 22, wins: 17 });
  expect(
    await policy.adaptPolicy({
      ...args,
      playerId: h.otherPlayerId,
      outcome: "fair",
    }),
  ).toMatchObject({ ok: false, error: { code: "UNKNOWN_POLICY" } });
});
it("ranks actual seed hubs and validates identifiers before business writes", async () => {
  const policy = createPolicy(h.db, h.world);
  for (const input of [{ playerId: h.playerId, limit: 6 }, { limit: 6 }])
    expect(
      data(await policy.gossipHubs(input)).hubs.map((n) => n.npcId),
    ).toEqual(["mira", "tilda", "fenn", "garrick", "brom", "ayla"]);
  expect(await policy.gossipHubs({ limit: 0 })).toMatchObject({
    ok: false,
    error: { code: "BAD_ARGS" },
    trace: [],
  });
  expect(await policy.gossipHubs({ playerId: "absent_player" })).toMatchObject({
    ok: false,
    error: { code: "UNKNOWN_PLAYER" },
  });
  const result = await policy.adaptPolicy({
    playerId: h.playerId,
    npcId: "absent_npc",
    policyId: "missing",
    outcome: "fair",
  });
  expect(result).toMatchObject({ ok: false, error: { code: "UNKNOWN_NPC" } });
  expect(result.trace.at(-1)?.queryId).toBe("Q24_resolve_npcs");
});
