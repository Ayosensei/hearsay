import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Database } from "./db";
import { loadSeed } from "./seed-schema";
import { WorldFailure } from "./world-operation";
import type { WorldScope } from "./world-operation";
import * as q from "./queries/seed";
import { INDEX_QUERIES } from "./queries/world";

export async function publishTemplate(
  db: Database,
  scope: WorldScope,
  template: string,
  seedPath?: string | URL,
) {
  let seed;
  try {
    seed = await loadSeed(seedPath);
  } catch (error) {
    throw new WorldFailure({
      code: "INTERNAL",
      message:
        error instanceof z.ZodError
          ? `Invalid world seed: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
          : "Unable to read a valid world seed file.",
    });
  }
  // Publish a complete graph; other callers must never copy a half-loaded template.
  const staging = `test_seed_${randomUUID().replaceAll("-", "")}`;
  try {
    for (const [id, query, rows] of [
      ["Q04_seed_factions", q.Q04_seed_factions, seed.factions],
      ["Q04_seed_places", q.Q04_seed_places, seed.places],
      ["Q04_seed_npcs", q.Q04_seed_npcs, seed.npcs],
      ["Q04_seed_facts", q.Q04_seed_facts, seed.facts],
      ["Q04_seed_policies", q.Q04_seed_policies, seed.policies],
      ["Q04_seed_event_types", q.Q04_seed_event_types, seed.eventTypes],
      ["Q04_seed_trusts", q.Q04_seed_trusts, seed.trusts],
      ["Q04_seed_believes", q.Q04_seed_believes, seed.believes],
      ["Q04_seed_follows", q.Q04_seed_follows, seed.follows],
      [
        "Q04_seed_allied",
        q.Q04_seed_allied,
        seed.factionRelations.filter((r) => r.type === "ALLIED_WITH"),
      ],
      [
        "Q04_seed_hostile",
        q.Q04_seed_hostile,
        seed.factionRelations.filter((r) => r.type === "HOSTILE_TO"),
      ],
    ] as const)
      await scope.run(staging, id, query, { rows });
    for (const [id, query] of INDEX_QUERIES)
      await scope.run(staging, id, query);
    const copied = await db.copy(staging, template);
    if (!copied.ok && copied.error.code === "INTERNAL") {
      scope.record(copied.trace);
      if (scope.take(await db.list()).includes(template))
        return { graph: template, created: false };
      throw new WorldFailure(copied.error);
    }
    scope.take(copied);
    return { graph: template, created: true };
  } finally {
    if (scope.take(await db.list()).includes(staging))
      scope.take(await db.delete(staging));
  }
}
