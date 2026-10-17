import { resolve } from "node:path";
import { connectDatabase, createHearsay } from "@hearsay/core";
import type { HearsayClient } from "@hearsay/contract";

type Connection = Awaited<ReturnType<typeof connectDatabase>>;
type Runtime = { client: HearsayClient; connection: Connection };
const shared = globalThis as typeof globalThis & {
  hearsayWeb?: Promise<Runtime>;
};

export async function getHearsay() {
  shared.hearsayWeb ??= (async () => {
    const connection = await connectDatabase();
    if (!connection.ok) throw new Error("DB_UNAVAILABLE");
    return {
      connection,
      client: createHearsay(connection.data, {
        seedPath: process.env.HEARSAY_SEED_PATH ?? resolve(process.cwd(), "../../seed/hollowbrook-expanded.json"),
        templateGraph: process.env.HEARSAY_TEMPLATE_GRAPH ?? "world_template_hollowbrook13",
      }),
    };
  })();
  try {
    return (await shared.hearsayWeb).client;
  } catch (error) {
    shared.hearsayWeb = undefined;
    throw error;
  }
}

export async function reconnectHearsay() {
  const previous = shared.hearsayWeb;
  shared.hearsayWeb = undefined;
  const runtime = await previous?.catch(() => undefined);
  if (runtime?.connection.ok) await runtime.connection.data.close();
}
