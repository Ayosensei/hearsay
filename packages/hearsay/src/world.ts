import { randomUUID } from "node:crypto";
import { TOOLS } from "@hearsay/contract";
import type { Envelope, ToolInput, ToolOutput } from "@hearsay/contract";
import type { Database } from "./db";
import { WorldFailure, worldOperation } from "./world-operation";
import type { WorldScope } from "./world-operation";
import { publishTemplate } from "./world-seed";
import * as q from "./queries/world";

export interface WorldOptions {
  seedPath?: string | URL;
  templateGraph?: string;
}
export interface WorldTemplate {
  graph: string;
  created: boolean;
}

export function createWorld(db: Database, options: WorldOptions = {}) {
  const template = options.templateGraph ?? "world_template";
  let initializing: Promise<Envelope<WorldTemplate>> | undefined;
  // These locks belong to this service instance, never a module-global player store.
  const playerLocks = new Map<string, Promise<unknown>>();
  async function locked<T>(id: string, work: () => Promise<T>): Promise<T> {
    const previous = playerLocks.get(id) ?? Promise.resolve();
    const next = previous.then(work, work);
    playerLocks.set(id, next);
    try {
      return await next;
    } finally {
      if (playerLocks.get(id) === next) playerLocks.delete(id);
    }
  }
  function ensureWorld(): Promise<Envelope<WorldTemplate>> {
    initializing ??= worldOperation(db, "ensureWorld", async (scope) => {
      if (scope.take(await db.list()).includes(template))
        return { graph: template, created: false };
      return publishTemplate(db, scope, template, options.seedPath);
    }).finally(() => {
      initializing = undefined;
    });
    return initializing;
  }
  async function checkPlayer(scope: WorldScope, graph: string, id: string) {
    const rows = await scope.ro(graph, "Q20_get_player", q.Q20_get_player, {
      pid: id,
    });
    if (rows.length !== 1)
      throw new WorldFailure({
        code: "INTERNAL",
        message: "The player graph is not initialized.",
      });
  }
  async function publishPlayer(
    scope: WorldScope,
    id: string,
    name: string,
    replace: boolean,
  ) {
    const graph = `player:${id}`;
    const staging = `test_player_${randomUUID().replaceAll("-", "")}`;
    try {
      scope.take(await db.copy(template, staging));
      await scope.run(staging, "Q22_create_player", q.Q22_create_player, {
        pid: id,
        name,
        at: new Date().toISOString(),
      });
      // Prepare first so a seed/init error cannot erase the existing save during reset.
      if (replace) scope.take(await db.delete(graph));
      const copied = await db.copy(staging, graph);
      if (!copied.ok && copied.error.code === "INTERNAL" && !replace) {
        scope.record(copied.trace);
        if (scope.take(await db.list()).includes(graph)) {
          await checkPlayer(scope, graph, id);
          return false;
        }
        throw new WorldFailure(copied.error);
      }
      scope.take(copied);
      return true;
    } finally {
      if (scope.take(await db.list()).includes(staging))
        scope.take(await db.delete(staging));
    }
  }
  async function getWorld(
    input: ToolInput<"getWorld"> = {},
  ): Promise<Envelope<ToolOutput<"getWorld">>> {
    const parsed = TOOLS.getWorld.input.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        error: { code: "BAD_ARGS", message: "Invalid world arguments." },
        trace: [],
      };
    return worldOperation(db, "getWorld", async (scope) => {
      scope.take(await ensureWorld());
      const npcs = await scope.ro(template, "Q10_get_npcs", q.Q10_get_npcs);
      const places = await scope.ro(
        template,
        "Q11_get_places",
        q.Q11_get_places,
      );
      const eventTypes = await scope.ro(
        template,
        "Q12_get_event_types",
        q.Q12_get_event_types,
      );
      return TOOLS.getWorld.output.parse({ npcs, places, eventTypes });
    });
  }
  async function newPlayer(
    input: ToolInput<"newPlayer">,
  ): Promise<Envelope<ToolOutput<"newPlayer">>> {
    const parsed = TOOLS.newPlayer.input.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        error: { code: "BAD_ARGS", message: "Invalid player arguments." },
        trace: [],
      };
    const { playerId, name = playerId } = parsed.data;
    return locked(playerId, () =>
      worldOperation(db, "newPlayer", async (scope) => {
        scope.take(await ensureWorld());
        const graph = `player:${playerId}`;
        if (scope.take(await db.list()).includes(graph)) {
          await checkPlayer(scope, graph, playerId);
          return { playerId, graph, created: false };
        }
        const created = await publishPlayer(scope, playerId, name, false);
        return { playerId, graph, created };
      }),
    );
  }
  async function resetPlayer(
    input: ToolInput<"resetPlayer">,
  ): Promise<Envelope<ToolOutput<"resetPlayer">>> {
    const parsed = TOOLS.resetPlayer.input.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        error: { code: "BAD_ARGS", message: "Invalid player arguments." },
        trace: [],
      };
    const { playerId } = parsed.data;
    return locked(playerId, () =>
      worldOperation(db, "resetPlayer", async (scope) => {
        const graph = `player:${playerId}`;
        if (!scope.take(await db.list()).includes(graph))
          throw new WorldFailure({
            code: "UNKNOWN_PLAYER",
            message: "The player does not exist.",
            hint: "Call newPlayer first.",
          });
        await checkPlayer(scope, graph, playerId);
        scope.take(await ensureWorld());
        await publishPlayer(scope, playerId, playerId, true);
        return { playerId, tick: 0 };
      }),
    );
  }
  return { ensureWorld, getWorld, newPlayer, resetPlayer };
}
