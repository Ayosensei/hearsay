import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import type { Envelope } from "@hearsay/contract";
import { connectDatabase } from "./db";
import type { Database } from "./db";
import { createHearsay } from "./client";
import { loadSeed } from "./seed-schema";

// Run explicitly with --env-file=.env.cloud.local; never use the local restart helper on Cloud.
process.env.HEARSAY_LLM = "off";
const host = process.env.FALKORDB_HOST;
if (!host || ["localhost", "127.0.0.1", "::1"].includes(host))
  throw new Error("Configure a Cloud host in the private environment file.");
const suffix = randomUUID().replaceAll("-", "");
const templateGraph = `cloud_template_${suffix}`;
const playerId = `cloud_${suffix}`;
const owned = [templateGraph, `player:${playerId}`];
const path = new URL(
  "../../../docs/goodness/G11-cloud-results.json",
  import.meta.url,
);
const report: Record<string, unknown> = {
  startedAt: new Date().toISOString(),
  templateGraph,
  playerId,
  status: "running",
  appValidated: false,
  llmMode: "off",
};
let db: Database | undefined;
let stage = "connect";
function take<T>(result: Envelope<T>): T {
  if (!result.ok) throw new Error(result.error.code);
  return result.data;
}
async function save() {
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
}
await save();
try {
  db = take(await connectDatabase({ connectTimeoutMs: 8000 }));
  const initial = take(await db.list());
  report.initialGraphCount = initial.length;
  assert(owned.every((name) => !initial.includes(name)));
  const client = createHearsay(db, { templateGraph });
  const seed = await loadSeed();
  stage = "initialize_missing_template";
  assert.equal(take(await client.ensureWorld()).created, true);
  report.templateCreated = true;
  const town = take(await client.call("getWorld", {}));
  assert.deepEqual(
    town.npcs.map((n) => n.id).sort(),
    seed.npcs.map((n) => n.id).sort(),
  );
  report.npcCount = town.npcs.length;
  assert.equal(take(await client.ensureWorld()).created, false);
  report.idempotent = true;
  stage = "recover_missing_owned_template";
  // Simulate an absent template using only this run's graph, never flush the instance.
  take(await db.delete(templateGraph));
  assert.equal(take(await client.ensureWorld()).created, true);
  assert.equal(
    take(await client.call("getWorld", {})).npcs.length,
    town.npcs.length,
  );
  report.templateRecreated = true;
  stage = "player_event_roundtrip";
  take(await client.call("newPlayer", { playerId }));
  const event = take(
    await client.call("recordEvent", {
      playerId,
      type: "stole",
      placeId: "forge",
      witnesses: ["brom"],
      subject: "synthetic smoke-test sword",
    }),
  );
  const recalled = take(
    await client.call("recall", { playerId, npcId: "brom" }),
  );
  assert(
    recalled.items.some(
      (item) => item.eventId === event.eventId && item.confidence === 1,
    ),
  );
  report.eventRecalled = true;
  stage = "fresh_connection_roundtrip";
  take(await db.close());
  db = undefined;
  db = take(await connectDatabase({ connectTimeoutMs: 8000 }));
  const fresh = createHearsay(db, { templateGraph });
  assert.equal(take(await fresh.ensureWorld()).created, false);
  assert(
    take(await fresh.call("recall", { playerId, npcId: "brom" })).items.some(
      (item) => item.eventId === event.eventId,
    ),
  );
  report.reconnectedRecall = true;
  report.status = "passed";
} catch {
  report.status = "failed";
  report.failedAt = stage;
  process.exitCode = 1;
} finally {
  stage = "cleanup";
  try {
    if (!db) db = take(await connectDatabase({ connectTimeoutMs: 8000 }));
    const existing = take(await db.list());
    for (const graph of owned)
      if (existing.includes(graph)) take(await db.delete(graph));
    const remaining = take(await db.list());
    assert(owned.every((name) => !remaining.includes(name)));
    report.cleanup = "passed";
    report.finalGraphCount = remaining.length;
  } catch {
    report.cleanup = "failed";
    report.status = "failed";
    process.exitCode = 1;
  } finally {
    if (db) take(await db.close());
    report.finishedAt = new Date().toISOString();
    await save();
  }
}
console.log(JSON.stringify(report, null, 2));
