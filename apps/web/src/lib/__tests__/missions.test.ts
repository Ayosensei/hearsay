import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { connectDatabase, createHearsay } from "@hearsay/core";
import type { Database } from "@hearsay/core";
import type { HearsayClient } from "@hearsay/contract";
import { MissionDirector } from "../../server/mission-director";
import { CrossingStore } from "../../server/crossing-store";
import { LiveTownClient } from "../live-town";
import { approach } from "../town-space";
import type { MissionId, MissionSave } from "../missions";
import type { ToolEnvelope } from "../types";

vi.setConfig({ testTimeout: 30_000 });
let db: Database, tools: HearsayClient, director: MissionDirector, adapter: LiveTownClient;
let now = 1_800_000_000_000;
const template = `missions_test_${randomUUID().replaceAll("-", "").slice(0, 10)}`, players: string[] = [];
const value = <T>(r: ToolEnvelope<T>): T => { if (!r.ok) throw new Error(r.error.message); return r.data; };
const start = async (mission: MissionId) => { const id = `story_${mission}_${randomUUID().replaceAll("-", "").slice(0, 20)}`; players.push(id); value(await director.execute({ playerId: id, action: "inspect" })); return id; };
const inspect = async (playerId: string) => value(await director.execute({ playerId, action: "inspect" }));
const choose = async (playerId: string, key: string, npc: string) => value(await director.execute({ playerId, action: "choose", choiceId: `story-${key}`, position: approach(npc) }));
const wait = async (playerId: string) => value(await director.execute({ playerId, action: "wait" }));
beforeAll(async () => {
  const connection = await connectDatabase(); if (!connection.ok) throw new Error(connection.error.message);
  db = connection.data; tools = createHearsay(db, { templateGraph: template, seedPath: resolve(process.cwd(), "../../seed/hollowbrook-expanded.json") });
  director = new MissionDirector(tools, db, () => now); adapter = new LiveTownClient(tools);
}, 30000);
afterAll(async () => { if (!db) return; try { const graphs = value(await db.list()); for (const graph of [template, ...players.map((id) => `player:${id}`)]) if (graphs.includes(graph)) expect((await db.delete(graph)).ok).toBe(true); } finally { await db.close(); } });

