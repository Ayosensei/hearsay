export type District = "oldtown" | "vale" | "riverside";
export const districts: Record<District, { name: string; image: string }> = {
  oldtown: { name: "Old Town", image: "/town/hollowbrook.png" },
  vale: { name: "Vale Lane", image: "/town/vale-lane.png" },
  riverside: { name: "Riverside", image: "/town/riverside.png" },
};
interface Home { x: number; y: number; place: string; district: District }
// Coordinates are presentation only; memories and social relationships always come from tools.
export const homes: Record<string, Home> = {
  brom: { x: 360, y: 660, place: "Brom’s Forge", district: "oldtown" },
  mira: { x: 900, y: 660, place: "The Copper Kettle", district: "oldtown" },
  garrick: { x: 1490, y: 660, place: "Guard Barracks", district: "oldtown" },
  rowan: { x: 300, y: 660, place: "Timber yard", district: "vale" },
  elin: { x: 710, y: 660, place: "Bakery", district: "vale" },
  lysa: { x: 1120, y: 660, place: "Family home", district: "vale" },
  oren: { x: 1510, y: 660, place: "Workshop", district: "vale" },
  ayla: { x: 210, y: 520, place: "Chapel", district: "riverside" },
  fenn: { x: 480, y: 520, place: "Town square", district: "riverside" },
  tilda: { x: 760, y: 520, place: "Market", district: "riverside" },
  julian: { x: 1030, y: 520, place: "Boarding house", district: "riverside" },
  marta: { x: 1300, y: 520, place: "Butchery", district: "riverside" },
  silas: { x: 1570, y: 520, place: "River docks", district: "riverside" },
};
export const extraCast = ["rowan", "elin", "lysa", "oren", "ayla", "fenn", "julian", "marta", "silas", "tilda"];
export const placeFor: Record<string, string> = {
  brom: "forge", mira: "inn", garrick: "barracks", rowan: "timberyard", elin: "bakery",
  lysa: "vale_home", oren: "vale_home", ayla: "chapel", fenn: "square", tilda: "market",
  julian: "boardinghouse", marta: "butchery", silas: "docks",
};
export function districtOf(id: string): District { return homes[id]?.district ?? "oldtown"; }
export function homeOf(id: string, index = 0): Home {
  return homes[id] ?? { x: 240 + (index % 6) * 260, y: 660, place: "Town", district: "oldtown" };
}
