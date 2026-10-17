import { TOOLS } from "@hearsay/contract";
import type { ToolInput, ToolOutput } from "@hearsay/contract";
import type { Database } from "./db";
import { createWorld } from "./world";
import {
  executeMemoryTool,
  resolveEvent,
  resolvePlayer,
} from "./memory-context";
import type { WorldScope } from "./world-operation";
import { WorldFailure } from "./world-operation";
import { GossipCandidate, selectGossip } from "./gossip-selection";
import * as q from "./queries/gossip";

const MIN_WEIGHT = 0.3;
const MIN_CRED = 0.25;

export function createGossip(db: Database, world = createWorld(db)) {
  // Serialize gossip for the same save in this service; unrelated players remain independent.
  const pending = new Map<string, Promise<unknown>>();
  async function locked<T>(id: string, work: () => Promise<T>): Promise<T> {
    const next = (pending.get(id) ?? Promise.resolve()).then(work, work);
    pending.set(id, next);
    try {
      return await next;
    } finally {
      if (pending.get(id) === next) pending.delete(id);
    }
  }
  async function writeRound(
    scope: WorldScope,
    graph: string,
    rows: GossipCandidate[],
    tick: number,
  ) {
    const picks = selectGossip(rows);
    if (!picks.length) return [];
    return GossipCandidate.array().parse(
      await scope.run(graph, "Q41_gossip_write", q.Q41_gossip_write, {
        rows: picks,
        tick,
      }),
    );
  }
  const advanceTime = (input: ToolInput<"advanceTime">) =>
    locked(input?.playerId, () =>
      executeMemoryTool(
        db,
        "advanceTime",
        TOOLS.advanceTime,
        input,
        async (scope, args) => {
          const { graph, tick } = await resolvePlayer(db, scope, args.playerId);
          scope.take(await world.ensureWorld());
          const candidates = GossipCandidate.array().parse(
            await scope.ro(
              graph,
              "Q40_gossip_candidates_all",
              q.Q40_gossip_candidates_all,
              { minWeight: MIN_WEIGHT, minCred: MIN_CRED },
            ),
          );
          const written = await writeRound(scope, graph, candidates, tick + 1);
          const updated = await scope.run(
            graph,
            "Q21_set_tick",
            q.Q21_set_tick,
            { pid: args.playerId, previousTick: tick },
          );
          if (updated.length !== 1)
            throw new WorldFailure({
              code: "INTERNAL",
              message:
                "Game time changed during gossip. Refresh the player state before continuing.",
            });
          return {
            tick: updated[0]?.tick,
            steps: written.map((r) => ({
              eventId: r.eventId,
              tellerId: r.teller,
              listenerId: r.listener,
              credibility: r.cred,
              hop: r.hop + 1,
            })),
          };
        },
      ),
    );
  const spread = (input: ToolInput<"spread">) =>
    locked(input?.playerId, () =>
      executeMemoryTool(
        db,
        "spread",
        TOOLS.spread,
        input,
        async (scope, args) => {
          const { graph, tick } = await resolvePlayer(db, scope, args.playerId);
          await resolveEvent(scope, graph, args.playerId, args.eventId);
          scope.take(await world.ensureWorld());
          const params = {
            eid: args.eventId,
            minWeight: MIN_WEIGHT,
            minCred: args.minCredibility,
            maxHops: args.maxHops,
          };
          const steps: ToolOutput<"spread">["steps"] = [];
          for (let round = 0; round < args.maxHops; round++) {
            const candidates = GossipCandidate.array().parse(
              await scope.ro(
                graph,
                "Q40b_gossip_candidates_one",
                q.Q40b_gossip_candidates_one,
                params,
              ),
            );
            const written = await writeRound(scope, graph, candidates, tick);
            steps.push(
              ...written.map((r) => ({
                hop: r.hop + 1,
                tellerId: r.teller,
                listenerId: r.listener,
                credibility: r.cred,
              })),
            );
            if (!written.length) break;
          }
          // Probe remaining trust paths without a depth/credibility cutoff to explain why we stopped.
          const remaining = GossipCandidate.array().parse(
            await scope.ro(
              graph,
              "Q40b_gossip_candidates_one",
              q.Q40b_gossip_candidates_one,
              { ...params, minCred: 0, maxHops: Number.MAX_SAFE_INTEGER },
            ),
          );
          const stoppedBecause = remaining.some(
            (r) => r.cred >= args.minCredibility,
          )
            ? "max_hops"
            : remaining.length
              ? "min_credibility"
              : "no_listeners";
          return {
            steps,
            reached: [...new Set(steps.map((r) => r.listenerId))],
            stoppedBecause,
          };
        },
      ),
    );
  return { advanceTime, spread };
}
