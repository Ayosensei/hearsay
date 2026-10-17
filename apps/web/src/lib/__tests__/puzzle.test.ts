import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { connectDatabase, createHearsay } from "@hearsay/core";
import type { Database } from "@hearsay/core";
import type { HearsayClient } from "@hearsay/contract";
import { PuzzleDirector } from "../../server/puzzle-director";
import { LiveTownClient } from "../live-town";
import { CASE_SUBJECT } from "../puzzle";
import { approach } from "../town-space";
import type { ScenarioId } from "../scenarios";
import type { ToolEnvelope, TownState } from "../types";

const tag = randomUUID().replaceAll("-", "").slice(0, 12), template = `test_puzzle_${tag}`;
const players: string[] = [];
let db: Database, tools: HearsayClient, director: PuzzleDirector, adapter: LiveTownClient;
const data = <T>(result: ToolEnvelope<T>): T => { if (!result.ok) throw new Error(result.error.message); return result.data; };
const player = (id: ScenarioId) => { const key = `puzzle_${id}_${randomUUID().replaceAll("-", "").slice(0, 20)}`; players.push(key); return key; };
const inspect = async (playerId: string) => data(await director.execute({ playerId, action: "inspect" }));
const choose = async (playerId: string, choiceId: string, npc: string) => data(await director.execute({ playerId, action: "choose", choiceId, position: approach(npc) }));
beforeAll(async () => {
  const connection = await connectDatabase(); if (!connection.ok) throw new Error(connection.error.message);
  db = connection.data; tools = createHearsay(db, { templateGraph: template, seedPath: resolve(process.cwd(), "../../seed/hollowbrook-expanded.json") });
  director = new PuzzleDirector(tools); adapter = new LiveTownClient(tools);
}, 30000);
afterAll(async () => {
  if (!db) return;
  try { const list = await db.list(); if (!list.ok) throw new Error(list.error.message); for (const name of [template, ...players.map((id) => `player:${id}`)]) if (list.data.includes(name)) expect((await db.delete(name)).ok).toBe(true); }
  finally { await db.close(); }
});

it("persists a two-AP budget and advances gossip only at the turn boundary", async () => {
  const id = player("medicine"); let town = await inspect(id);
  expect(town.puzzle?.ap).toBe(2);
  town = await choose(id, "med-clinic", "ayla");
  expect(town.tick).toBe(0); expect(town.puzzle?.ap).toBe(1);
  expect((await inspect(id)).puzzle?.ap).toBe(1);
  const event = town.events.find((item) => item.subject === "preparing chapel remedies"); if (!event) throw new Error("Missing deed");
  town = data(await director.execute({ playerId: id, action: "ask", npcId: "mira", eventId: event.id, position: approach("mira") }));
  expect(town.tick).toBe(1); expect(town.puzzle?.ap).toBe(2);
  const note = town.puzzle?.clues[0]; expect(note?.source).toBe("?"); expect(note?.tick).toBe(0);
  const recall = await tools.call("recall", { playerId: id, npcId: "mira" });
  expect(recall.ok && recall.data.items.some((item) => item.eventId === event.id)).toBe(true);
  expect((await inspect(id)).puzzle?.clues[0].source).toBe("?");
}, 30000);

it("removes secret memories, sources, exact scores and query arguments from live responses", async () => {
  const id = player("coverup"), result = await director.execute({ playerId: id, action: "inspect" });
  const town = data(result); expect(result.trace).toEqual([]); expect(town.recentTraces).toEqual([]);
  expect(town.npcs.every((npc) => npc.rumors.length === 0 && npc.attitudeScore === 0 && !npc.primaryRumor)).toBe(true);
  expect(town.graphEdges.every((edge) => edge.type === "TRUSTS")).toBe(true);
  expect(town.graphNodes.every((node) => node.type === "npc")).toBe(true);
  expect(town.events.every((event) => event.witnessId === "")).toBe(true);
  expect(town.puzzle?.state.trust).toBeUndefined(); expect(town.puzzle?.state.goals[0].complete).toBeUndefined();
  expect(data(await adapter.getTownState(id)).events.some((event) => event.witnessId === "brom")).toBe(true);
});

