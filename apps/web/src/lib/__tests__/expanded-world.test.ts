import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { connectDatabase, createHearsay } from "@hearsay/core";
import type { Database } from "@hearsay/core";
import type { ToolInput, ToolName, ToolOutput, HearsayClient } from "@hearsay/contract";

const suffix = randomUUID().replaceAll("-", "").slice(0, 20);
const template = `test_expanded_${suffix}`;
const playerId = `expanded_${suffix}`;
const second = `expanded_b_${suffix}`;
let db: Database;
let client: HearsayClient;
async function call<N extends ToolName>(name: N, input: ToolInput<N>): Promise<ToolOutput<N>> {
  const result = await client.call(name, input);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.data;
}
beforeAll(async () => {
  const connection = await connectDatabase();
  if (!connection.ok) throw new Error(connection.error.message);
  db = connection.data;
  client = createHearsay(db, { templateGraph: template, seedPath: resolve(process.cwd(), "../../seed/hollowbrook-expanded.json") });
  await call("newPlayer", { playerId });
}, 30000);
afterAll(async () => {
  if (!db) return;
  try {
    const listed = await db.list();
    if (!listed.ok) throw new Error(listed.error.message);
    for (const graph of [template, `player:${playerId}`, `player:${second}`]) {
      if (listed.data.includes(graph)) expect((await db.delete(graph)).ok).toBe(true);
    }
  } finally { await db.close(); }
});

it("publishes thirteen graph residents, family facts, and directional trust", async () => {
  const world = await call("getWorld", {});
  expect(world.npcs).toHaveLength(13);
  expect(world.places).toHaveLength(12);
  const snapshot = await call("snapshot", { playerId });
  expect(snapshot.edges.filter((e) => e.type === "TRUSTS")).toHaveLength(41);
  expect(snapshot.nodes.find((n) => n.id === "Fact:family_vale")?.props.text).toContain("adult children");
  for (const id of ["rowan", "elin", "lysa", "oren"])
    expect(snapshot.edges.some((e) => e.type === "BELIEVES" && e.from === `NPC:${id}` && e.to === "Fact:family_vale")).toBe(true);
});

it("branches through family, picks the stronger competing source, and explains five hops", async () => {
  const event = await call("recordEvent", { playerId, type: "stole", subject: "iron sword", placeId: "forge", witnesses: ["brom"] });
  const rounds = [];
  for (let turn = 1; turn <= 5; turn++) {
    rounds.push(await call("advanceTime", { playerId }));
    if (turn < 5) expect((await call("recall", { playerId, npcId: "julian" })).status).toBe("not_in_graph");
  }
  expect(rounds[0].steps.map((s) => s.listenerId).sort()).toEqual(["ayla", "mira", "rowan"]);
  expect(rounds[1].steps.find((s) => s.listenerId === "garrick")?.credibility).toBeCloseTo(.63);
  expect(rounds[2].steps.find((s) => s.listenerId === "tilda")).toEqual(expect.objectContaining({ tellerId: "elin", credibility: .524875 }));
  expect(rounds[3].steps.find((s) => s.listenerId === "silas")?.credibility).toBeCloseTo(.5491);
  expect(rounds[4].steps.find((s) => s.listenerId === "julian")?.credibility).toBeCloseTo(.43928);
  const why = await call("explain", { playerId, npcId: "julian", eventId: event.eventId });
  expect(why.chain.map((n) => n.npcId)).toEqual(["brom", "rowan", "elin", "marta", "silas", "julian"]);
  expect(why.hopConfidences.at(-1)).toBeCloseTo(.43928);
  const quiet = await call("advanceTime", { playerId });
  expect(quiet.steps).toEqual([]);
}, 30000);

it("keeps four family witnesses distinct from an unaware bachelor and a separate save", async () => {
  const event = await call("recordEvent", { playerId, type: "helped", subject: "repairing the family gate", placeId: "vale_home", witnesses: ["rowan", "elin", "lysa", "oren"] });
  const known = await call("whoKnows", { playerId, eventId: event.eventId });
  expect(known.witnesses.sort()).toEqual(["elin", "lysa", "oren", "rowan"]);
  expect(known.unaware).toContain("julian");
  const said = await call("say", { playerId, npcId: "julian", text: "What do you know about repairing the family gate?" });
  expect(said.usedEventIds).not.toContain(event.eventId);
  expect(said.firewall.passed).toBe(true);
  await call("newPlayer", { playerId: second });
  expect((await call("recall", { playerId: second, npcId: "rowan" })).items).toEqual([]);
  expect((await call("attitude", { playerId: second, npcId: "rowan" })).score).toBe(0);
}, 30000);
