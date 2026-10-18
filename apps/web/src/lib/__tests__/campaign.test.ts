import { expect, it } from "vitest";
import { campaignOrder, canPlayLevel, emptyCampaign, nextCampaignLevel, parseCampaign } from "../campaign";

it("requires the demo before any mission and puts Night Watch first", () => {
  expect(campaignOrder[0]).toBe("watch");
  for (const id of campaignOrder) expect(canPlayLevel(emptyCampaign(), id)).toBe(false);
  expect(nextCampaignLevel(emptyCampaign())).toBeUndefined();
  expect(canPlayLevel({ demo: true, completed: [] }, "watch")).toBe(true);
  expect(canPlayLevel({ demo: true, completed: [] }, "medicine")).toBe(false);
});
it("unlocks exactly the next level and retains replay access", () => {
  for (let count = 0; count <= campaignOrder.length; count++) {
    const progress = { demo: true, completed: campaignOrder.slice(0, count) };
    expect(nextCampaignLevel(progress)).toBe(campaignOrder[count]);
    campaignOrder.forEach((id, index) => expect(canPlayLevel(progress, id)).toBe(index <= count));
  }
});
it("does not unlock gaps from an old save or out-of-order completion", () => {
  const progress = { demo: true, completed: ["detective" as const] };
  expect(nextCampaignLevel(progress)).toBe("watch");
  expect(canPlayLevel(progress, "detective")).toBe(false);
});
it("restores only recognized progress and safely handles invalid saves", () => {
  expect(parseCampaign('{"demo":true,"completed":["watch","watch","bogus"]}')).toEqual({ demo: true, completed: ["watch"] });
  expect(parseCampaign(JSON.stringify({ demo: true, completed: ["watch", "medicine"] }))).toEqual({ demo: true, completed: ["watch", "medicine"] });
  for (const raw of [null, "broken", "null", '{"demo":"true","completed":{}}']) expect(parseCampaign(raw)).toEqual(emptyCampaign());
});
