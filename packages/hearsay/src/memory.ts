import { randomBytes } from "node:crypto";
import { DEFAULT_EVENT_WEIGHT, TOOLS } from "@hearsay/contract";
import type { ToolInput } from "@hearsay/contract";
import type { Database } from "./db";
import { createWorld } from "./world";
import { WorldFailure } from "./world-operation";
import {
  executeMemoryTool,
  resolveNpcs,
  resolvePlace,
  resolvePlayer,
  resolveEvent,
} from "./memory-context";
import {
  Q30_record_event,
  Q50_recall,
  Q42_who_knows,
  Q90_snapshot_nodes,
  Q90_snapshot_edges,
} from "./queries/memory";
import { mapSnapshot } from "./snapshot-map";

export function createMemory(db: Database, world = createWorld(db)) {
  const recordEvent = (input: ToolInput<"recordEvent">) =>
    executeMemoryTool(
      db,
      "recordEvent",
      TOOLS.recordEvent,
      input,
      async (scope, args) => {
        const { graph, tick } = await resolvePlayer(db, scope, args.playerId);
        const witnesses = [...new Set(args.witnesses)];
        await resolveNpcs(scope, graph, witnesses);
        await resolvePlace(scope, graph, args.placeId);
        scope.take(await world.ensureWorld());
        const eventId = `ev_${BigInt(`0x${randomBytes(16).toString("hex")}`).toString(36)}`;
        const weight = args.weight ?? DEFAULT_EVENT_WEIGHT[args.type];
        const rows = await scope.run(
          graph,
          "Q30_record_event",
          Q30_record_event,
          {
            pid: args.playerId,
            place: args.placeId,
            eid: eventId,
            type: args.type,
            weight,
            tick,
            at: new Date().toISOString(),
            subject: args.subject ?? "",
            witnesses,
          },
        );
        if (rows.length !== witnesses.length)
          throw new WorldFailure({
            code: "INTERNAL",
            message: "The event could not be recorded for every witness.",
          });
        return { eventId, tick, weight, witnesses };
      },
    );
  const recall = (input: ToolInput<"recall">) =>
    executeMemoryTool(
      db,
      "recall",
      TOOLS.recall,
      input,
      async (scope, args) => {
        const { graph } = await resolvePlayer(db, scope, args.playerId);
        await resolveNpcs(scope, graph, [args.npcId]);
        scope.take(await world.ensureWorld());
        const rows = await scope.ro(graph, "Q50_recall", Q50_recall, {
          pid: args.playerId,
          nid: args.npcId,
          limit: args.limit,
        });
        const items = rows.map(({ via, ...row }) => ({
          ...row,
          learnedFrom: via,
        }));
        return { status: items.length ? "known" : "not_in_graph", items };
      },
    );
  const whoKnows = (input: ToolInput<"whoKnows">) =>
    executeMemoryTool(
      db,
      "whoKnows",
      TOOLS.whoKnows,
      input,
      async (scope, args) => {
        const { graph } = await resolvePlayer(db, scope, args.playerId);
        await resolveEvent(scope, graph, args.playerId, args.eventId);
        scope.take(await world.ensureWorld());
        const rows = await scope.ro(graph, "Q42_who_knows", Q42_who_knows, {
          eid: args.eventId,
        });
        return {
          witnesses: rows.filter((r) => r.via === "witness").map((r) => r.npc),
          heardFrom: rows
            .filter((r) => r.via != null && r.via !== "witness")
            .map((r) => ({
              npcId: r.npc,
              from: r.via,
              confidence: r.confidence,
              hop: r.hop,
            })),
          unaware: rows.filter((r) => r.via == null).map((r) => r.npc),
        };
      },
    );
  const snapshot = (input: ToolInput<"snapshot">) =>
    executeMemoryTool(
      db,
      "snapshot",
      TOOLS.snapshot,
      input,
      async (scope, args) => {
        const { graph, tick } = await resolvePlayer(db, scope, args.playerId);
        if (args.focusEventId)
          await resolveEvent(scope, graph, args.playerId, args.focusEventId);
        scope.take(await world.ensureWorld());
        const nodes = await scope.ro(
          graph,
          "Q90_snapshot_nodes",
          Q90_snapshot_nodes,
        );
        const edges = await scope.ro(
          graph,
          "Q90_snapshot_edges",
          Q90_snapshot_edges,
        );
        return { tick, ...mapSnapshot(nodes, edges) };
      },
    );
  return { recordEvent, recall, whoKnows, snapshot };
}
