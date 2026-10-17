import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { connectDatabase } from "./db";
import { createHearsay } from "./client";
import type { Envelope } from "@hearsay/contract";
import { Q97_recent_utterances } from "./queries/dialogue";

process.env.HEARSAY_LLM = "off";
if (
  !["localhost", "127.0.0.1", "::1"].includes(
    process.env.FALKORDB_HOST ?? "localhost",
  )
)
  throw new Error(
    "This restart smoke test requires a local database endpoint.",
  );
const mode = process.argv[2];
if (!["prepare", "verify", "recover", "cleanup"].includes(mode ?? ""))
  throw new Error("Use prepare, verify, recover or cleanup.");
const path = new URL(
  "../../../docs/goodness/G11-results.json",
  import.meta.url,
);
const Record = z
  .object({
    playerId: z.string().regex(/^persist_[a-f0-9]{32}$/),
    templateGraph: z.string(),
    eventId: z.string(),
    conversationId: z.string(),
    reply: z.string(),
    npcCount: z.number(),
    preparedAt: z.string(),
  })
  .passthrough();
function take<T>(r: Envelope<T>): T {
  if (!r.ok) throw new Error(r.error.code);
  return r.data;
}
const db = take(await connectDatabase());
try {
  if (mode === "prepare") {
    const suffix = randomUUID().replaceAll("-", "");
    const playerId = `persist_${suffix}`,
      templateGraph = `persist_template_${suffix}`;
    const client = createHearsay(db, { templateGraph });
    take(await client.call("newPlayer", { playerId }));
    const world = take(await client.call("getWorld", {}));
    const event = take(
      await client.call("recordEvent", {
        playerId,
        type: "stole",
        placeId: "forge",
        witnesses: ["brom"],
        subject: "iron sword",
      }),
    );
    take(await client.call("advanceTime", { playerId }));
    take(await client.call("advanceTime", { playerId }));
    const conversation = take(
      await client.call("say", {
        playerId,
        npcId: "garrick",
        text: "What have you heard?",
      }),
    );
    const record = {
      playerId,
      templateGraph,
      eventId: event.eventId,
      conversationId: conversation.conversationId,
      reply: conversation.reply,
      npcCount: world.npcs.length,
      preparedAt: new Date().toISOString(),
      cloud: {
        status: "not_run",
        reason:
          "No Cloud endpoint/credentials or live app integration configured.",
      },
    };
    await writeFile(path, JSON.stringify(record, null, 2) + "\n");
    console.log("Prepared isolated persistent event, gossip and conversation.");
  } else {
    const record = Record.parse(JSON.parse(await readFile(path, "utf8")));
    if (record.templateGraph !== `persist_template_${record.playerId.slice(8)}`)
      throw new Error("Unexpected smoke-test graph target.");
    const client = createHearsay(db, { templateGraph: record.templateGraph });
    if (mode === "verify") {
      const listed = take(await db.list());
      if (
        !listed.includes(`player:${record.playerId}`) ||
        !listed.includes(record.templateGraph)
      )
        throw new Error("Smoke graphs did not survive restart.");
      const memory = take(
        await client.call("recall", {
          playerId: record.playerId,
          npcId: "garrick",
        }),
      );
      const item = memory.items.find((i) => i.eventId === record.eventId);
      if (
        !item ||
        item.learnedFrom !== "mira" ||
        Math.abs(item.confidence - 0.63) > 1e-9
      )
        throw new Error("Saved gossip memory did not survive.");
      const snapshot = take(
        await client.call("snapshot", { playerId: record.playerId }),
      );
      if (snapshot.tick !== 2) throw new Error("Saved game clock changed.");
      const history = take(
        await db.ro(
          `player:${record.playerId}`,
          "Q97_recent_utterances",
          Q97_recent_utterances,
          { pid: record.playerId, nid: "garrick", limit: 6 },
        ),
      );
      if (
        history.length !== 2 ||
        !history.some((r) => r.text === record.reply && r.speaker === "garrick")
      )
        throw new Error("Conversation did not survive.");
      Object.assign(record, {
        verifiedAt: new Date().toISOString(),
        localPersistence: {
          passed: true,
          tick: snapshot.tick,
          eventId: item.eventId,
          learnedFrom: item.learnedFrom,
          confidence: item.confidence,
          savedUtterances: history.length,
          scriptIssuedSave: false,
        },
      });
      console.log(
        "Verified persisted event, gossip, tick and both conversation lines.",
      );
    } else if (mode === "recover") {
      take(await db.delete(record.templateGraph));
      const recovered = take(await client.ensureWorld());
      const world = take(await client.call("getWorld", {}));
      if (!recovered.created || world.npcs.length !== record.npcCount)
        throw new Error("Template self-healing failed.");
      Object.assign(record, {
        localSelfHealing: {
          passed: true,
          at: new Date().toISOString(),
          npcCount: world.npcs.length,
        },
        note: "Local isolated template wipe recovery is not a Cloud smoke test.",
      });
      console.log("Verified local template self-healing; no Cloud claim.");
    } else {
      const listed = take(await db.list());
      for (const graph of [`player:${record.playerId}`, record.templateGraph])
        if (listed.includes(graph)) take(await db.delete(graph));
      Object.assign(record, { cleanedUpAt: new Date().toISOString() });
      console.log("Removed only the smoke test's owned graphs.");
    }
    await writeFile(path, JSON.stringify(record, null, 2) + "\n");
  }
} finally {
  take(await db.close());
}
