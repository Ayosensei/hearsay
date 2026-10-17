// Transport and registration land in G9; the demo-only control is never exposed.
import type { ToolName } from "@hearsay/contract";

export type McpToolName = Exclude<ToolName, "sayNaive">;
