import { randomUUID } from "node:crypto";
import { afterAll, expect, it } from "vitest";
import { connectDatabase } from "@hearsay/core";
import { TOOLS } from "@hearsay/contract";
import { POST } from "../../app/api/tool/[name]/route";
import { reconnectHearsay } from "../../server/hearsay";
import { HttpHearsay } from "../http-client";
import { LiveTownClient } from "../live-town";

const playerId = `web_${randomUUID().replaceAll("-", "")}`;
const call = async (name: string, input: unknown) => {
  const response = await POST(new Request("http://localhost/api/tool/" + name, {
    method: "POST", body: JSON.stringify(input),
  }), { params: Promise.resolve({ name }) });
  return { status: response.status, body: await response.json() };
};

afterAll(async () => {
  await reconnectHearsay();
  const connected = await connectDatabase();
  if (!connected.ok) throw new Error("Cleanup needs real FalkorDB.");
  try {
    const listed = await connected.data.list();
    if (listed.ok && listed.data.includes(`player:${playerId}`))
      expect((await connected.data.delete(`player:${playerId}`)).ok).toBe(true);
  } finally { await connected.data.close(); }
});

it("serves the real graph's action, gossip, explain and dialogue through the HTTP handler", async () => {
  expect((await call("newPlayer", { playerId })).body.ok).toBe(true);
  const recorded = (await call("recordEvent", {
    playerId, type: "stole", placeId: "forge", witnesses: ["brom"], subject: "iron sword",
  })).body;
  expect(recorded.ok).toBe(true);
  const { eventId } = TOOLS.recordEvent.output.parse(recorded.data);
  const before = (await call("recall", { playerId, npcId: "garrick" })).body;
  expect(before.data.status).toBe("not_in_graph");
  for (let tick = 1; tick <= 2; tick++) {
    const advanced = (await call("advanceTime", { playerId })).body;
    expect(advanced.ok).toBe(true);
    expect(advanced.data.tick).toBe(tick);
    expect(advanced.trace.some((step: { queryId?: string }) => step.queryId === "Q40_gossip_candidates_all")).toBe(true);
  }
  const explained = (await call("explain", { playerId, npcId: "garrick", eventId })).body;
  const why = TOOLS.explain.output.parse(explained.data);
  expect(why.chain.map((n) => n.npcId)).toEqual(["brom", "mira", "garrick"]);
  expect(why.hopConfidences[1]).toBeCloseTo(0.63);
  const said = (await call("say", { playerId, npcId: "garrick", text: "What have you heard?" })).body;
  expect(TOOLS.say.output.parse(said.data).usedEventIds).toContain(eventId);
  const reset = (await call("resetPlayer", { playerId })).body;
  expect(reset.data.tick).toBe(0);
  expect((await call("recall", { playerId, npcId: "brom" })).body.data.items).toEqual([]);
}, 30000);

it("rejects unknown tools and invalid inputs before any graph operation", async () => {
  for (const [name, input] of [["constructor", {}], ["recordEvent", {}]] as const) {
    const result = await call(name, input);
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe("BAD_ARGS");
    expect(result.body.trace).toEqual([]);
  }
});

it("loads the town adapter from real tool envelopes and preserves exact explanation edge IDs", async () => {
  const transport: typeof fetch = async (input, init) => {
    const url = new URL(String(input), "http://localhost");
    const name = url.pathname.split("/").at(-1) ?? "";
    return POST(new Request(url, init), { params: Promise.resolve({ name }) });
  };
  const client = new LiveTownClient(new HttpHearsay("/api/tool/", transport));
  const loaded = await client.getTownState(playerId);
  if (!loaded.ok) throw new Error(loaded.error.message);
  const recorded = await client.recordEvent({ playerId, type: "stole", placeId: "forge", witnesses: ["brom"], subject: "iron sword" }, loaded.data);
  if (!recorded.ok) throw new Error(recorded.error.message);
  let state = recorded.data;
  for (let tick = 0; tick < 2; tick++) {
    const advanced = await client.advanceTime(state);
    if (!advanced.ok) throw new Error(advanced.error.message);
    state = advanced.data;
  }
  const why = await client.explainProvenance("garrick", state.events[0]?.id ?? "", state);
  if (!why.ok) throw new Error(why.error.message);
  expect(why.data?.hops.map((hop) => hop.confidence)).toEqual([1, 0.9, 0.63]);
  expect(why.data?.edgeIds?.every((id) => state.graphEdges.some((edge) => edge.id === id))).toBe(true);
  expect(state.npcs.find((npc) => npc.id === "garrick")?.attitudeScore).toBeCloseTo(-0.562464);
  expect(state.gossipSteps).toEqual(expect.arrayContaining([
    expect.objectContaining({ tellerId: "mira", listenerId: "garrick", credibility: 0.63 }),
  ]));
  expect(state.npcs.find((npc) => npc.id === "garrick")?.contributions).toEqual(expect.arrayContaining([
    expect.objectContaining({ confidence: 0.63, effect: -0.562464 }),
  ]));
  expect(state.graphNodes.some((node) => node.id === "NPC:brom")).toBe(true);
}, 30000);
