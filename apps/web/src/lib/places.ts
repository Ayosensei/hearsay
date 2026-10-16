/** Hollowbrook's places. Shared by the action modal (choices) and the engine (validation). */
export const PLACES = [
  "The Stumbling Badger (Tavern)",
  "Blacksmith Forge",
  "Town Square Fountain",
  "Apothecary Lab",
  "City Watch Barracks",
] as const;

export const isKnownPlace = (name: string): boolean => (PLACES as readonly string[]).includes(name);
