import { TOOLS } from "@hearsay/contract";
import type { ToolName, ToolInput } from "@hearsay/contract";
import { getHearsay, reconnectHearsay } from "../../../../server/hearsay";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const reply = (value: unknown, status = 200) =>
    Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
  const badArgs = (message: string) => reply({
    ok: false, error: { code: "BAD_ARGS", message }, trace: [],
  }, 400);
  const { name } = await params;
  if (!Object.hasOwn(TOOLS, name)) return badArgs("Unknown tool.");
  const tool = name as ToolName;
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return badArgs("Expected a JSON request body.");
  }
  const parsed = TOOLS[tool].input.safeParse(input);
  if (!parsed.success) return badArgs("Invalid tool arguments.");
  try {
    const client = await getHearsay();
    const result = await client.call(tool, parsed.data as ToolInput<typeof tool>);
    // Reconnect on the next call; replaying a failed write could duplicate an event.
    if (!result.ok && result.error.code === "DB_UNAVAILABLE") await reconnectHearsay();
    return reply(result);
  } catch {
    return reply({
      ok: false, error: { code: "DB_UNAVAILABLE", message: "FalkorDB is unavailable. Start the database and retry." }, trace: [],
    });
  }
}
