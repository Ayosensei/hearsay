import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { connectDatabase, createHearsay } from "@hearsay/core";
import { createMcpServer } from "./index";
const connection = await connectDatabase();
if (!connection.ok) {
  console.error("Hearsay: database connection unavailable.");
  process.exitCode = 1;
} else {
  const db = connection.data;
  const client = createHearsay(db, {
    seedPath: process.env.HEARSAY_SEED_PATH,
    templateGraph: process.env.HEARSAY_TEMPLATE_GRAPH,
  });
  const server = createMcpServer(client);
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    await server.close();
    await db.close();
  };
  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
  process.stdin.once("end", () => void close());
  try {
    await server.connect(new StdioServerTransport());
  } catch {
    console.error("Hearsay: MCP transport failed.");
    await close();
    process.exitCode = 1;
  }
}
