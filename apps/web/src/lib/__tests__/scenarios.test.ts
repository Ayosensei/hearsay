import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { connectDatabase, createHearsay } from "@hearsay/core";
import type { Database } from "@hearsay/core";
import { ScenarioDirector } from "../../server/scenario-director";
import { scenarioState } from "../scenario-state";
import { approach } from "../town-space";
import { choicesFor } from "../scenarios";
import type { ScenarioId } from "../scenarios";
import type { TownState, ToolEnvelope } from "../types";

const suffix = randomUUID().replaceAll("-", "").slice(0, 20);
const template = `test_scenarios_${suffix}`;
const players: string[] = [];
let db: Database, director: ScenarioDirector;
const data = <T>(result: ToolEnvelope<T>): T => { if (!result.ok) throw new Error(result.error.message); return result.data; };
function player(id: ScenarioId) {
  const value = `quest_${id}_${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  players.push(value); return value;
}
async function choose(town: TownState, id: string) {
  const state = scenarioState(town);
  if (!state || !town.playerId) throw new Error("Missing scenario");
  const choice = choicesFor(state.id, town.npcs).find((item) => item.id === id);
  if (!choice) throw new Error("Missing choice");
  return data(await director.execute({ playerId: town.playerId, action: "choose", choiceId: id, position: approach(choice.npc) }));
}
beforeAll(async () => {
  const connected = await connectDatabase(); if (!connected.ok) throw new Error(connected.error.message);
  db = connected.data;
  director = new ScenarioDirector(createHearsay(db, { templateGraph: template, seedPath: resolve(process.cwd(), "../../seed/hollowbrook-expanded.json") }));
}, 30000);
afterAll(async () => {
  if (!db) return;
  try {
    const listed = await db.list(); if (!listed.ok) throw new Error(listed.error.message);
    for (const name of [template, ...players.map((id) => `player:${id}`)]) if (listed.data.includes(name)) expect((await db.delete(name)).ok).toBe(true);
  } finally { await db.close(); }
});

it("wins medicine through paid and charity routes using real memories and a final gossip round", async () => {
  for (const route of [["med-work", "med-buy", "med-deliver"], ["med-clinic", "med-charity", "med-deliver"]]) {
    const playerId = player("medicine"); let town = data(await director.execute({ playerId, action: "inspect" }));
    for (const id of route) town = await choose(town, id);
    expect(scenarioState(town)?.stage).toBe("playing");
    town = data(await director.execute({ playerId, action: "verdict" }));
    expect(town.tick).toBe(6); expect(scenarioState(town)?.stage).toBe("won");
    expect(scenarioState(data(await director.execute({ playerId, action: "inspect" })))?.stage).toBe("won");
  }
}, 30000);

it("requires real repair knowledge and friendly attitudes on both sides of the feud", async () => {
  const playerId = player("feud"); let town = data(await director.execute({ playerId, action: "inspect" }));
  town = await choose(town, "feud-bridge");
  expect(scenarioState(town)?.goals[1].complete).toBe(false);
  town = await choose(town, "feud-supplies"); town = await choose(town, "feud-mediate");
  town = data(await director.execute({ playerId, action: "verdict" }));
  expect(scenarioState(town)?.stage).toBe("won");
}, 30000);

it("completes the watch with tools, a graph-backed briefing and the guard’s warning", async () => {
  const playerId = player("watch"); let town = data(await director.execute({ playerId, action: "inspect" }));
  for (const id of ["watch-survey", "help-brom", "watch-borrow", "watch-brief", "watch-repair", "watch-warn"]) town = await choose(town, id);
  town = data(await director.execute({ playerId, action: "verdict" }));
  expect(scenarioState(town)?.stage).toBe("won");
  expect(scenarioState(town)?.trust).toBeGreaterThanOrEqual(60);
}, 30000);

it("rejects remote and premature actions, serializes duplicate clicks, and isolates saves", async () => {
  const playerId = player("medicine"); const fresh = data(await director.execute({ playerId, action: "inspect" }));
  for (const command of [
    { choiceId: "med-deliver", position: approach("lysa") },
    { choiceId: "med-work", position: approach("garrick") },
    { choiceId: "med-charity", position: approach("ayla") },
  ]) expect((await director.execute({ playerId, action: "choose", ...command })).ok).toBe(false);
  expect(fresh.tick).toBe(0);
  const duplicates = await Promise.all([1, 2].map(() => director.execute({ playerId, action: "choose", choiceId: "med-work", position: approach("brom") })));
  expect(duplicates.filter((result) => result.ok)).toHaveLength(1);
  const town = data(await director.execute({ playerId, action: "inspect" }));
  expect(town.tick).toBe(1); expect(town.events).toHaveLength(1);
  expect(data(await director.execute({ playerId: player("medicine"), action: "inspect" })).events).toEqual([]);
}, 30000);

it("loses immediately when trust collapses and cannot recover a finished game", async () => {
  const playerId = player("medicine"); let town = data(await director.execute({ playerId, action: "inspect" }));
  town = await choose(town, "threaten-guard");
  expect(scenarioState(town)?.stage).toBe("lost"); expect(scenarioState(town)?.trust).toBeLessThanOrEqual(20);
  expect((await director.execute({ playerId, action: "choose", choiceId: "help-garrick", position: approach("garrick") })).ok).toBe(false);
  expect(scenarioState(data(await director.execute({ playerId, action: "inspect" })))?.stage).toBe("lost");
});

it("ends an unfinished scenario at its deadline", async () => {
  const playerId = player("medicine");
  const town = data(await director.execute({ playerId, action: "verdict" }));
  expect(scenarioState(town)?.stage).toBe("lost"); expect(scenarioState(town)?.remaining).toBe(0);
  expect((await director.execute({ playerId, action: "wait" })).ok).toBe(false);
});
