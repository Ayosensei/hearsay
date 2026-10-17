import { expect, it } from "vitest";
import { attitudeLabel, scoreAttitude } from "./opinion";
import type { OpinionEvent } from "./opinion";

const theft: OpinionEvent = {
  eventId: "ev_theft",
  type: "stole",
  weight: -0.8,
  tick: 0,
  confidence: 0.63,
  learnedFrom: "mira",
};

it("matches the exact Garrick and Brom worked examples", () => {
  const garrick = scoreAttitude({ loyalty: 0.9, greed: 0.2 }, 2, [theft]);
  expect(garrick.score).toBeCloseTo(-0.562464, 12);
  expect(garrick.label).toBe("wary");
  expect(garrick.contributions[0]).toMatchObject({
    eventId: "ev_theft",
    confidence: 0.63,
    learnedFrom: "mira",
  });
  const brom = scoreAttitude({ loyalty: 0.6, greed: 0.4 }, 2, [
    { ...theft, confidence: 1, learnedFrom: "witness" },
  ]);
  expect(brom.score).toBeCloseTo(-0.7632, 12);
  expect(brom.label).toBe("hostile");
});

it.each([
  [-1, "hostile"],
  [-0.6, "hostile"],
  [-0.5999, "wary"],
  [-0.2, "wary"],
  [-0.1999, "neutral"],
  [0, "neutral"],
  [0.1999, "neutral"],
  [0.2, "friendly"],
  [0.5999, "friendly"],
  [0.6, "devoted"],
  [1, "devoted"],
])("classifies score %s as %s", (score, label) => {
  expect(attitudeLabel(Number(score))).toBe(label);
});

it("returns neutral without knowledge and clamps the summed score, not individual contributions", () => {
  expect(scoreAttitude({ loyalty: 1, greed: 0 }, 0, [])).toEqual({
    score: 0,
    label: "neutral",
    contributions: [],
  });
  const bad = { ...theft, confidence: 1, weight: -1 };
  const negative = scoreAttitude({ loyalty: 1, greed: 0 }, 0, [bad, bad]);
  expect(negative.score).toBe(-1);
  expect(negative.contributions[0]?.effect).toBeCloseTo(-1.3, 12);
  const positive = scoreAttitude({ loyalty: 0, greed: 0 }, 0, [
    { ...bad, weight: 1 },
    { ...bad, weight: 1 },
  ]);
  expect(positive.score).toBe(1);
});

it("floors recency at 0.3 and rewards kindness less for greedy NPCs", () => {
  const gift = {
    ...theft,
    type: "helped" as const,
    weight: 0.5,
    confidence: 1,
  };
  expect(
    scoreAttitude({ loyalty: 0, greed: 0 }, 100, [gift]).score,
  ).toBeCloseTo(0.195, 12);
  expect(
    scoreAttitude({ loyalty: 0, greed: 1 }, 100, [gift]).score,
  ).toBeCloseTo(0.105, 12);
  const events = [{ ...gift, confidence: 0 }];
  const before = structuredClone(events);
  expect(scoreAttitude({ loyalty: 0, greed: 0 }, 0, events).score).toBe(0);
  expect(events).toEqual(before);
});
