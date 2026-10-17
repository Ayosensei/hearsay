import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, afterAll, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TOOLS } from "@hearsay/contract";
import { z } from "zod";
import { memoryHarness } from "../../hearsay/src/testing/memory-harness";

const exec = promisify(execFile);
const bundle = fileURLToPath(new URL("../dist/cli.mjs", import.meta.url));
let directory: string;
let h: Awaited<ReturnType<typeof memoryHarness>>;
const run = (...args: string[]) =>
  exec(process.execPath, [bundle, ...args], { cwd: directory, timeout: 20000 });
beforeAll(async () => {
  await exec(process.execPath, [
    fileURLToPath(new URL("../build.mjs", import.meta.url)),
  ]);
  directory = await mkdtemp(join(tmpdir(), "hearsay-cli-process-"));
  h = await memoryHarness();
  await run("init");
  const path = join(directory, "hearsay.config.json");
  const config = JSON.parse(await readFile(path, "utf8"));
  config.seed = h.seedPath;
  config.templateGraph = h.templateGraph;
  await writeFile(path, JSON.stringify(config));
});
afterAll(async () => {
  if (h) await h.cleanup();
  if (directory) {
    if (
      !resolve(directory).startsWith(
        join(resolve(tmpdir()), "hearsay-cli-process-"),
      )
    )
      throw new Error("Unexpected test directory");
    await rm(directory, { recursive: true, force: true });
  }
});

it("runs doctor and engine calls from another project's directory", async () => {
  expect(JSON.parse((await run("doctor")).stdout)).toMatchObject({
    ok: true,
    database: "connected",
    writesPerformed: false,
  });
  const created = JSON.parse(
    (
      await run(
        "call",
        "newPlayer",
        "--json",
        JSON.stringify({ playerId: h.playerId }),
      )
    ).stdout,
  );
  expect(created.ok).toBe(true);
  const inputPath = join(directory, "event.json");
  await writeFile(
    inputPath,
    JSON.stringify({
      playerId: h.playerId,
      type: "stole",
      placeId: "forge",
      witnesses: ["brom"],
      subject: "portable test sword",
    }),
  );
  const recorded = JSON.parse(
    (await run("call", "recordEvent", "--input", "event.json")).stdout,
  );
  const event = TOOLS.recordEvent.output.parse(recorded.data);
  const recalled = JSON.parse(
    (
      await run(
        "call",
        "recall",
        "--json",
        JSON.stringify({ playerId: h.playerId, npcId: "brom" }),
      )
    ).stdout,
  );
  expect(
    TOOLS.recall.output
      .parse(recalled.data)
      .items.some((item) => item.eventId === event.eventId),
  ).toBe(true);
});

it("fails invalid commands and arguments with nonzero status", async () => {
  for (const args of [
    ["missingCommand"],
    ["call", "missingTool"],
    ["call", "recordEvent", "--json", "{}"],
    ["call", "getWorld", "--json", "{"],
    ["call", "getWorld", "--json", "{}", "--input", "event.json"],
  ])
    await expect(run(...args)).rejects.toHaveProperty("code", 1);
});

it("serves real MCP from the bundled command without stdout logging noise", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [bundle, "mcp"],
    cwd: directory,
  });
  const client = new Client({ name: "cli-test", version: "1.0.0" });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    expect(listed.tools).toHaveLength(14);
    expect(listed.tools.some((tool) => tool.name === "sayNaive")).toBe(false);
    const recorded = await client.callTool({
      name: "recordEvent",
      arguments: {
        playerId: h.playerId,
        type: "stole",
        placeId: "forge",
        witnesses: ["brom"],
        subject: "MCP package sword",
      },
    });
    expect(recorded.isError).toBe(false);
    const result = await client.callTool({
      name: "recall",
      arguments: { playerId: h.playerId, npcId: "brom" },
    });
    expect(result.isError).toBe(false);
    const content = z
      .array(z.object({ type: z.string(), text: z.string() }))
      .parse(result.content);
    const envelope = z
      .object({ ok: z.literal(true), data: TOOLS.recall.output })
      .parse(JSON.parse(content[0]?.text ?? "{}"));
    expect(envelope.data.items.length).toBeGreaterThan(0);
  } finally {
    await client.close();
  }
});
