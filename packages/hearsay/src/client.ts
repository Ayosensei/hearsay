import type {
  Envelope,
  HearsayClient,
  ToolName,
  ToolInput,
  ToolOutput,
} from "@hearsay/contract";
import type { Database } from "./db";
import { createWorld } from "./world";
import type { WorldOptions } from "./world";
import { createMemory } from "./memory";
import { createGossip } from "./gossip";
import { createOpinion } from "./opinion-tools";
import { createDialogue } from "./dialogue";
import type { DialogueOptions } from "./dialogue";
import { createPolicy } from "./policy";

type Handlers = {
  [K in ToolName]: (input: ToolInput<K>) => Promise<Envelope<ToolOutput<K>>>;
};
export function createHearsay(
  db: Database,
  options: WorldOptions & DialogueOptions = {},
) {
  const world = createWorld(db, options);
  const handlers: Handlers = {
    getWorld: world.getWorld,
    newPlayer: world.newPlayer,
    resetPlayer: world.resetPlayer,
    ...createMemory(db, world),
    ...createGossip(db, world),
    ...createOpinion(db, world),
    ...createDialogue(db, world, options),
    ...createPolicy(db, world),
    sayNaive: async () => ({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Control dialogue is scheduled for G13.",
      },
      trace: [],
    }),
  };
  const client: HearsayClient = {
    call: (name, input) => {
      if (!Object.hasOwn(handlers, name))
        return Promise.resolve({
          ok: false,
          error: { code: "BAD_ARGS", message: "Unknown tool." },
          trace: [],
        });
      return handlers[name](input);
    },
  };
  return { ...client, ensureWorld: world.ensureWorld };
}