it("finishes a clean medicine purchase with a concrete treatment and settlement", async () => {
  const id = await start("medicine"); await choose(id, "wages", "brom");
  expect((await inspect(id)).puzzle?.ap).toBe(1);
  await choose(id, "buy", "marta"); await choose(id, "deliver", "lysa");
  const town = await choose(id, "close", "garrick"); expect(town.puzzle?.state.stage).toBe("won"); expect(town.puzzle?.story?.ending).toContain("no stolen cure");
  expect((await inspect(id)).puzzle?.story?.ending).toBe(town.puzzle?.story?.ending);
});
it("distinguishes borrowing another patient's dose from replacing it", async () => {
  const first = await start("medicine"); await choose(first, "clinic", "ayla"); await choose(first, "borrow-dose", "ayla"); await choose(first, "deliver", "lysa");
  expect((await choose(first, "close", "garrick")).puzzle?.story?.ending).toBe("A cure borrowed from another bed");
  const second = await start("medicine"); await choose(second, "clinic", "ayla"); await choose(second, "borrow-dose", "ayla"); await choose(second, "deliver", "lysa"); await choose(second, "gather", "silas"); await choose(second, "brew", "ayla");
  expect((await choose(second, "close", "garrick")).puzzle?.story?.ending).toBe("Two patients, no stolen cure");
});
it("closes competing medicine routes and rejects a theft settlement without restitution", async () => {
  const id = await start("medicine"); await choose(id, "steal-dose", "marta");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-buy", position: approach("marta") })).ok).toBe(false);
  await choose(id, "deliver", "lysa");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-close", position: approach("garrick") })).ok).toBe(false);
});
it("allows emergency medicine with an explicit public debt", async () => {
  const id = await start("medicine"); await choose(id, "examine", "elin"); await choose(id, "permit", "garrick"); await choose(id, "release", "marta"); await choose(id, "deliver", "lysa");
  expect((await choose(id, "close", "garrick")).puzzle?.story?.ending).toBe("The town carries the bill");
});
it("requires a real trust gate, a settling turn and returned tools for a floodgate repair", async () => {
  const id = await start("watch"); await choose(id, "survey", "silas"); const refused = await choose(id, "tools", "brom"); expect(refused.puzzle?.ap).toBe(2); expect(refused.puzzle?.story?.flags).not.toContain("tools");
  await choose(id, "tool-work", "brom"); await choose(id, "tools", "brom"); await choose(id, "brief", "oren"); await wait(id); await choose(id, "brace", "silas");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-seal", position: approach("silas") })).ok).toBe(false);
  await wait(id); await choose(id, "seal", "silas"); await choose(id, "return-tools", "brom");
  expect((await choose(id, "report", "garrick")).puzzle?.state.stage).toBe("won");
}, 30000);
it("offers flood diversion and evacuation as different successful sacrifices", async () => {
  const first = await start("watch"); await choose(first, "survey", "silas"); await choose(first, "divert", "silas"); await choose(first, "warn-market", "marta");
  expect((await choose(first, "report", "garrick")).puzzle?.story?.ending).toBe("Dry homes, drowned market");
  const second = await start("watch"); await choose(second, "evacuate", "ayla"); await choose(second, "boats", "silas");
  expect((await choose(second, "report", "garrick")).puzzle?.story?.ending).toBe("Homes lost, lives saved");
});
it("resolves a sword theft through confession and documented restitution", async () => {
  const id = await start("coverup"); await choose(id, "return-sword", "brom"); await choose(id, "repair-rack", "brom"); await choose(id, "confess", "garrick"); await choose(id, "confirm", "brom");
  expect((await choose(id, "service", "garrick")).puzzle?.story?.ending).toBe("Accountable, but free");
});
it("requires a fabricated alibi to actually reach the guard before it can close a case", async () => {
  const id = await start("coverup"); await choose(id, "alibi", "mira");
  const refused = await choose(id, "inspection", "garrick"); expect(refused.puzzle?.state.stage).toBe("playing"); expect(refused.puzzle?.story?.flags).not.toContain("inspection");
  const town = await choose(id, "inspection", "garrick"); expect(town.puzzle?.story?.ending).toBe("An alibi held together by silence");
  expect(town.puzzle?.story?.claims?.some((c) => c.id === "inn-alibi" && c.npc === "garrick" && c.via === "mira")).toBe(true);
});
it("lets the guard's graph-backed summons expire before the inspector arrives", async () => {
  const id = await start("coverup"); let town = await inspect(id);
  for (let i = 0; i < 5 && town.puzzle?.state.stage === "playing"; i++) town = await wait(id);
  expect(town.tick).toBe(5); expect(town.puzzle?.story?.ending).toBe("The guard's summons expired"); expect(town.puzzle?.state.stage).toBe("lost");
});
it("earns devotion by an admitted and fulfilled promise rather than a gift alone", async () => {
  const id = await start("redemption"); await choose(id, "admit", "ayla"); await choose(id, "vigil", "ayla"); await choose(id, "ledger", "elin"); await choose(id, "recover", "julian"); await choose(id, "return-fund", "ayla");
  const won = await choose(id, "blessing", "ayla"); expect(won.puzzle?.story?.ending).toBe("The promise returned whole"); expect(won.npcs.find((n) => n.id === "ayla")?.attitude).toBe("devoted");
});
it("prevents reputation farming and exclusive redemption performances", async () => {
  const id = await start("redemption"); await choose(id, "public-gift", "mira"); await choose(id, "admit", "ayla");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-quiet-service", position: approach("ayla") })).ok).toBe(false);
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-public-gift", position: approach("mira") })).ok).toBe(false);
  expect((await inspect(id)).puzzle?.state.stage).toBe("playing");
});
it("requires three actual signatures before a shared winter pact", async () => {
  const id = await start("alliance"); await choose(id, "relief", "rowan"); await choose(id, "watch-fund", "garrick"); await choose(id, "charter", "tilda"); await choose(id, "shared-store", "marta");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-ratify", position: approach("tilda") })).ok).toBe(false);
  await choose(id, "sign-rowan", "rowan"); await choose(id, "sign-garrick", "garrick"); await choose(id, "sign-marta", "marta");
  expect((await choose(id, "ratify", "tilda")).puzzle?.story?.ending).toBe("A common winter table");
});
it("makes a merchant monopoly require a household exemption and creates a different pact", async () => {
  const id = await start("alliance"); await choose(id, "monopoly", "marta"); await choose(id, "watch-fund", "garrick");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-relief", position: approach("rowan") })).ok).toBe(false);
  await choose(id, "exemption", "rowan"); await choose(id, "sign-rowan", "rowan"); await choose(id, "sign-garrick", "garrick"); await choose(id, "sign-marta", "marta");
  expect((await choose(id, "ratify", "tilda")).puzzle?.story?.ending).toBe("Winter under guild terms");
});
it("keeps detective identities private, records a false firsthand claim, and grades four fields against graph evidence", async () => {
  const id = await start("detective"); const hidden = await inspect(id);
  expect(hidden.puzzle?.detective?.maxScore).toBe(4); expect(hidden.puzzle?.detective?.truth).toBeUndefined(); expect(hidden.events.every((e) => e.witnessId === "")).toBe(true);
  const save = await new CrossingStore(db, id, []).read() as MissionSave; if (!save.liarId || !save.caseEventId) throw new Error("Missing case identities");
  const lied = value(await director.execute({ playerId: id, action: "ask", npcId: save.liarId, position: approach(save.liarId) }));
  expect(lied.puzzle?.clues[0].source).toBe("witness"); await choose(id, "register", "fenn");
  await choose(id, "bell-log", "ayla"); await choose(id, "copy-check", "tilda"); await choose(id, "verify-register", "fenn");
  const raw = value(await adapter.getTownState(id)), event = raw.events.find((e) => e.id === save.caseEventId); if (!event) throw new Error("Missing original event");
  const path = value(await tools.call("explain", { playerId: id, npcId: "garrick", eventId: event.id }));
  const answer = { witnessId: event.witnessId, route: path.chain.map((hop) => hop.npcId), account: path.status === "not_in_graph" ? "unaware" as const : path.chain.length === 1 ? "eyewitness" as const : "secondhand" as const, liarId: save.liarId };
  const won = value(await director.execute({ playerId: id, action: "accuse", answer }));
  expect(won.puzzle?.detective?.score).toBe(4); expect(won.puzzle?.detective?.truth).toEqual(answer); expect(won.puzzle?.state.stage).toBe("won");
  expect(won.puzzle?.story?.claims?.some((c) => c.id === "alibi" && c.private)).toBe(true);
}, 30000);
it("lets a reasonable pressure survey take longer and still produce a usable repair survey", async () => {
  const id = await start("watch"); const first = await choose(id, "waterline", "silas");
  expect(first.puzzle?.ap).toBe(1); expect(first.puzzle?.story?.flags).not.toContain("survey");
  const corrected = await choose(id, "compare-level", "oren");
  expect(corrected.puzzle?.story?.flags).toContain("survey"); expect(corrected.tick).toBe(1);
  expect(corrected.puzzle?.story?.lines.some((line) => line.text.includes("old mark exaggerated"))).toBe(true);
});
it("turns a cautious medicine reservation into a resolvable extra obligation", async () => {
  const id = await start("medicine"); await choose(id, "reserve-dose", "marta"); await choose(id, "wages", "brom");
  const blocked = await director.execute({ playerId: id, action: "choose", choiceId: "story-buy", position: approach("marta") });
  expect(blocked.ok).toBe(false); if (!blocked.ok) expect(blocked.error.message).toContain("reservation");
  await choose(id, "patient-list", "elin"); await choose(id, "release-reservation", "marta"); await choose(id, "buy", "marta"); await choose(id, "deliver", "lysa");
  expect((await choose(id, "close", "garrick")).puzzle?.state.stage).toBe("won");
});
it("requires a public return account to be corrected without treating the return itself as a lie", async () => {
  const id = await start("coverup"); const returned = await choose(id, "public-inventory", "brom");
  expect(returned.puzzle?.story?.flags).toContain("return-sword");
  await choose(id, "repair-rack", "brom"); await choose(id, "confess", "garrick"); await choose(id, "confirm", "brom");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-service", position: approach("garrick") })).ok).toBe(false);
  await choose(id, "check-notice", "mira"); await choose(id, "correct-inventory", "garrick");
  const won = await choose(id, "service", "garrick"); expect(won.puzzle?.state.stage).toBe("won");
  expect(won.puzzle?.story?.claims?.some((claim) => claim.parent === "inventory-account")).toBe(true);
});
it("lets careful purse auditing take a longer truthful redemption route", async () => {
  const id = await start("redemption"); await choose(id, "admit", "ayla"); await choose(id, "vigil", "ayla"); await choose(id, "ledger", "elin"); await choose(id, "audit-purse", "julian");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-return-fund", position: approach("ayla") })).ok).toBe(false);
  await choose(id, "packing-record", "fenn"); await choose(id, "verify-purse", "elin"); await choose(id, "return-fund", "ayla");
  expect((await choose(id, "blessing", "ayla")).puzzle?.state.stage).toBe("won");
});
it("makes two well-meant grain priorities require a reconciled public pact", async () => {
  const id = await start("alliance"); await choose(id, "relief", "rowan"); await choose(id, "watch-fund", "garrick"); await choose(id, "charter", "tilda"); await choose(id, "shared-store", "marta");
  await choose(id, "priority-home", "rowan"); await choose(id, "priority-guild", "marta"); await choose(id, "sign-rowan", "rowan"); await choose(id, "sign-garrick", "garrick"); await choose(id, "sign-marta", "marta");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-ratify", position: approach("tilda") })).ok).toBe(false);
  await choose(id, "compare-terms", "tilda"); await choose(id, "home-ration", "rowan"); await choose(id, "publish-terms", "marta");
  const won = await choose(id, "ratify", "tilda"); expect(won.puzzle?.state.stage).toBe("won");
  expect(won.puzzle?.story?.claims?.some((claim) => claim.parent === "guild-priority")).toBe(true);
});
it("requires delegated chapel volunteers to be confirmed before devotion can close the mission", async () => {
  const id = await start("redemption"); await choose(id, "admit", "ayla"); await choose(id, "delegate-vigil", "ayla"); await choose(id, "ledger", "elin"); await choose(id, "recover", "julian"); await choose(id, "return-fund", "ayla");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-blessing", position: approach("ayla") })).ok).toBe(false);
  await choose(id, "find-volunteers", "mira"); await choose(id, "confirm-rota", "rowan");
  expect((await choose(id, "blessing", "ayla")).puzzle?.state.stage).toBe("won");
});
it("requires real collateral for a bonded watch rather than accepting its promise as funding", async () => {
  const id = await start("alliance"); await choose(id, "relief", "rowan"); await choose(id, "bonded-watch", "garrick"); await choose(id, "charter", "tilda"); await choose(id, "shared-store", "marta");
  expect((await director.execute({ playerId: id, action: "choose", choiceId: "story-sign-garrick", position: approach("garrick") })).ok).toBe(false);
  await choose(id, "authorise-bond", "tilda"); await choose(id, "bond-receipt", "fenn"); await choose(id, "sign-garrick", "garrick"); await choose(id, "sign-rowan", "rowan"); await choose(id, "sign-marta", "marta");
  expect((await choose(id, "ratify", "tilda")).puzzle?.state.stage).toBe("won");
});
it("requires corroboration and a filed correction after publicising overlapping detective accounts", async () => {
  const id = await start("detective"), answer = { witnessId: "brom", liarId: "mira", route: [], account: "unaware" as const };
  const blocked = await director.execute({ playerId: id, action: "accuse", answer });
  expect(blocked.ok).toBe(false); expect((await inspect(id)).puzzle?.ap).toBe(2);
  await choose(id, "publish-preliminary", "garrick"); await choose(id, "square-account", "mira"); await choose(id, "cart-account", "silas"); await choose(id, "register", "fenn"); await choose(id, "bell-log", "ayla"); await choose(id, "copy-check", "tilda"); await choose(id, "verify-register", "fenn");
  const needsCorrection = await director.execute({ playerId: id, action: "accuse", answer }); expect(needsCorrection.ok).toBe(false);
  if (!needsCorrection.ok) expect(needsCorrection.error.message).toContain("correction");
  await choose(id, "correct-preliminary", "mira"); await choose(id, "attach-records", "tilda");
  const save = await new CrossingStore(db, id, []).read() as MissionSave;
  const raw = value(await adapter.getTownState(id)), event = raw.events.find((item) => item.id === save.caseEventId); if (!event) throw new Error("No case event");
  const path = value(await tools.call("explain", { playerId: id, npcId: "garrick", eventId: event.id }));
  const won = value(await director.execute({ playerId: id, action: "accuse", answer: { witnessId: event.witnessId, liarId: save.liarId, route: path.chain.map((hop) => hop.npcId), account: path.status === "not_in_graph" ? "unaware" : path.chain.length === 1 ? "eyewitness" : "secondhand" } }));
  expect(won.puzzle?.state.stage).toBe("won"); expect(won.puzzle?.detective?.score).toBe(4);
  expect(won.puzzle?.story?.claims?.some((claim) => claim.parent === "preliminary-case")).toBe(true);
});
it("reports actual new gossip handoffs without revealing hidden routes", async () => {
  const id = await start("medicine");
  expect((await wait(id)).puzzle?.story?.spreadCount).toBe(0);
  await choose(id, "wages", "brom");
  const spread = await wait(id);
  expect(spread.puzzle?.story?.spreadCount).toBeGreaterThan(0);
  expect(spread.gossipSteps).toEqual([]);
  expect(spread.npcs.every((npc) => npc.rumors.length === 0)).toBe(true);
  expect((await inspect(id)).puzzle?.story?.spreadCount).toBe(spread.puzzle?.story?.spreadCount);
});
it("persists timed failure across a server restart and keeps independent players isolated", async () => {
  const id = await start("medicine"), other = await start("watch"), town = await inspect(id);
  const deadline = town.puzzle?.story?.deadlineAt; if (!deadline) throw new Error("No stored deadline");
  now = deadline + 1; director = new MissionDirector(tools, db, () => now);
  const expired = await inspect(id); expect(expired.puzzle?.state.stage).toBe("lost"); expect(expired.tick).toBe(6);
  const separate = await inspect(other); expect(separate.puzzle?.state.stage).toBe("playing"); expect(separate.puzzle?.story?.mission).toBe("watch");
});
