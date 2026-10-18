import type { TownState } from "../lib/types";
import type { CrossingSave } from "../lib/crossing";
import type { CrossingStore } from "./crossing-store";

export function storyLine(save: CrossingSave, npc: string, text: string, tick: number) {
  save.lines.push({ id: `${tick}-${save.lines.length}`, npc, text, tick });
}
export async function storyReaction(save: CrossingSave, town: TownState, store: CrossingStore) {
  const has = (id: string) => save.flags.includes(id);
  const mark = (id: string) => { if (!has(id)) save.flags.push(id); };
  const say = (id: string, npc: string, text: string) => { if (!has(id)) { mark(id); storyLine(save, npc, text, town.tick); } };
  const choices = (id: string) => town.events.find((event) => event.subject === `bridge: ${id}`);
  const knows = (npc: string, id: string) => {
    const event = choices(id);
    return event && town.npcs.find((n) => n.id === npc)?.rumors.some((r) => r.eventId === event.id && r.confidence >= .25);
  };
  if (has("planks") && !has("secret-ready") && town.tick > (choices("planks")?.tickOccurred ?? town.tick)) {
    mark("secret-ready"); say("oren-ready", "oren", "The planks are tied. Silas can launch them, but at the fifth bell the river will be too rough.");
  }
  if (has("expose") && town.tick > (choices("expose")?.tickOccurred ?? town.tick)) {
    mark("bridge-open"); say("marta-open", "marta", "The ledger checks out. Garrick can answer to the town. I've lifted the barrier. Bring Lysa now.");
  }
  if (knows("marta", "defend")) say("marta-confronted", "marta", "So you're calling me a liar in public? My offer is off the table. Bring proof, or stay away from my bridge.");
  if (knows("marta", "planks") && !has("distortion")) {
    mark("distortion");
    await store.claim("stolen-timber", "marta", "The traveller stole Marta's timber for an illegal crossing.", town.tick, "secret-crossing");
    say("marta-accuses", "marta", "A secret crossing? With whose timber? I'll tell the guard what you've taken.");
  }
  const claims = await store.claims();
  const guardRumour = claims.find((c) => c.id === "stolen-timber" && c.npc === "garrick");
  if (guardRumour) say("guard-warning", "garrick", `I hear you've stolen timber. ${guardRumour.via === "witness" ? "Explain yourself." : `My source is ${town.npcs.find((n) => n.id === guardRumour.via)?.name ?? guardRumour.via}.`} Bring Lysa across safely; then we'll discuss this accusation.`);
  if (town.tick >= 3) say("lysa-warning", "lysa", "The light is going. I don't care who wins the argument. Can we please go?");
  save.lastTick = town.tick;
}

export function finishCrossing(save: CrossingSave, town: TownState, escorted = false) {
  if (save.ending) return;
  const has = (flag: string) => save.flags.includes(flag);
  if (escorted) {
    save.won = true;
    save.ending = has("secret-open") ? "Across, with a price" : has("quiet") ? "A life saved, a truth buried" : has("expose") ? "The debt brought to light" : "Your purse, her passage";
    storyLine(save, "lysa", has("secret-open") ? "We made it. Marta will never forgive that crossing, but I'm here." : "I'm across. Thank you for choosing me before the argument.", town.tick);
  } else if (town.tick >= 6) {
    save.won = false;
    save.ending = has("receipt") ? "The truth arrived too late" : "Dusk at a closed bridge";
    storyLine(save, "rowan", has("receipt") ? "You found the truth. But Lysa is still on this side of the river. The chapel has shut." : "The bells have stopped. We spent the daylight arguing, and Lysa never crossed.", town.tick);
  }
}
