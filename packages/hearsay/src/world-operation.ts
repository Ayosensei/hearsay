import type { Envelope, ErrorBody, TraceStep } from "@hearsay/contract";
import type { z } from "zod";
import type { Database, QueryParams } from "./db";

export class WorldFailure extends Error {
  constructor(readonly error: z.infer<typeof ErrorBody>) {
    super(error.message);
  }
}
export function createScope(
  db: Database,
  tool: string,
  agent: TraceStep["agent"] = "system",
) {
  const trace: TraceStep[] = [];
  const record = (steps: TraceStep[]) =>
    trace.push(
      ...steps.map((step) =>
        step.tool === "database" ? { ...step, tool, agent } : step,
      ),
    );
  function take<T>(result: Envelope<T>): T {
    record(result.trace);
    if (!result.ok) throw new WorldFailure(result.error);
    return result.data;
  }
  const context = { agent, tool };
  return {
    trace,
    record,
    take,
    run: async (
      graph: string,
      id: string,
      query: string,
      params: QueryParams = {},
    ) => take(await db.run(graph, id, query, params, context)),
    ro: async (
      graph: string,
      id: string,
      query: string,
      params: QueryParams = {},
    ) => take(await db.ro(graph, id, query, params, context)),
  };
}
export type WorldScope = ReturnType<typeof createScope>;

export async function worldOperation<T>(
  db: Database,
  tool: string,
  work: (scope: WorldScope) => Promise<T>,
  agent: TraceStep["agent"] = "system",
): Promise<Envelope<T>> {
  const scope = createScope(db, tool, agent);
  try {
    return { ok: true, data: await work(scope), trace: scope.trace };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof WorldFailure
          ? error.error
          : {
              code: "INTERNAL",
              message: "The world operation failed.",
            },
      trace: scope.trace,
    };
  }
}
