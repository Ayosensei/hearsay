import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { connectDatabase, createHearsay } from "@hearsay/core";
import type { Database } from "@hearsay/core";
import { LiveTownClient } from "../live-town";
import { challengeStage } from "../challenge";
import { memoryGraph } from "../memory-graph";
import type { ToolEnvelope } from "../types";

const suffix = randomUUID().replaceAll("-", "").slice(0, 16);
const template = `test_challenge_${suffix}`;
const players = [`win_${suffix}`, `lose_${suffix}`, `clean_${suffix}`];
let db: Database;
let client: LiveTownClient;
function data<T>(result: ToolEnvelope<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
beforeAll(async () => {
  const connected = await connectDatabase();
  if (!connected.ok) throw new Error(connected.error.message);
  db = connected.data;
  client = new LiveTownClient(createHearsay(db, { templateGraph: template, seedPath: resolve(process.cwd(), "../../seed/hollowbrook-expanded.json") }));
}, 30000);
afterAll(async () => {
  if (!db) return;
  try {
    const graphs = await db.list();
    if (!graphs.ok) throw new Error(graphs.error.message);
    for (const name of [template, ...players.map((player) => `player:${player}`)])
      if (graphs.data.includes(name)) expect((await db.delete(name)).ok).toBe(true);
  } finally { await db.close(); }
});

it("wins through actual friendly attitude before the guard learns the theft", async () => {
  let town = data(await client.getTownState(players[0]));
  expect(challengeStage(town)).toBe("briefing");
  town = data(await client.recordEvent({ playerId: players[0], type: "stole", placeId: "forge", subject: "iron sword", witnesses: ["brom"] }, town));
  const theft = town.events[0].id;
  expect(challengeStage(town, theft)).toBe("race");
  const witnessed = memoryGraph(town, theft);
  expect(witnessed.nodes).toHaveLength(14);
  expect(witnessed.edges.map((edge) => edge.type)).toEqual(["KNOWS"]);
  expect(witnessed.edges[0].source).toBe("NPC:brom");
  town = data(await client.advanceTime(town));
  expect(memoryGraph(town, theft).edges.filter((edge) => edge.type === "TOLD")).toHaveLength(3);
  town = data(await client.recordEvent({ playerId: players[0], type: "helped", placeId: "barracks", subject: "repairing the gate", witnesses: ["garrick"] }, town));
  expect(challengeStage(town, theft)).toBe("won");
  expect(town.npcs.find((npc) => npc.id === "garrick")?.attitude).toBe("friendly");
  expect(memoryGraph(town, theft, true).edges.filter((edge) => edge.type === "TRUSTS")).toHaveLength(41);
  expect(memoryGraph(town, theft).nodes.filter((node) => node.type === "event").map((node) => node.id)).toEqual([`Event:${theft}`]);
});

it("loses when real gossip reaches Garrick and highlights only actual explain edges", async () => {
  let town = data(await client.getTownState(players[1]));
  town = data(await client.recordEvent({ playerId: players[1], type: "stole", placeId: "forge", subject: "iron sword", witnesses: ["brom"] }, town));
  const theft = town.events[0].id;
  town = data(await client.advanceTime(town));
  town = data(await client.advanceTime(town));
  expect(challengeStage(town, theft)).toBe("lost");
  const path = data(await client.explainProvenance("garrick", theft, town));
  expect(path?.hops.map((hop) => hop.npcId)).toEqual(["brom", "mira", "garrick"]);
  const graphIds = new Set(memoryGraph(town, theft).edges.map((edge) => edge.id));
  expect(path?.edgeIds?.every((id) => graphIds.has(id))).toBe(true);
  expect(challengeStage(data(await client.getTownState(players[1])), theft)).toBe("lost");
});

it("keeps a clean challenge isolated and never awards a missing objective", async () => {
  const town = data(await client.getTownState(players[2]));
  expect(town.events).toEqual([]);
  expect(memoryGraph(town, "").edges).toEqual([]);
  expect(challengeStage(town, "ev_missing")).toBe("unavailable");
  expect(town.npcs.find((npc) => npc.id === "garrick")?.attitude).toBe("neutral");
});
