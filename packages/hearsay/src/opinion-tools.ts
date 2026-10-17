import { z } from "zod";
import {
  TOOLS,
  EventId,
  EventType,
  Unit,
  Tick,
  Weight,
} from "@hearsay/contract";
import type { ToolInput } from "@hearsay/contract";
import type { Database } from "./db";
import { createWorld } from "./world";
import {
  executeMemoryTool,
  resolvePlayer,
  resolveNpcs,
  resolveEvent,
} from "./memory-context";
import { scoreAttitude } from "./opinion";
import { explainKnowledge } from "./explain";
import { Q51_attitude_inputs } from "./queries/opinion";

const Traits = z.object({ loyalty: Unit, greed: Unit });
const Event = z.object({
  eventId: EventId,
  type: EventType,
  weight: Weight,
  tick: Tick,
  confidence: Unit,
  via: z.string(),
});

export function createOpinion(db: Database, world = createWorld(db)) {
  const attitude = (input: ToolInput<"attitude">) =>
    executeMemoryTool(
      db,
      "attitude",
      TOOLS.attitude,
      input,
      async (scope, args) => {
        const { graph, tick } = await resolvePlayer(db, scope, args.playerId);
        await resolveNpcs(scope, graph, [args.npcId]);
        scope.take(await world.ensureWorld());
        const rows = await scope.ro(
          graph,
          "Q51_attitude_inputs",
          Q51_attitude_inputs,
          { pid: args.playerId, nid: args.npcId },
        );
        const traits = Traits.parse(rows[0]);
        const events = rows
          .filter((r) => r.eventId != null)
          .map((r) => {
            const { via, ...event } = Event.parse(r);
            return { ...event, learnedFrom: via };
          });
        return scoreAttitude(traits, tick, events);
      },
    );
  const explain = (input: ToolInput<"explain">) =>
    executeMemoryTool(
      db,
      "explain",
      TOOLS.explain,
      input,
      async (scope, args) => {
        const { graph } = await resolvePlayer(db, scope, args.playerId);
        await resolveNpcs(scope, graph, [args.npcId]);
        await resolveEvent(scope, graph, args.playerId, args.eventId);
        scope.take(await world.ensureWorld());
        return explainKnowledge(scope, graph, args.npcId, args.eventId);
      },
    );
  return { attitude, explain };
}
