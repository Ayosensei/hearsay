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
} from "./memory-context";
import { Q30_record_event, Q50_recall } from "./queries/memory";

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
  return { recordEvent, recall };
}