it("charges a refused social attempt, rejects remote requests, and does not repeat requests within a turn", async () => {
  const id = player("medicine"); await inspect(id);
  expect((await director.execute({ playerId: id, action: "ask", npcId: "ayla", position: approach("brom") })).ok).toBe(false);
  const refused = await choose(id, "med-charity", "ayla"); expect(refused.puzzle?.ap).toBe(1); expect(refused.puzzle?.feedback).toContain("refused");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "med-charity", position: approach("ayla") })).ok).toBe(false);
  expect((await inspect(id)).puzzle?.ap).toBe(1);
});

it("loses a cover-up to real gossip before the inspector deadline and then reveals the graph", async () => {
  const id = player("coverup"); await inspect(id);
  let town = data(await director.execute({ playerId: id, action: "wait" })); expect(town.puzzle?.fog).toBe(true);
  town = data(await director.execute({ playerId: id, action: "wait" }));
  expect(town.tick).toBe(2); expect(town.puzzle?.state.stage).toBe("lost"); expect(town.puzzle?.fog).toBe(false);
  expect(town.puzzle?.state.reason).toContain("cover is blown"); expect(town.graphEdges.some((edge) => edge.type === "TOLD")).toBe(true);
  expect((await inspect(id)).puzzle?.state.stage).toBe("lost");
});

it("arrests a hostile serious-crime suspect, and supports an early redemption win", async () => {
  const loss = player("medicine"); await inspect(loss);
  const arrested = await choose(loss, "threaten-guard", "garrick"); expect(arrested.puzzle?.state.reason).toContain("arrested");
  const win = player("redemption"); await inspect(win);
  await choose(win, "help-ayla", "ayla"); const redeemed = await choose(win, "redeem-aid", "ayla");
  expect(redeemed.puzzle?.state.stage).toBe("won"); expect(redeemed.tick).toBeLessThan(10);
});

it("grades the detective reconstruction from the exact explain path and preserves the score", async () => {
  const id = player("detective"), hidden = await inspect(id);
  expect(hidden.puzzle?.detective?.truth).toBeUndefined(); expect(hidden.puzzle?.ap).toBe(2);
  const raw = data(await adapter.getTownState(id)), event = raw.events.find((item) => item.subject === CASE_SUBJECT); if (!event) throw new Error("Missing case");
  const path = await tools.call("explain", { playerId: id, npcId: "garrick", eventId: event.id }); if (!path.ok) throw new Error(path.error.message);
  const answer = { witnessId: event.witnessId, route: path.data.chain.map((hop) => hop.npcId), account: path.data.status === "not_in_graph" ? "unaware" as const : path.data.chain.length === 1 ? "eyewitness" as const : "secondhand" as const };
  const solved = data(await director.execute({ playerId: id, action: "accuse", answer }));
  expect(solved.puzzle?.detective?.score).toBe(3); expect(solved.puzzle?.detective?.truth).toEqual(answer);
  expect(solved.puzzle?.state.stage).toBe("won"); expect((await inspect(id)).puzzle?.detective?.score).toBe(3);
  expect((await director.execute({ playerId: id, action: "accuse", answer })).ok).toBe(false);
}, 30000);

it("ends a detective case after one wrong reconstruction or an expired deadline", async () => {
  const id = player("detective"); await inspect(id);
  const raw = data(await adapter.getTownState(id)), root = raw.events.find((event) => event.subject === CASE_SUBJECT)?.witnessId;
  const wrong = raw.npcs.find((npc) => npc.id !== root)?.id; if (!wrong) throw new Error("Missing wrong witness");
  const failed = data(await director.execute({ playerId: id, action: "accuse", answer: { witnessId: wrong, route: [], account: "unaware" } }));
  expect(failed.puzzle?.detective?.score).toBeLessThan(3); expect(failed.puzzle?.state.stage).toBe("lost");
  const expired = data(await director.execute({ playerId: player("detective"), action: "verdict" }));
  expect(expired.tick).toBe(8); expect(expired.puzzle?.state.stage).toBe("lost"); expect(expired.puzzle?.detective?.truth).toBeDefined();
}, 30000);
