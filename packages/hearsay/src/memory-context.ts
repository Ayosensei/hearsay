import { z } from "zod";
import { Tick } from "@hearsay/contract";
import type { Envelope, TraceStep } from "@hearsay/contract";
import type { Database } from "./db";
import { worldOperation, WorldFailure } from "./world-operation";
import type { WorldScope } from "./world-operation";
import { Q20_get_player } from "./queries/world";
import {
  Q24_resolve_npcs,
  Q25_resolve_place,
  Q26_resolve_event,
} from "./queries/memory";

export function executeMemoryTool<I, O>(
  db: Database,
  name: string,
  tool: {
    agent: TraceStep["agent"];
    input: z.ZodType<I>;
    output: z.ZodType<O>;
  },
  input: unknown,
  work: (scope: WorldScope, args: I) => Promise<unknown>,
): Promise<Envelope<O>> {
  const parsed = tool.input.safeParse(input);
  if (!parsed.success)
    return Promise.resolve({
      ok: false,
      error: {
        code: "BAD_ARGS",
        message: `Invalid ${name} arguments.`,
      },
      trace: [],
    });
  return worldOperation(
    db,
    name,
    async (scope) => tool.output.parse(await work(scope, parsed.data)),
    tool.agent,
  );
}
export async function resolvePlayer(
  db: Database,
  scope: WorldScope,
  playerId: string,
) {
  const graph = `player:${playerId}`;
  if (!scope.take(await db.list()).includes(graph))
    throw new WorldFailure({
      code: "UNKNOWN_PLAYER",
      message: "The player does not exist.",
      hint: "Call newPlayer first.",
    });
  const rows = await scope.ro(graph, "Q20_get_player", Q20_get_player, {
    pid: playerId,
  });
  if (rows.length !== 1)
    throw new WorldFailure({
      code: "UNKNOWN_PLAYER",
      message: "The player is not initialized.",
    });
  return { graph, tick: Tick.parse(rows[0]?.tick) };
}
export async function resolveNpcs(
  scope: WorldScope,
  graph: string,
  ids: string[],
) {
  const rows = await scope.ro(graph, "Q24_resolve_npcs", Q24_resolve_npcs, {
    ids,
  });
  const missing = ids.find((id) => !rows.some((row) => row.id === id));
  if (missing)
    throw new WorldFailure({
      code: "UNKNOWN_NPC",
      message: `Unknown NPC: ${missing}.`,
    });
}
export async function resolvePlace(
  scope: WorldScope,
  graph: string,
  id: string,
) {
  const rows = await scope.ro(graph, "Q25_resolve_place", Q25_resolve_place, {
    id,
  });
  if (!rows.length)
    throw new WorldFailure({
      code: "UNKNOWN_PLACE",
      message: `Unknown place: ${id}.`,
    });
}
export async function resolveEvent(
  scope: WorldScope,
  graph: string,
  pid: string,
  eid: string,
) {
  const rows = await scope.ro(graph, "Q26_resolve_event", Q26_resolve_event, {
    pid,
    eid,
  });
  if (!rows.length)
    throw new WorldFailure({
      code: "UNKNOWN_EVENT",
      message: `Unknown event: ${eid}.`,
    });
}
