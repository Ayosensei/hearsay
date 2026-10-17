import { connectDatabase, createHearsay } from "@hearsay/core";
import { TOOLS } from "@hearsay/contract";
import type { HearsayClient, ToolName, ToolInput } from "@hearsay/contract";
import { loadProject } from "./project";

export async function openRuntime(directory: string, envFile?: string) {
  const project = await loadProject(directory, envFile);
  const connection = await connectDatabase({ connectTimeoutMs: 8000 });
  if (!connection.ok) throw new Error("DB_UNAVAILABLE");
  return {
    project,
    db: connection.data,
    client: createHearsay(connection.data, {
      seedPath: project.seedPath,
      templateGraph: project.templateGraph,
    }),
  };
}
export function toolName(value: string): ToolName {
  if (!Object.hasOwn(TOOLS, value)) throw new Error("BAD_ARGS");
  return value as ToolName;
}
export async function callTool(
  client: HearsayClient,
  name: ToolName,
  input: unknown,
) {
  const parsed = TOOLS[name].input.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      error: { code: "BAD_ARGS" as const, message: "Invalid tool arguments." },
      trace: [],
    };
  return client.call(name, parsed.data as ToolInput<typeof name>);
}
