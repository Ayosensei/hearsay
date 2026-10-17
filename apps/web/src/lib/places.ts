/** Hollowbrook's locked places from the graph model. Shared by the action modal and engine. */
export const PLACES = [
  "Brom's Forge",
  "The Copper Kettle",
  "Guard Barracks",
  "Market Row",
  "Chapel of Ash",
  "Town Square",
] as const;

export const isKnownPlace = (name: string): boolean => (PLACES as readonly string[]).includes(name);

