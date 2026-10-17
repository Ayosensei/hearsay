import { afterAll, beforeAll, expect, it } from "vitest";
import { createHearsay } from "@hearsay/core";
import { TOOLS, TraceStep } from "@hearsay/contract";
import { z } from "zod";
import { memoryHarness } from "../../hearsay/src/testing/memory-harness";
import { data } from "../../hearsay/src/testing/world-harness";
import { startApi } from "./server";

let h: Awaited<ReturnType<typeof memoryHarness>>;
let server: Awaited<ReturnType<typeof startApi>>;
let url: string;
const key = "synthetic-local-test-token-1234567890";
beforeAll(async () => {
  h = await memoryHarness();
  server = await startApi(
    createHearsay(h.db, {
      seedPath: h.seedPath,
      templateGraph: h.templateGraph,
    }),
    { port: 0, key },
  );
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No HTTP port");
  url = `http://127.0.0.1:${address.port}`;
});
afterAll(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  if (h) await h.cleanup();
});
const headers = {
  authorization: `Bearer ${key}`,
  "content-type": "application/json",
};
const post = (name: string, input: unknown) =>
  fetch(`${url}/tools/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });

it("runs a real event/gossip/explanation sequence over HTTP with contract envelopes", async () => {
  const recorded = await post("recordEvent", {
    playerId: h.playerId,
    type: "stole",
    placeId: "forge",
    witnesses: ["brom"],
    subject: "iron sword",
  });
  expect(recorded.status).toBe(200);
  const event = z
    .object({ ok: z.literal(true), data: TOOLS.recordEvent.output })
    .parse(await recorded.json());
  expect(event.ok).toBe(true);
  for (let i = 0; i < 2; i++)
    expect((await post("advanceTime", { playerId: h.playerId })).status).toBe(
      200,
    );
  const explanationBody = await (
    await post("explain", {
      playerId: h.playerId,
      npcId: "garrick",
      eventId: event.data.eventId,
    })
  ).json();
  const explanation = z
    .object({
      ok: z.literal(true),
      data: TOOLS.explain.output,
      trace: z.array(TraceStep),
    })
    .parse(explanationBody);
  expect(explanation.ok).toBe(true);
  expect(
    TOOLS.explain.output.parse(explanation.data).chain.map((n) => n.npcId),
  ).toEqual(["brom", "mira", "garrick"]);
  expect(
    explanation.trace.some(
      (t) => t.queryId === "Q61_explain_chain",
    ),
  ).toBe(true);
});

it("requires bearer authentication and rejects browser origins before any mutation", async () => {
  const before = data(await h.memory.snapshot({ playerId: h.playerId }));
  const request = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerId: h.playerId }),
  };
  expect((await fetch(`${url}/tools/resetPlayer`, request)).status).toBe(401);
  expect(
    (
      await fetch(`${url}/tools/resetPlayer`, {
        ...request,
        headers: { ...headers, authorization: "Bearer wrong" },
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await fetch(`${url}/tools/resetPlayer`, {
        ...request,
        headers: { ...headers, origin: "https://example.test" },
      })
    ).status,
  ).toBe(403);
  expect(data(await h.memory.snapshot({ playerId: h.playerId }))).toEqual(
    before,
  );
});

it("returns bounded errors for bad args, malformed JSON, large bodies and unknown routes", async () => {
  expect((await post("recordEvent", {})).status).toBe(400);
  expect((await post("missingTool", {})).status).toBe(404);
  expect(
    (
      await fetch(`${url}/tools/getWorld`, {
        method: "POST",
        headers,
        body: "{",
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await fetch(`${url}/tools/getWorld`, {
        method: "POST",
        headers,
        body: "x".repeat(65537),
      })
    ).status,
  ).toBe(413);
  expect(
    (
      await fetch(`${url}/tools/getWorld`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}` },
        body: "{}",
      })
    ).status,
  ).toBe(415);
});

it("exposes health and tool schemas without leaking the token", async () => {
  expect(await (await fetch(`${url}/health`)).json()).toMatchObject({
    ok: true,
    service: "hearsay",
  });
  const response = await fetch(`${url}/tools`, { headers });
  const text = await response.text();
  expect(text).not.toContain(key);
  expect(
    JSON.parse(text).some((tool: { name: string }) => tool.name === "say"),
  ).toBe(true);
});
