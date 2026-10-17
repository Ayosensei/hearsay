import { randomUUID } from "node:crypto";
import { createServer } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Envelope } from "@hearsay/contract";
import { connectDatabase } from "./db";
import type { Database } from "./db";
import {
  QG2_create_probe,
  QG2_invalid,
  QG2_missing_probe,
  QG2_probe_count,
  QG2_scalar,
} from "./queries/db";

function data<T>(result: Envelope<T>): T {
  if (!result.ok) throw new Error(result.error.code);
  return result.data;
}
const graph = `test_db_${randomUUID().replaceAll("-", "")}`;
let db: Database;

beforeAll(async () => {
  db = data(await connectDatabase());
  data(
    await db.run(graph, "QG2_create_probe", QG2_create_probe, { id: "probe" }),
  );
});
afterAll(async () => {
  if (db) {
    data(await db.delete(graph));
    data(await db.close());
  }
});

describe("live FalkorDB helper", () => {
  it("returns alias-keyed rows, measured traces and safely bound parameters", async () => {
    const value = "quote' double\" slash\\ newline\n CREATE (:Unwanted)";
    const result = await db.ro(
      graph,
      "QG2_scalar",
      QG2_scalar,
      { value },
      { agent: "npc", tool: "recall" },
    );
    expect(data(result)).toEqual([{ value }]);
    expect(result.trace).toEqual([
      expect.objectContaining({
        agent: "npc",
        tool: "recall",
        queryId: "QG2_scalar",
        rows: 1,
        args: { graph, params: { value } },
        ms: expect.any(Number),
      }),
    ]);
    expect(result.trace[0]?.ms).toBeGreaterThanOrEqual(0);
  });
  it("normalizes a write-only reply and an empty read", async () => {
    expect(
      data(
        await db.ro(graph, "QG2_missing_probe", QG2_missing_probe, {
          id: "absent",
        }),
      ),
    ).toEqual([]);
    expect(
      data(await db.ro(graph, "QG2_probe_count", QG2_probe_count)),
    ).toEqual([{ count: 1 }]);
  });
  it("rejects a write through roQuery without changing the graph", async () => {
    const result = await db.ro(graph, "QG2_create_probe", QG2_create_probe, {
      id: "forbidden",
    });
    expect(result.ok).toBe(false);
    expect(
      data(await db.ro(graph, "QG2_probe_count", QG2_probe_count)),
    ).toEqual([{ count: 1 }]);
  });
  it("returns a sanitized INTERNAL error and redacts nested credentials in traces", async () => {
    const result = await db.run(graph, "QG2_invalid", QG2_invalid, {
      nested: [{ password: "synthetic-password", api_key: "synthetic-key" }],
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "INTERNAL" },
      trace: [{ rows: 0 }],
    });
    expect(JSON.stringify(result)).not.toMatch(
      /synthetic-password|synthetic-key|THIS IS NOT CYPHER/,
    );
  });
  it("returns DB_UNAVAILABLE for a closed connection", async () => {
    const other = data(await connectDatabase());
    data(await other.close());
    const result = await other.ro(graph, "QG2_scalar", QG2_scalar, {
      value: 1,
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "DB_UNAVAILABLE" },
      trace: [{ rows: 0 }],
    });
    data(await other.close());
  });
  it("returns DB_UNAVAILABLE when a real TCP connection is refused", async () => {
    const server = createServer();
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("No test port allocated");
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    expect(
      await connectDatabase({
        host: "127.0.0.1",
        port: address.port,
        connectTimeoutMs: 200,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "DB_UNAVAILABLE" },
      trace: [],
    });
  });
});
