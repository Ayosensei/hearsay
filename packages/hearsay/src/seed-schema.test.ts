import { beforeAll, describe, expect, it } from "vitest";
import { loadSeed, SeedSchema } from "./seed-schema";
import type { Seed } from "./seed-schema";

let seed: Seed;
beforeAll(async () => {
  seed = await loadSeed();
});

describe("seed boundary validation", () => {
  it("loads the temporary G3 seed from a module-relative path", () => {
    expect(seed.npcs.map((n) => n.id)).toEqual(["brom", "mira", "garrick"]);
    expect(seed.eventTypes).toHaveLength(7);
    expect(seed.templates.unknownTopic.length).toBeGreaterThanOrEqual(4);
  });
  it("rejects dangling references in every relation category", () => {
    const invalid = [
      { ...seed, npcs: [{ ...seed.npcs[0], faction: "missing" }] },
      {
        ...seed,
        trusts: [{ truster: "missing", trusted: "brom", weight: 0.9 }],
      },
      {
        ...seed,
        trusts: [{ truster: "mira", trusted: "missing", weight: 0.9 }],
      },
      {
        ...seed,
        factionRelations: [
          { from: "guard", to: "missing", type: "ALLIED_WITH" },
        ],
      },
      { ...seed, believes: [{ npc: "mira", fact: "missing", confidence: 1 }] },
      { ...seed, follows: [{ npc: "brom", policy: "missing" }] },
      { ...seed, templates: { ...seed.templates, byNpc: { missing: {} } } },
    ];
    for (const value of invalid)
      expect(SeedSchema.safeParse(value).success).toBe(false);
  });
  it("rejects duplicate nodes, edges, invalid slugs and missing template states", () => {
    expect(
      SeedSchema.safeParse({ ...seed, npcs: [...seed.npcs, seed.npcs[0]] })
        .success,
    ).toBe(false);
    expect(
      SeedSchema.safeParse({
        ...seed,
        trusts: [...seed.trusts, seed.trusts[0]],
      }).success,
    ).toBe(false);
    expect(
      SeedSchema.safeParse({
        ...seed,
        places: [{ id: "../forge", name: "Forge" }],
      }).success,
    ).toBe(false);
    expect(
      SeedSchema.safeParse({
        ...seed,
        templates: { ...seed.templates, greeting: {} },
      }).success,
    ).toBe(false);
  });
  it("accepts referenced policies and rejects inconsistent markup bounds", () => {
    const policies = [
      {
        id: "haggle_brom",
        kind: "haggle",
        markup: 0.1,
        minMarkup: 0.05,
        maxMarkup: 0.3,
        step: 0.05,
      },
    ];
    const value = {
      ...seed,
      policies,
      follows: [{ npc: "brom", policy: "haggle_brom" }],
    };
    expect(SeedSchema.safeParse(value).success).toBe(true);
    expect(
      SeedSchema.safeParse({
        ...value,
        policies: [{ ...policies[0], markup: 0.4 }],
      }).success,
    ).toBe(false);
  });
});
