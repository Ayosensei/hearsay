import { expect, it } from "vitest";
import { selectGossip } from "./gossip-selection";
import type { GossipCandidate } from "./gossip-selection";

const candidate = (
  teller: string,
  cred: number,
  eventId = "ev_a",
  listener = "tilda",
): GossipCandidate => ({
  eventId,
  teller,
  listener,
  cred,
  root: "brom",
  hop: 2,
});

it("chooses the strongest teller for each event and listener without mutating input", () => {
  const candidates = [
    candidate("garrick", 0.315),
    candidate("fenn", 0.36),
    candidate("mira", 0.9, "ev_b"),
    candidate("brom", 0.5, "ev_a", "ayla"),
  ];
  const before = structuredClone(candidates);
  expect(selectGossip(candidates)).toEqual([
    candidates[3],
    candidates[1],
    candidates[2],
  ]);
  expect(candidates).toEqual(before);
});

it("breaks equal credibility ties by teller ID regardless of arrival order", () => {
  const a = candidate("ayla", 0.5),
    b = candidate("brom", 0.5);
  expect(selectGossip([b, a])).toEqual([a]);
  expect(selectGossip([a, b])).toEqual([a]);
});

it("returns no picks for an empty round and collapses duplicate candidates", () => {
  expect(selectGossip([])).toEqual([]);
  const a = candidate("fenn", 0.36);
  expect(selectGossip([a, a])).toEqual([a]);
});
