import { z } from "zod";
import { TOOLS, Unit } from "@hearsay/contract";
import type { ToolInput } from "@hearsay/contract";
import type { Database } from "./db";
import { createWorld } from "./world";
import {
  executeMemoryTool,
  resolvePlayer,
  resolveNpcs,
} from "./memory-context";
import { WorldFailure } from "./world-operation";
import * as q from "./queries/policy";

const Policy = z.object({
  markup: Unit,
  minMarkup: Unit,
  maxMarkup: Unit,
  step: z.number().positive(),
  tries: z.number().int().min(0),
  wins: z.number().int().min(0),
});
export function createPolicy(db: Database, world = createWorld(db)) {
  const adaptPolicy = (input: ToolInput<"adaptPolicy">) =>
    executeMemoryTool(
      db,
      "adaptPolicy",
      TOOLS.adaptPolicy,
      input,
      async (scope, args) => {
        const { graph } = await resolvePlayer(db, scope, args.playerId);
        await resolveNpcs(scope, graph, [args.npcId]);
        const rows = await scope.ro(graph, "Q80_policy_get", q.Q80_policy_get, {
          nid: args.npcId,
          polId: args.policyId,
        });
        if (!rows.length)
          throw new WorldFailure({
            code: "UNKNOWN_POLICY",
            message: "This NPC does not follow the requested policy.",
          });
        const before = Policy.parse(rows[0]);
        scope.take(await world.ensureWorld());
        const markup =
          args.outcome === "lowballed"
            ? Math.min(before.maxMarkup, before.markup + before.step)
            : Math.max(before.minMarkup, before.markup - 0.02);
        const updated = await scope.run(
          graph,
          "Q81_policy_update",
          q.Q81_policy_update,
          {
            nid: args.npcId,
            polId: args.policyId,
            previousMarkup: before.markup,
            previousTries: before.tries,
            previousWins: before.wins,
            markup,
            winInc: args.outcome === "fair" ? 1 : 0,
          },
        );
        if (updated.length !== 1)
          throw new WorldFailure({
            code: "INTERNAL",
            message:
              "Policy changed concurrently. Read its current state before adapting again.",
          });
        const after = z
          .object({
            markup: Unit,
            tries: z.number().int(),
            wins: z.number().int(),
          })
          .parse(updated[0]);
        return {
          policyId: args.policyId,
          before: { markup: before.markup },
          after: { markup: after.markup },
          tries: after.tries,
          wins: after.wins,
        };
      },
    );
  const gossipHubs = (input: ToolInput<"gossipHubs"> = {}) =>
    executeMemoryTool(
      db,
      "gossipHubs",
      TOOLS.gossipHubs,
      input,
      async (scope, args) => {
        const graph = args.playerId
          ? (await resolvePlayer(db, scope, args.playerId)).graph
          : scope.take(await world.ensureWorld()).graph;
        if (args.playerId) scope.take(await world.ensureWorld());
        const rows = await scope.ro(
          graph,
          "Q70_gossip_hubs",
          q.Q70_gossip_hubs,
          { limit: args.limit },
        );
        return {
          hubs: rows.map((r) => ({
            npcId: r.npc,
            name: r.name,
            score: r.score,
          })),
        };
      },
    );
  return { adaptPolicy, gossipHubs };
}
