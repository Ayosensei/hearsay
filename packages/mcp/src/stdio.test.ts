import { beforeAll, afterAll, expect, it } from "vitest";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TOOLS } from "@hearsay/contract";
import { memoryHarness } from "../../hearsay/src/testing/memory-harness";
import { data } from "../../hearsay/src/testing/world-harness";
let h: Awaited<ReturnType<typeof memoryHarness>>;
let client: Client;
beforeAll(async () => {
  h = await memoryHarness();
  data(await h.db.delete(`player:${h.playerId}`));
  const inherited = Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", "packages/mcp/src/stdio.ts"],
    cwd: fileURLToPath(new URL("../../../", import.meta.url)),
    env: {
      ...inherited,
      HEARSAY_SEED_PATH: h.seedPath,
      HEARSAY_TEMPLATE_GRAPH: h.templateGraph,
      HEARSAY_LLM: "off",
    },
  });
  client = new Client({ name: "hearsay-live-smoke", version: "1.0.0" });
  await client.connect(transport);
}, 40_000);
afterAll(async () => {
  try {
    if (client) await client.close();
  } finally {
    if (h) await h.cleanup();
  }
}, 40_000);
function payload(result: unknown) {
  const reply = z
    .object({
      content: z.array(
        z.object({ type: z.string(), text: z.string().optional() }),
      ),
    })
    .parse(result);
  const text = reply.content.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("MCP response has no JSON text");
  return z
    .object({ ok: z.literal(true), data: z.unknown() })
    .parse(JSON.parse(text)).data;
}
it("lists shared tools except sayNaive and runs a real stdio graph-memory round trip", async () => {
  const listed = await client.listTools();
  expect(listed.tools.map((t) => t.name).sort()).toEqual(
    Object.keys(TOOLS)
      .filter((name) => name !== "sayNaive")
      .sort(),
  );
  const playerId = h.playerId;
  expect(
    TOOLS.newPlayer.output.parse(
      payload(
        await client.callTool({ name: "newPlayer", arguments: { playerId } }),
      ),
    ).created,
  ).toBe(true);
  const event = TOOLS.recordEvent.output.parse(
    payload(
      await client.callTool({
        name: "recordEvent",
        arguments: {
          playerId,
          type: "stole",
          placeId: "forge",
          witnesses: ["brom"],
        },
      }),
    ),
  );
  for (let i = 0; i < 2; i++)
    expect(
      TOOLS.advanceTime.output.parse(
        payload(
          await client.callTool({
            name: "advanceTime",
            arguments: { playerId },
          }),
        ),
      ).tick,
    ).toBe(i + 1);
  const explanation = TOOLS.explain.output.parse(
    payload(
      await client.callTool({
        name: "explain",
        arguments: { playerId, npcId: "garrick", eventId: event.eventId },
      }),
    ),
  );
  expect(explanation.chain.map((n) => n.npcId)).toEqual([
    "brom",
    "mira",
    "garrick",
  ]);
  expect(explanation.hopConfidences).toEqual([0.9, 0.63]);
}, 30_000);
it("rejects schema-invalid MCP arguments without executing the core tool", async () => {
  const response = await client.callTool({
    name: "recordEvent",
    arguments: { playerId: h.playerId, witnesses: [] },
  });
  expect(response.isError).toBe(true);
});
