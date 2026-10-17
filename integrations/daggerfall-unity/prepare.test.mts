import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { prepareWorld } from "./prepare.mts";

const seed = JSON.parse(
  await readFile(
    new URL("../../seed/hollowbrook.json", import.meta.url),
    "utf8",
  ),
);
const profile = {
  playerId: "dfu_" + "a".repeat(32),
  apiKey: "",
  worldPrepared: false,
  bindings: ["brom", "mira", "garrick"].map((slot, i) => ({
    slot,
    key: `1:2:${i}:4`,
    name: `Test resident ${i}`,
  })),
};
test("binds actual supplied names and leaves the production seed unchanged", () => {
  const before = JSON.stringify(seed);
  const result = prepareWorld(profile, seed);
  assert.deepEqual(
    result.seed.npcs.map((n) => n.name),
    profile.bindings.map((b) => b.name),
  );
  assert.equal(result.seed.places[0].id, "dfu_location");
  assert.equal(result.seed.trusts[1].weight, 0.7);
  assert.equal(JSON.stringify(seed), before);
  assert.equal(result.templateGraph, prepareWorld(profile, seed).templateGraph);
});
test("rejects unbound, duplicate NPC and duplicate slot profiles", () => {
  for (const replacement of [
    { key: "" },
    { key: profile.bindings[0].key },
    { slot: "brom" },
  ]) {
    const invalid = structuredClone(profile);
    Object.assign(invalid.bindings[1], replacement);
    assert.throws(() => prepareWorld(invalid, seed));
  }
});
