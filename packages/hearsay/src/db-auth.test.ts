import { randomUUID } from "node:crypto";
import { FalkorDB } from "falkordb";
import { afterEach, expect, it, vi } from "vitest";
import { connectDatabase } from "./db";
import { data } from "./testing/world-harness";

afterEach(() => vi.unstubAllEnvs());

it("authenticates a real named ACL user from config or env, with config taking precedence", async () => {
  const host = process.env.FALKORDB_HOST ?? "localhost";
  // This test creates only a temporary LOCAL ACL user, never changes a Cloud account.
  if (!["localhost", "127.0.0.1", "::1"].includes(host))
    throw new Error("Run ACL regression tests against local FalkorDB.");
  const port = Number(process.env.FALKORDB_PORT ?? 6379);
  const socket = { host, port, reconnectStrategy: false as const };
  const admin = await FalkorDB.connect({
    socket,
    ...(process.env.FALKORDB_PASSWORD
      ? { password: process.env.FALKORDB_PASSWORD }
      : {}),
  });
  const connection = await admin.connection;
  const username = `test_auth_${randomUUID().replaceAll("-", "")}`;
  const password = randomUUID();
  try {
    await connection.sendCommand([
      "ACL",
      "SETUSER",
      username,
      "on",
      `>${password}`,
      "~*",
      "+@all",
    ]);
    vi.stubEnv("FALKORDB_USERNAME", "wrong_user");
    vi.stubEnv("FALKORDB_PASSWORD", "wrong_password");
    const explicit = data(
      await connectDatabase({ host, port, username, password }),
    );
    try {
      expect(data(await explicit.list())).toEqual(expect.any(Array));
    } finally {
      data(await explicit.close());
    }
    vi.stubEnv("FALKORDB_USERNAME", username);
    vi.stubEnv("FALKORDB_PASSWORD", password);
    const fromEnv = data(await connectDatabase({ host, port }));
    try {
      expect(data(await fromEnv.list())).toEqual(expect.any(Array));
    } finally {
      data(await fromEnv.close());
    }
    const rejected = await connectDatabase({
      host,
      port,
      username: "wrong_user",
      password,
    });
    expect(rejected).toMatchObject({
      ok: false,
      error: { code: "DB_UNAVAILABLE" },
      trace: [],
    });
    expect(JSON.stringify(rejected)).not.toContain(password);
  } finally {
    await connection.sendCommand(["ACL", "DELUSER", username]);
    await admin.close();
  }
});
