import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createWorld } from "./world";
import { data, worldHarness } from "./testing/world-harness";

let h: Awaited<ReturnType<typeof worldHarness>>;
beforeAll(async () => {
  h = await worldHarness();
});
afterAll(async () => {
  if (h) await h.cleanup();
});

describe("world publication boundaries on real FalkorDB", () => {
  it("rejects invalid player arguments without running database operations", async () => {
    for (const result of [
      await h.world.newPlayer({ playerId: "../unsafe" }),
      await h.world.newPlayer({ playerId: "valid", name: "x".repeat(41) }),
      await h.world.resetPlayer({ playerId: "player:unsafe" }),
    ])
      expect(result).toMatchObject({
        ok: false,
        error: { code: "BAD_ARGS" },
        trace: [],
      });
  });

  it("reset rejects an unknown player and leaves the graph list unchanged", async () => {
    const before = data(await h.db.list()).sort();
    const result = await h.world.resetPlayer({ playerId: h.playerId() });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "UNKNOWN_PLAYER" },
    });
    expect(data(await h.db.list()).sort()).toEqual(before);
  });

  it("a dangling seed reference fails loudly before creating any graph", async () => {
    const invalid = await h.alternative({
      ...h.seed,
      trusts: [{ truster: "ghost", trusted: "brom", weight: 0.9 }],
    });
    const before = data(await h.db.list()).sort();
    const result = await invalid.world.ensureWorld();
    expect(result).toMatchObject({
      ok: false,
      error: {
        code: "INTERNAL",
        message: expect.stringContaining("Unknown reference ghost"),
      },
    });
    expect(data(await h.db.list()).sort()).toEqual(before);
    expect(result.trace.map((t) => t.queryId)).toEqual(["Q00_graph_list"]);
  });

  it("malformed or missing JSON never publishes an empty template", async () => {
    const malformed = await h.alternative("{broken JSON");
    expect(await malformed.world.ensureWorld()).toMatchObject({
      ok: false,
      error: { code: "INTERNAL" },
    });
    const missing = createWorld(h.db, {
      templateGraph: malformed.graph,
      seedPath: new URL("./testing/nonexistent.json", import.meta.url),
    });
    expect(await missing.ensureWorld()).toMatchObject({
      ok: false,
      error: { code: "INTERNAL" },
    });
    expect(data(await h.db.list())).not.toContain(malformed.graph);
  });

  it("concurrent initializers publish one complete template", async () => {
    const other = createWorld(h.db, {
      templateGraph: h.templateGraph,
      seedPath: h.seedPath,
    });
    const results = await Promise.all([
      h.world.ensureWorld(),
      other.ensureWorld(),
      h.world.ensureWorld(),
    ]);
    // Calls coalesced in one instance share the same result; independent instances race safely.
    expect(results.every((r) => r.ok)).toBe(true);
    expect(
      results
        .slice(0, 2)
        .map(data)
        .filter((result) => result.created),
    ).toHaveLength(1);
    expect(data(await h.world.getWorld()).npcs).toHaveLength(3);
  });
});
