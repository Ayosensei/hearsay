import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import type { Envelope } from "@hearsay/contract";
import { connectDatabase } from "../db";
import { loadSeed } from "../seed-schema";
import type { Seed } from "../seed-schema";
import { createWorld } from "../world";

export function data<T>(result: Envelope<T>): T {
  if (!result.ok)
    throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.data;
}
export async function worldHarness() {
  const db = data(await connectDatabase());
  const directory = await mkdtemp(join(tmpdir(), "hearsay-g3-"));
  const templateGraph = `test_world_${randomUUID().replaceAll("-", "")}`;
  const graphs = [templateGraph];
  const seed = await loadSeed();
  // Exercise every loader kind without altering the temporary production seed.
  seed.factions.push({ id: "merchants", name: "Merchants" });
  seed.factionRelations.push({
    from: "guard",
    to: "merchants",
    type: "HOSTILE_TO",
  });
  seed.policies.push({
    id: "haggle_brom",
    kind: "haggle",
    markup: 0.1,
    minMarkup: 0.05,
    maxMarkup: 0.3,
    step: 0.05,
  });
  seed.follows.push({ npc: "brom", policy: "haggle_brom" });
  const seedPath = join(directory, "seed.json");
  await writeFile(seedPath, JSON.stringify(seed));
  return {
    db,
    seed,
    seedPath,
    templateGraph,
    world: createWorld(db, { seedPath, templateGraph }),
    playerId: () => {
      const id = `g3_${randomUUID().replaceAll("-", "")}`;
      graphs.push(`player:${id}`);
      return id;
    },
    alternative: async (content: unknown) => {
      const path = join(directory, `${randomUUID()}.json`);
      await writeFile(
        path,
        typeof content === "string" ? content : JSON.stringify(content),
      );
      const graph = `test_invalid_${randomUUID().replaceAll("-", "")}`;
      graphs.push(graph);
      return {
        graph,
        world: createWorld(db, { seedPath: path, templateGraph: graph }),
      };
    },
    writeSeed: async (value: Seed) =>
      writeFile(seedPath, JSON.stringify(value)),
    cleanup: async () => {
      try {
        const existing = data(await db.list());
        for (const graph of graphs)
          if (existing.includes(graph)) data(await db.delete(graph));
      } finally {
        data(await db.close());
        const target = resolve(directory);
        if (!target.startsWith(`${resolve(tmpdir())}${sep}hearsay-g3-`))
          throw new Error("Unexpected test cleanup path");
        await rm(target, { recursive: true, force: true });
      }
    },
  };
}
