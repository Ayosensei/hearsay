import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import {
  connectDatabase,
  createHearsay,
} from "../../packages/hearsay/src/index";
import { TOOLS } from "../../packages/contract/src/index";
import type {
  Envelope,
  ToolInput,
  ToolName,
  ToolOutput,
} from "../../packages/contract/src/index";
import { startApi } from "../../packages/cli/src/server";
import { prepareWorld } from "./prepare.mts";

// Synthetic bindings test the adapter's backend path, not Daggerfall gameplay.
async function main() {
  loadEnvFile(resolve(process.argv[2] ?? ".env.cloud.local"));
  process.env.HEARSAY_LLM = "off";
  const nonce = randomUUID().replaceAll("-", "");
  const playerId = `dfu_${nonce}`;
  const profile = {
    playerId,
    apiKey: "",
    worldPrepared: false,
    bindings: ["brom", "mira", "garrick"].map((slot, i) => ({
      slot,
      key: `synthetic:${nonce}:${i}`,
      name: `Synthetic test resident ${i}`,
    })),
  };
  const seed = JSON.parse(
    await readFile(
      new URL("../../seed/hollowbrook.json", import.meta.url),
      "utf8",
    ),
  );
  const prepared = prepareWorld(profile, seed);
  const directory = await mkdtemp(join(tmpdir(), "hearsay-dfu-smoke-"));
  const seedPath = join(directory, "world.json");
  await writeFile(seedPath, JSON.stringify(prepared.seed));
  const connection = await connectDatabase({ connectTimeoutMs: 8000 });
  if (!connection.ok) throw new Error("DB_UNAVAILABLE");
  const db = connection.data;
  const client = createHearsay(db, {
    seedPath,
    templateGraph: prepared.templateGraph,
  });
  const key = randomBytes(32).toString("hex");
  const server = await startApi(client, { port: 0, key });
  const queries = new Set<string>();
  let result: Record<string, unknown> | undefined;
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const url = `http://127.0.0.1:${address.port}`;
    async function call<N extends ToolName>(tool: N, input: ToolInput<N>) {
      const response = await fetch(`${url}/tools/${tool}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(20000),
      });
      assert.equal(response.status, 200, `HTTP ${tool}`);
      // Validate the server's success body against this exact tool's shared schema.
      const envelope = (await response.json()) as Envelope<ToolOutput<N>>;
      assert.ok(envelope.ok, `${tool} returned an error`);
      for (const step of envelope.trace)
        if (step.queryId) queries.add(step.queryId);
      return TOOLS[tool].output.parse(envelope.data) as ToolOutput<N>;
    }
    const unauthorized = await fetch(`${url}/tools`);
    assert.equal(unauthorized.status, 401);
    const world = await call("getWorld", {});
    assert.deepEqual(
      world.npcs.map((n) => n.name).sort(),
      profile.bindings.map((b) => b.name).sort(),
    );
    await call("newPlayer", { playerId });
    const event = await call("recordEvent", {
      playerId,
      type: "stole",
      subject: "synthetic test item",
      placeId: "dfu_location",
      witnesses: ["brom"],
    });
    const before = await call("recall", { playerId, npcId: "garrick" });
    assert.equal(before.status, "not_in_graph");
    await call("advanceTime", { playerId });
    await call("advanceTime", { playerId });
    const after = await call("recall", { playerId, npcId: "garrick" });
    assert.equal(after.items.length, 1);
    assert.equal(after.items[0].learnedFrom, "mira");
    assert.ok(Math.abs(after.items[0].confidence - 0.63) < 1e-9);
    const explanation = await call("explain", {
      playerId,
      npcId: "garrick",
      eventId: event.eventId,
    });
    assert.deepEqual(
      explanation.chain.map((n) => n.npcId),
      ["brom", "mira", "garrick"],
    );
    const dialogue = await call("say", {
      playerId,
      npcId: "garrick",
      text: "What have you heard?",
    });
    assert.equal(dialogue.source, "template_fallback");
    assert.ok(dialogue.usedEventIds.includes(event.eventId));
    result = {
      status: "passed",
      testData: "synthetic bindings, not an in-game test",
      database: "live FalkorDB",
      transport: "actual local bearer-authenticated HTTP",
      unauthorizedStatus: unauthorized.status,
      confidence: after.items[0].confidence,
      chain: explanation.chain.map((n) => n.npcId),
      dialogueSource: dialogue.source,
      queryIds: [...queries].sort(),
    };
  } finally {
    await new Promise<void>((done, reject) =>
      server.close((error) => (error ? reject(error) : done())),
    );
    try {
      const existing = await db.list();
      assert.ok(existing.ok);
      for (const graph of [`player:${playerId}`, prepared.templateGraph]) {
        if (existing.data.includes(graph))
          assert.ok((await db.delete(graph)).ok);
      }
      const remaining = await db.list();
      assert.ok(remaining.ok);
      assert.ok(
        !remaining.data.includes(`player:${playerId}`) &&
          !remaining.data.includes(prepared.templateGraph),
      );
      if (result) result.cleanup = "owned player and template graphs removed";
    } finally {
      await db.close();
      const target = resolve(directory);
      if (
        dirname(target) !== resolve(tmpdir()) ||
        !basename(target).startsWith("hearsay-dfu-smoke-")
      )
        throw new Error("Unexpected cleanup directory.");
      await rm(target, { recursive: true, force: true });
    }
  }
  assert.ok(result);
  if (process.argv[3])
    await writeFile(
      resolve(process.argv[3]),
      JSON.stringify(result, null, 2) + "\n",
    );
  console.log(JSON.stringify(result, null, 2));
}
main().catch(() => {
  console.error("Backend smoke failed; no in-game success is claimed.");
  process.exitCode = 1;
});
