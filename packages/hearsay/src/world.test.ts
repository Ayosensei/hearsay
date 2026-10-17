import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { TOOLS } from "@hearsay/contract";
import { createWorld } from "./world";
import { data, worldHarness } from "./testing/world-harness";
import * as q from "./queries/world-test";
import { Q20_get_player } from "./queries/world";

let h: Awaited<ReturnType<typeof worldHarness>>;
beforeAll(async () => {
  h = await worldHarness();
});
afterAll(async () => {
  if (h) await h.cleanup();
});

describe("live world and player lifecycle", () => {
  it("ensureWorld publishes a complete template once and then performs no writes", async () => {
    expect(data(await h.world.ensureWorld())).toEqual({
      graph: h.templateGraph,
      created: true,
    });
    const before = data(
      await h.db.ro(h.templateGraph, "QG3_nodes", q.QG3_nodes),
    );
    const second = await h.world.ensureWorld();
    expect(data(second)).toEqual({ graph: h.templateGraph, created: false });
    expect(second.trace.map((t) => t.queryId)).toEqual(["Q00_graph_list"]);
    expect(
      data(await h.db.ro(h.templateGraph, "QG3_nodes", q.QG3_nodes)),
    ).toEqual(before);
    expect(
      data(await h.db.ro(h.templateGraph, "QG3_relations", q.QG3_relations)),
    ).toEqual([
      { type: "ALLIED_WITH", count: 1 },
      { type: "BELIEVES", count: 1 },
      { type: "FOLLOWS", count: 1 },
      { type: "HOSTILE_TO", count: 1 },
      { type: "MEMBER_OF", count: 3 },
      { type: "TRUSTS", count: 4 },
    ]);
  });

  it("getWorld returns contract-valid data through Q10, Q11 and Q12", async () => {
    const result = await h.world.getWorld();
    const world = TOOLS.getWorld.output.parse(data(result));
    expect(world.npcs.map((n) => n.id)).toEqual(["brom", "garrick", "mira"]);
    expect(world.places).toHaveLength(3);
    expect(world.eventTypes).toHaveLength(7);
    expect(result.trace.map((t) => t.queryId)).toEqual([
      "Q00_graph_list",
      "Q10_get_npcs",
      "Q11_get_places",
      "Q12_get_event_types",
    ]);
  });

  it("newPlayer twice is idempotent and starts at tick zero", async () => {
    const playerId = h.playerId();
    const creation = await h.world.newPlayer({ playerId, name: "Traveller" });
    const first = data(creation);
    const copies = creation.trace.filter(
      (step) => step.queryId === "Q01_graph_copy",
    );
    expect(copies).toHaveLength(2);
    expect(copies.every((step) => step.tool === "newPlayer")).toBe(true);
    expect(TOOLS.newPlayer.output.parse(first)).toEqual({
      playerId,
      graph: `player:${playerId}`,
      created: true,
    });
    expect(data(await h.world.newPlayer({ playerId }))).toEqual({
      ...first,
      created: false,
    });
    expect(
      data(
        await h.db.ro(first.graph, "Q20_get_player", Q20_get_player, {
          pid: playerId,
        }),
      ),
    ).toEqual([{ id: playerId, tick: 0 }]);
  });

  it("player changes cannot change another player or the template", async () => {
    const a = h.playerId();
    const b = h.playerId();
    const before = data(
      await h.db.ro(h.templateGraph, "QG3_nodes", q.QG3_nodes),
    );
    data(await h.world.newPlayer({ playerId: a }));
    data(await h.world.newPlayer({ playerId: b }));
    data(
      await h.db.run(`player:${a}`, "QG3_mutate_player", q.QG3_mutate_player, {
        pid: a,
      }),
    );
    expect(
      data(await h.db.ro(`player:${a}`, "QG3_events", q.QG3_events)),
    ).toEqual([{ count: 1 }]);
    expect(
      data(await h.db.ro(`player:${b}`, "QG3_events", q.QG3_events)),
    ).toEqual([{ count: 0 }]);
    expect(
      data(await h.db.ro(`player:${b}`, "QG3_policy", q.QG3_policy)),
    ).toEqual([{ greed: 0.4, markup: 0.1 }]);
    expect(
      data(await h.db.ro(h.templateGraph, "QG3_nodes", q.QG3_nodes)),
    ).toEqual(before);
  });

  it("resetPlayer restores tick, events, traits and policies from the template", async () => {
    const playerId = h.playerId();
    const graph = `player:${playerId}`;
    data(await h.world.newPlayer({ playerId }));
    data(
      await h.db.run(graph, "QG3_mutate_player", q.QG3_mutate_player, {
        pid: playerId,
      }),
    );
    expect(
      data(
        await h.db.ro(graph, "Q20_get_player", Q20_get_player, {
          pid: playerId,
        }),
      ),
    ).toEqual([{ id: playerId, tick: 9 }]);
    expect(data(await h.world.resetPlayer({ playerId }))).toEqual({
      playerId,
      tick: 0,
    });
    expect(
      data(
        await h.db.ro(graph, "Q20_get_player", Q20_get_player, {
          pid: playerId,
        }),
      ),
    ).toEqual([{ id: playerId, tick: 0 }]);
    expect(data(await h.db.ro(graph, "QG3_events", q.QG3_events))).toEqual([
      { count: 0 },
    ]);
    expect(data(await h.db.ro(graph, "QG3_policy", q.QG3_policy))).toEqual([
      { greed: 0.4, markup: 0.1 },
    ]);
  });

  it("concurrent creators publish one initialized player across service instances", async () => {
    const playerId = h.playerId();
    const second = createWorld(h.db, {
      templateGraph: h.templateGraph,
      seedPath: h.seedPath,
    });
    const results = await Promise.all([
      h.world.newPlayer({ playerId }),
      second.newPlayer({ playerId }),
      h.world.newPlayer({ playerId }),
    ]);
    expect(results.map(data).filter((r) => r.created)).toHaveLength(1);
    expect(
      data(
        await h.db.ro(`player:${playerId}`, "Q20_get_player", Q20_get_player, {
          pid: playerId,
        }),
      ),
    ).toEqual([{ id: playerId, tick: 0 }]);
  });
});
