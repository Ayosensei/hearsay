import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TOOLS } from "@hearsay/contract";
import type { HearsayClient, ToolInput, ToolName } from "@hearsay/contract";
export type McpToolName = Exclude<ToolName, "sayNaive">;
const descriptions: Record<McpToolName, string> = {
  getWorld: "List the town's NPCs, places and supported event types.",
  newPlayer:
    "Create an isolated memory graph for a player, copied from the world template.",
  resetPlayer: "Restore one player's world from the original template.",
  recordEvent: "Record something the player did and which NPCs witnessed it.",
  spread:
    "Spread one event as gossip for up to N hops and report who heard it.",
  advanceTime: "Advance game time by one tick, spreading every rumor one hop.",
  recall:
    "List what an NPC knows about the player, with source and confidence.",
  attitude:
    "Score how an NPC feels about the player, with a per-event breakdown.",
  explain:
    "Return the chain of NPCs through which an NPC learned about an event.",
  whoKnows:
    "List which NPCs witnessed, heard about, or are unaware of an event.",
  gossipHubs: "Rank NPCs by how much influence they have on how rumors spread.",
  adaptPolicy:
    "Update an NPC's learned behaviour after an interaction outcome.",
  say: "Get an in-character reply that only uses what the NPC actually knows.",
  snapshot: "Return the player's graph (nodes and edges) for visualisation.",
};
export function createMcpServer(client: HearsayClient) {
  const server = new McpServer({ name: "hearsay", version: "0.1.0" });
  function register<N extends McpToolName>(name: N) {
    const tool = TOOLS[name];
    server.registerTool(
      name,
      { description: descriptions[name], inputSchema: tool.input.shape },
      async (args: unknown) => {
        const result = await client.call(
          name,
          tool.input.parse(args) as ToolInput<N>,
        );
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          isError: !result.ok,
        };
      },
    );
  }
  for (const name of Object.keys(TOOLS) as ToolName[])
    if (name !== "sayNaive") register(name);
  return server;
}
