// Only the locked structural seed needed by the G2 query spike, not DuroT's world content.
export const npcs = [
  { id: "brom", name: "Brom", greed: 0.4, courage: 0.7, loyalty: 0.6 },
  { id: "mira", name: "Mira", greed: 0.5, courage: 0.4, loyalty: 0.5 },
  { id: "garrick", name: "Garrick", greed: 0.2, courage: 0.9, loyalty: 0.9 },
  { id: "tilda", name: "Tilda", greed: 0.8, courage: 0.3, loyalty: 0.3 },
  { id: "fenn", name: "Old Fenn", greed: 0.3, courage: 0.2, loyalty: 0.2 },
  { id: "ayla", name: "Sister Ayla", greed: 0.1, courage: 0.5, loyalty: 0.8 },
];
export const trusts = [
  { truster: "mira", trusted: "brom", weight: 0.9 },
  { truster: "brom", trusted: "mira", weight: 0.8 },
  { truster: "fenn", trusted: "mira", weight: 0.8 },
  { truster: "mira", trusted: "fenn", weight: 0.6 },
  { truster: "garrick", trusted: "mira", weight: 0.7 },
  { truster: "mira", trusted: "garrick", weight: 0.6 },
  { truster: "tilda", trusted: "fenn", weight: 0.5 },
  { truster: "fenn", trusted: "tilda", weight: 0.3 },
  { truster: "ayla", trusted: "mira", weight: 0.6 },
  { truster: "mira", trusted: "ayla", weight: 0.7 },
  { truster: "tilda", trusted: "garrick", weight: 0.5 },
  { truster: "garrick", trusted: "tilda", weight: 0.4 },
  { truster: "ayla", trusted: "brom", weight: 0.5 },
];
