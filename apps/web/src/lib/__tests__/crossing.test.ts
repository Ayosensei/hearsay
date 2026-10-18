import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { connectDatabase, createHearsay } from "@hearsay/core";
import type { Database } from "@hearsay/core";
import type { HearsayClient } from "@hearsay/contract";
import { CrossingDirector } from "../../server/crossing-director";
import { CrossingStore } from "../../server/crossing-store";
import { approach } from "../town-space";
import type { ToolEnvelope } from "../types";

let db: Database, tools: HearsayClient, director: CrossingDirector;
let now = 1_800_000_000_000;
const template = `cross_test_${randomUUID().replaceAll("-", "").slice(0, 10)}`, players: string[] = [];
const value = <T>(result: ToolEnvelope<T>) => { if (!result.ok) throw new Error(result.error.message); return result.data; };
const player = () => { const id = `puzzle_crossing_${randomUUID().replaceAll("-", "").slice(0, 20)}`; players.push(id); return id; };
const inspect = async (playerId: string) => value(await director.execute({ playerId, action: "inspect" }));
const choose = async (playerId: string, id: string, npc: string) => value(await director.execute({ playerId, action: "choose", choiceId: `cross-${id}`, position: approach(npc) }));
const wait = async (playerId: string) => value(await director.execute({ playerId, action: "wait" }));
beforeAll(async () => {
  const connection = await connectDatabase(); if (!connection.ok) throw new Error(connection.error.message);
  db = connection.data; tools = createHearsay(db, { templateGraph: template, seedPath: resolve(process.cwd(), "../../seed/hollowbrook-expanded.json") });
  director = new CrossingDirector(tools, db, () => now);
}, 30000);
afterAll(async () => { if (!db) return; try { const graphs = value(await db.list()); for (const graph of [template, ...players.map((id) => `player:${id}`)]) if (graphs.includes(graph)) expect((await db.delete(graph)).ok).toBe(true); } finally { await db.close(); } });

it("keeps the hidden toll and claim metadata out of public snapshots and dialogue", async () => {
  const id = player(), town = await inspect(id);
  expect(town.puzzle?.ap).toBe(2); expect(JSON.stringify(town)).not.toContain("never sent to Marta");
  const facts = await new CrossingStore(db, id, []).claims(); expect(facts.some((fact) => fact.id === "ledger" && fact.npc === "garrick")).toBe(true);
  expect((await new CrossingStore(db, id, []).read()).deadlineAt).toBe(town.puzzle?.crossing?.deadlineAt);
  const snapshot = await tools.call("snapshot", { playerId: id }); expect(snapshot.ok).toBe(true);
  if (snapshot.ok) expect(JSON.stringify(snapshot.data)).not.toContain("FeudClaim");
});
it("wins by paying with the debt unresolved and closes the competing secret route", async () => {
  const id = player(); await inspect(id);
  const paid = await choose(id, "pay", "marta"); expect(paid.puzzle?.ap).toBe(1);
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "cross-planks", position: approach("oren") })).ok).toBe(false);
  const won = await choose(id, "escort", "lysa");
  expect(won.puzzle?.state.stage).toBe("won"); expect(won.puzzle?.crossing?.ending).toBe("Your purse, her passage");
  expect((await inspect(id)).puzzle?.crossing?.ending).toBe(won.puzzle?.crossing?.ending);
});
it("makes voluntary mediation reconcile both accounts before a paid crossing", async () => {
  const id = player(); await inspect(id); await choose(id, "mediate-first", "elin");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "cross-pay", position: approach("marta") })).ok).toBe(false);
  await choose(id, "press", "rowan"); await choose(id, "terms", "marta"); await choose(id, "mediation-note", "elin");
  await choose(id, "pay", "marta"); const won = await choose(id, "escort", "lysa");
  expect(won.puzzle?.state.stage).toBe("won"); expect(won.puzzle?.crossing?.flags).toContain("mediation-note");
}, 30000);
it("requires earned trust for Elin, uncovers the ledger and waits for public verification", async () => {
  const id = player(); await inspect(id);
  const refused = await choose(id, "witness", "elin"); expect(refused.puzzle?.ap).toBe(1); expect(refused.puzzle?.crossing?.flags).not.toContain("witness");
  await choose(id, "support", "elin"); await choose(id, "witness", "elin"); await choose(id, "receipt", "garrick");
  const exposed = await choose(id, "expose", "marta"); expect(exposed.puzzle?.crossing?.flags).not.toContain("bridge-open");
  await wait(id); const won = await choose(id, "escort", "lysa");
  expect(won.puzzle?.crossing?.ending).toBe("The debt brought to light"); expect(won.puzzle?.state.stage).toBe("won");
}, 30000);
it("lets a public defence close Marta's deal only after she learns it through gossip", async () => {
  const id = player(); await inspect(id); await choose(id, "defend", "rowan");
  let town = await inspect(id);
  for (let i = 0; i < 4 && !town.puzzle?.crossing?.flags.includes("marta-confronted"); i++) town = await wait(id);
  expect(town.puzzle?.crossing?.flags).toContain("marta-confronted");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "cross-pay", position: approach("marta") })).ok).toBe(false);
});
it("keeps a biased accusation separate from the original and propagates it on real trust links", async () => {
  const id = player(); await inspect(id); await choose(id, "planks", "oren");
  for (let i = 0; i < 4; i++) await wait(id);
  const claims = await new CrossingStore(db, id, []).claims();
  expect(claims.some((c) => c.id === "secret-crossing" && c.text.includes("help Lysa"))).toBe(true);
  expect(claims.some((c) => c.id === "stolen-timber" && c.parent === "secret-crossing")).toBe(true);
  expect(claims.some((c) => c.id === "stolen-timber" && c.via !== "witness")).toBe(true);
  await choose(id, "launch", "silas"); const won = await choose(id, "escort", "lysa");
  expect(won.puzzle?.crossing?.ending).toBe("Across, with a price");
}, 30000);
it("uses the stored dusk deadline across director restarts and can lose with evidence found", async () => {
  const id = player(); const start = await inspect(id);
  await choose(id, "press", "rowan"); await choose(id, "receipt", "garrick");
  const deadline = start.puzzle?.crossing?.deadlineAt; if (!deadline) throw new Error("Missing deadline");
  now = deadline + 1;
  director = new CrossingDirector(tools, db, () => now);
  const lost = await inspect(id);
  expect(lost.tick).toBe(6); expect(lost.puzzle?.crossing?.ending).toBe("The truth arrived too late");
  expect(lost.puzzle?.state.stage).toBe("lost"); expect(lost.puzzle?.crossing?.claims?.length).toBeGreaterThan(0);
}, 30000);

it("offers a distinct private-bargain ending without waiting for public verification", async () => {
  const id = player(); await inspect(id); await choose(id, "press", "rowan"); await choose(id, "receipt", "garrick");
  const deal = await choose(id, "quiet", "marta"); expect(deal.puzzle?.crossing?.flags).toContain("bridge-open");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "cross-expose", position: approach("marta") })).ok).toBe(false);
  const ending = await choose(id, "escort", "lysa");
  expect(ending.puzzle?.state.stage).toBe("won"); expect(ending.puzzle?.crossing?.ending).toBe("A life saved, a truth buried");
});
