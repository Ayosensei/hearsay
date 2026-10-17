import { parseArgs } from "node:util";
import { z } from "zod";
import { TOOLS } from "@hearsay/contract";
import type { ToolName } from "@hearsay/contract";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "@hearsay/mcp";
import { initProject, exists } from "./project";
import { openRuntime, callTool, toolName } from "./runtime";
import { startApi } from "./server";

const help = `Hearsay 0.1.0 — NPC memory tools for game projects

Usage: hearsay <command> [options]

  init                 Create a world, config and private environment file
  tools                List engine tools and their input schemas
  doctor               Check project settings and DB connectivity (no writes)
  call <tool>          Run a tool with --json or --input arguments
  serve                Start the local bearer-authenticated HTTP API
  mcp                  Start the MCP server over stdio
  help                 Show this help

Options:
  --project <path>      Project directory (default: current directory)
  --env-file <path>     Private env file, relative to project directory
  --json <object>       Tool input as a JSON object (default: {})
  --input <path>        Read tool JSON from a file, relative to project
  --port <number>       Local HTTP port (default: project config port)
  --help               Show help
  --version            Show version
`;
async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      project: { type: "string" },
      help: { type: "boolean" },
      version: { type: "boolean" },
      "env-file": { type: "string" },
      json: { type: "string" },
      input: { type: "string" },
      port: { type: "string" },
    },
  });
  const [command = "help", name] = positionals;
  if (values.version) {
    console.log("0.1.0");
    return;
  }
  if (values.help || command === "help") {
    console.log(help);
    return;
  }
  if (command === "init") {
    console.log(
      JSON.stringify(
        await initProject(values.project ?? process.cwd()),
        null,
        2,
      ),
    );
    return;
  }
  if (command === "tools") {
    console.log(
      JSON.stringify(
        Object.keys(TOOLS).map((name) => ({
          name,
          input: z.toJSONSchema(TOOLS[name as ToolName].input),
        })),
        null,
        2,
      ),
    );
    return;
  }
  if (!["doctor", "call", "serve", "mcp"].includes(command))
    throw new Error("BAD_ARGS");
  if (positionals.length > (command === "call" ? 2 : 1))
    throw new Error("BAD_ARGS");
  const directory = values.project ?? process.cwd();
  let input: unknown = {};
  let tool: ToolName | undefined;
  if (command === "call") {
    tool = toolName(name ?? "");
    if (values.json !== undefined && values.input !== undefined)
      throw new Error("BAD_ARGS");
    const text = values.input
      ? await readFile(resolve(directory, values.input), "utf8")
      : (values.json ?? "{}");
    if (Buffer.byteLength(text) > 65536) throw new Error("BAD_ARGS");
    input = JSON.parse(text);
    if (!TOOLS[tool].input.safeParse(input).success) {
      console.log(
        JSON.stringify({
          ok: false,
          error: { code: "BAD_ARGS", message: "Invalid tool arguments." },
          trace: [],
        }),
      );
      process.exitCode = 1;
      return;
    }
  }
  const runtime = await openRuntime(directory, values["env-file"]);
  let persistent = false;
  try {
    if (command === "doctor") {
      const graphs = await runtime.db.list();
      const seedExists = await exists(runtime.project.seedPath);
      console.log(
        JSON.stringify(
          {
            ok: graphs.ok && seedExists,
            database: graphs.ok ? "connected" : "unavailable",
            seedExists,
            apiKeyConfigured: (process.env.HEARSAY_API_KEY?.length ?? 0) >= 24,
            llm:
              process.env.HEARSAY_LLM === "off"
                ? "templates"
                : "configured environment",
            writesPerformed: false,
          },
          null,
          2,
        ),
      );
      if (!graphs.ok || !seedExists) process.exitCode = 1;
    } else if (command === "call" && tool) {
      const result = await callTool(runtime.client, tool, input);
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
    } else {
      let closeTransport: () => Promise<void>;
      if (command === "serve") {
        const port =
          values.port === undefined
            ? runtime.project.port
            : Number(values.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535)
          throw new Error("BAD_ARGS");
        const server = await startApi(runtime.client, {
          port,
          key: process.env.HEARSAY_API_KEY ?? "",
        });
        closeTransport = () =>
          new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
        console.error(`Hearsay API ready at http://127.0.0.1:${port}`);
      } else {
        const server = createMcpServer(runtime.client);
        await server.connect(new StdioServerTransport());
        closeTransport = () => server.close();
      }
      persistent = true;
      let closing = false;
      const close = async () => {
        if (closing) return;
        closing = true;
        try {
          await closeTransport();
        } finally {
          await runtime.db.close();
        }
      };
      process.once("SIGINT", () => void close());
      process.once("SIGTERM", () => void close());
      if (command === "mcp") process.stdin.once("end", () => void close());
    }
  } finally {
    if (!persistent) await runtime.db.close();
  }
}
main().catch(() => {
  console.error(
    "Hearsay command failed. Check the project configuration and arguments.",
  );
  process.exitCode = 1;
});
