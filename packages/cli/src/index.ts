import { parseArgs } from "node:util";
import { z } from "zod";
import { TOOLS } from "@hearsay/contract";
import type { ToolName } from "@hearsay/contract";
import { initProject } from "./project";

const help = `Hearsay 0.1.0 — NPC memory tools for game projects

Usage: hearsay <command> [options]

  init                 Create a world, config and private environment file
  tools                List engine tools and their input schemas
  help                 Show this help

Options:
  --project <path>      Project directory (default: current directory)
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
    },
  });
  const [command = "help"] = positionals;
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
  console.error("Unknown command. Run hearsay help.");
  process.exitCode = 1;
}
main().catch(() => {
  console.error(
    "Hearsay command failed. Check the project configuration and arguments.",
  );
  process.exitCode = 1;
});
