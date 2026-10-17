import { performance } from "node:perf_hooks";
import { FalkorDB } from "falkordb";
import type { Envelope, TraceStep } from "@hearsay/contract";

export type Row = Record<string, unknown>;
type Param = string | number | boolean | null | QueryParams | Param[];
export interface QueryParams {
  [key: string]: Param;
}
export interface DatabaseConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  connectTimeoutMs?: number;
  queryTimeoutMs?: number;
  copyRetryMs?: number;
}
export type QueryContext = Pick<TraceStep, "agent" | "tool">;
type Execute = <T extends Row = Row>(
  graph: string,
  queryId: string,
  query: string,
  params?: QueryParams,
  context?: QueryContext,
) => Promise<Envelope<T[]>>;
export interface Database {
  run: Execute;
  ro: Execute;
  list(): Promise<Envelope<string[]>>;
  copy(source: string, destination: string): Promise<Envelope<null>>;
  delete(graph: string): Promise<Envelope<null>>;
  close(): Promise<Envelope<null>>;
}

function redact(value: Param): Param {
  if (Array.isArray(value)) return value.map(redact);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /password|secret|token|api[_-]?key/i.test(key)
          ? "[REDACTED]"
          : redact(item),
      ]),
    );
  }
  return value;
}

function unavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = "code" in error ? String(error.code) : "";
  return (
    /^(ECONN|EPIPE|ETIMEDOUT|ENOTFOUND|EAI_AGAIN)/.test(code) ||
    /SocketClosed|ClientClosed|ConnectionTimeout/.test(error.name) ||
    /socket|connection|client is closed|timeout/i.test(error.message)
  );
}

function failure<T>(offline: boolean, trace: TraceStep[]): Envelope<T> {
  // Driver errors can contain Cypher and parameters; never forward them to callers.
  return {
    ok: false,
    error: {
      code: offline ? "DB_UNAVAILABLE" : "INTERNAL",
      message: offline
        ? "FalkorDB is unavailable."
        : "The database operation failed.",
    },
    trace,
  };
}

export async function connectDatabase(
  config: DatabaseConfig = {},
): Promise<Envelope<Database>> {
  const host = config.host ?? process.env.FALKORDB_HOST ?? "localhost";
  const port = config.port ?? Number(process.env.FALKORDB_PORT ?? 6379);
  const username = config.username ?? process.env.FALKORDB_USERNAME;
  const password = config.password ?? process.env.FALKORDB_PASSWORD;
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    return failure(false, []);
  }
  let client: FalkorDB;
  try {
    // No automatic reconnection: calls must fail promptly, never retry a write.
    const socket = {
      host,
      port,
      connectTimeout: config.connectTimeoutMs ?? 1500,
      reconnectStrategy: false as const,
    };
    client = await FalkorDB.connect({
      socket,
      ...(username ? { username } : {}),
      ...(password ? { password } : {}),
    });
  } catch {
    return failure(true, []);
  }
  let closed = false;
  // EventEmitter errors otherwise terminate Node; each command still returns its own failure.
  client.on("error", () => {});

  async function tracked<T>(
    queryId: string,
    args: QueryParams,
    context: QueryContext,
    operation: () => Promise<T>,
    rows: (value: T) => number,
  ): Promise<Envelope<T>> {
    const started = performance.now();
    const step: TraceStep = {
      ...context,
      queryId,
      args: redact(args) as QueryParams,
      rows: 0,
      ms: 0,
    };
    try {
      if (closed) return failure(true, [step]);
      const data = await operation();
      step.rows = rows(data);
      return { ok: true, data, trace: [step] };
    } catch (error) {
      return failure(unavailable(error), [step]);
    } finally {
      step.ms = performance.now() - started;
    }
  }
  const context: QueryContext = { agent: "system", tool: "database" };
  function executor(readOnly: boolean): Execute {
    return async <T extends Row>(
      graph: string,
      queryId: string,
      query: string,
      params: QueryParams = {},
      caller = context,
    ) =>
      tracked(
        queryId,
        { graph, params },
        caller,
        async () => {
          const selected = client.selectGraph(graph);
          const options = { params, TIMEOUT: config.queryTimeoutMs ?? 3000 };
          const result = readOnly
            ? await selected.roQuery<T>(query, options)
            : await selected.query<T>(query, options);
          // The official client already maps aliases to row objects; write-only replies omit data.
          return result.data ?? [];
        },
        (data) => data.length,
      );
  }
  return {
    ok: true,
    trace: [],
    data: {
      run: executor(false),
      ro: executor(true),
      list: () =>
        tracked(
          "Q00_graph_list",
          {},
          context,
          () => client.list(),
          (data) => data.length,
        ),
      copy: async (source, destination) => {
        let attempts = 0;
        const result = await tracked(
          "Q01_graph_copy",
          { source, destination },
          context,
          async () => {
            const deadline = Date.now() + (config.copyRetryMs ?? 5000);
            while (true) {
              attempts++;
              try {
                await client.selectGraph(source).copy(destination);
                break;
              } catch (error) {
                // The server rejected the copy before forking; never replay an ambiguous write failure.
                if (
                  !(error instanceof Error) ||
                  !/could not fork/i.test(error.message) ||
                  Date.now() >= deadline
                )
                  throw error;
                await new Promise((resolve) =>
                  setTimeout(
                    resolve,
                    Math.min(
                      250,
                      25 * attempts,
                      Math.max(0, deadline - Date.now()),
                    ),
                  ),
                );
              }
            }
            return null;
          },
          () => 0,
        );
        for (const step of result.trace) step.args.attempts = attempts;
        return result;
      },
      delete: (graph) =>
        tracked(
          "Q02_graph_delete",
          { graph },
          context,
          async () => {
            await client.selectGraph(graph).delete();
            return null;
          },
          () => 0,
        ),
      close: async () => {
        if (closed) return { ok: true, data: null, trace: [] };
        closed = true;
        try {
          await client.close();
          return { ok: true, data: null, trace: [] };
        } catch {
          return failure(true, []);
        }
      },
    },
  };
}
