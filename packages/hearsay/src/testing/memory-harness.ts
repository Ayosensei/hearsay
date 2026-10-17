import { worldHarness, data } from "./world-harness";
import { npcs, trusts } from "./golden-seed";
import { createMemory } from "../memory";

export async function memoryHarness() {
  const h = await worldHarness();
  const roles: Record<string, string> = {
    brom: "blacksmith",
    mira: "innkeeper",
    garrick: "guard captain",
    tilda: "merchant",
    fenn: "beggar",
    ayla: "healer",
  };
  const seed = {
    ...h.seed,
    trusts,
    npcs: npcs.map((npc) => ({
      ...npc,
      role: roles[npc.id] ?? "resident",
      faction:
        npc.id === "garrick"
          ? "guard"
          : npc.id === "tilda"
            ? "merchants"
            : "townsfolk",
      persona: "A synthetic test resident of Hollowbrook.",
    })),
  };
  await h.writeSeed(seed);
  data(await h.world.ensureWorld());
  const playerId = h.playerId();
  const otherPlayerId = h.playerId();
  data(await h.world.newPlayer({ playerId }));
  data(await h.world.newPlayer({ playerId: otherPlayerId }));
  return { ...h, playerId, otherPlayerId, memory: createMemory(h.db, h.world) };
}
