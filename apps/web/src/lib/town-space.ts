import type { TownState } from "./types";
import { homeOf, homes, placeFor } from "./town-residents";
import type { District } from "./town-residents";

export interface TownPosition { x: number; y: number; district: District }
export const SIGHT_RADIUS = 240;
export function approach(id: string): TownPosition {
  const home = homeOf(id);
  return { x: home.x - 140, y: home.y + 20, district: home.district };
}
// Local game geometry chooses observers; the core resolves every submitted ID
// and owns all persistent memories, opinions and gossip in FalkorDB.
export function observeAt<T extends { id: string }>(position: TownPosition, town: { npcs: T[]; places?: TownState["places"] }) {
  const locals = town.npcs.filter((npc) => homes[npc.id]?.district === position.district);
  const distance = (npc: T) => Math.hypot(homeOf(npc.id).x - position.x, homeOf(npc.id).y - position.y);
  const nearest = [...locals].sort((a, b) => distance(a) - distance(b))[0];
  const place = town.places?.find((item) => item.id === placeFor[nearest?.id ?? ""]);
  return { place, witnesses: locals.filter((npc) => distance(npc) <= SIGHT_RADIUS) };
}
