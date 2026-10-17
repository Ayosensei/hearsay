import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Envelope } from "@hearsay/contract";
import { connectDatabase } from "./db";
import type { Database, Row } from "./db";
import * as q from "./queries/spike";
import { npcs, trusts } from "./testing/golden-seed";

function data<T>(result: Envelope<T>): T {
  if (!result.ok)
    throw new Error(`${result.error.code}: ${result.trace[0]?.queryId}`);
  return result.data;
}
interface Candidate extends Row {
  eventId: string;
  teller: string;
  listener: string;
  cred: number;
  root: string;
  hop: number;
}
const graph = `test_spike_${randomUUID().replaceAll("-", "")}`;
const copied = `${graph}_copy`;
let db: Database;
let recorded: Row[];
beforeAll(async () => {
  db = data(await connectDatabase());
  data(await db.run(graph, "QG2_seed_npcs", q.QG2_seed_npcs, { npcs }));
  data(await db.run(graph, "QG2_seed_trust", q.QG2_seed_trust, { trusts }));
  data(await db.run(graph, "QG2_seed_world", q.QG2_seed_world));
  recorded = data(
    await db.run(graph, "Q30_record_event", q.Q30_record_event, {
      pid: "a",
      place: "forge",
      eid: "ev_spike",
      type: "stole",
      weight: -0.8,
      tick: 0,
      at: "2026-10-17T00:00:00Z",
      subject: "iron sword",
      witnesses: ["brom"],
    }),
  );
});
afterAll(async () => {
  if (db) {
    const existing = data(await db.list());
    for (const name of [graph, copied])
      if (existing.includes(name)) data(await db.delete(name));
    data(await db.close());
  }
});

describe("planned Cypher on the live locked seed", () => {
  it("Q30 supports UNWIND after WITH and binds witness lists", async () => {
    expect(recorded).toEqual([{ witness: "brom" }]);
    expect(
      data(
        await db.ro(graph, "QG2_read_knows", q.QG2_read_knows, {
          eid: "ev_spike",
        }),
      ),
    ).toEqual([{ npc: "brom", confidence: 1, via: "witness", hop: 0 }]);
  });

  it("Q40/Q41 match the golden rounds and Q61 returns only the event's telling chain", async () => {
    const oneHop = data(
      await db.ro(
        graph,
        "Q40b_gossip_candidates_one",
        q.Q40b_gossip_candidates_one,
        {
          minWeight: 0.3,
          minCred: 0.25,
          eid: "ev_spike",
          maxHops: 1,
        },
      ),
    );
    expect(oneHop.map((r) => r.listener).sort()).toEqual(["ayla", "mira"]);
    expect(
      data(
        await db.ro(
          graph,
          "Q40b_gossip_candidates_one",
          q.Q40b_gossip_candidates_one,
          {
            minWeight: 0.3,
            minCred: 0.25,
            eid: "ev_other",
            maxHops: 1,
          },
        ),
      ),
    ).toEqual([]);
    expect(
      data(
        await db.ro(graph, "Q61_explain_chain", q.Q61_explain_chain, {
          root: "brom",
          nid: "tilda",
          eid: "ev_spike",
        }),
      ),
    ).toEqual([]);
    const golden = [
      [
        { listener: "ayla", teller: "brom", cred: 0.5 },
        { listener: "mira", teller: "brom", cred: 0.9 },
      ],
      [
        { listener: "fenn", teller: "mira", cred: 0.72 },
        { listener: "garrick", teller: "mira", cred: 0.63 },
      ],
      [{ listener: "tilda", teller: "fenn", cred: 0.36 }],
      [],
    ];
    for (let tick = 1; tick <= golden.length; tick++) {
      const candidates = data(
        await db.ro<Candidate>(
          graph,
          "Q40_gossip_candidates_all",
          q.Q40_gossip_candidates_all,
          {
            minWeight: 0.3,
            minCred: 0.25,
          },
        ),
      );
      // Spike harness only: the production selection function belongs to G5.
      const picks = [
        ...new Map(
          candidates
            .sort((a, b) => a.cred - b.cred || b.teller.localeCompare(a.teller))
            .map((c) => [`${c.eventId}:${c.listener}`, c]),
        ).values(),
      ].sort((a, b) => a.listener.localeCompare(b.listener));
      expect(picks).toHaveLength(golden[tick - 1]?.length ?? 0);
      for (const [index, pick] of picks.entries()) {
        const expected = golden[tick - 1]?.[index];
        expect(pick.listener).toBe(expected?.listener);
        expect(pick.teller).toBe(expected?.teller);
        expect(pick.cred).toBeCloseTo(expected?.cred ?? 0, 9);
      }
      const rows = picks.map(
        ({ eventId, teller, listener, cred, root, hop }) => ({
          eventId,
          teller,
          listener,
          cred,
          root,
          hop,
        }),
      );
      expect(
        data(
          await db.run(graph, "Q41_gossip_write", q.Q41_gossip_write, {
            rows,
            tick,
          }),
        ),
      ).toEqual(rows);
    }
    const path = data(
      await db.ro(graph, "Q61_explain_chain", q.Q61_explain_chain, {
        root: "brom",
        nid: "garrick",
        eid: "ev_spike",
      }),
    );
    expect(path).toEqual([
      {
        ids: ["brom", "mira", "garrick"],
        names: ["Brom", "Mira", "Garrick"],
        confidences: [0.9, 0.63],
      },
    ]);
    expect(
      data(
        await db.ro(graph, "QG2_read_knows", q.QG2_read_knows, {
          eid: "ev_spike",
        }),
      ),
    ).toHaveLength(6);
    expect(
      data(
        await db.ro(graph, "Q61_explain_chain", q.Q61_explain_chain, {
          root: "brom",
          nid: "garrick",
          eid: "ev_other",
        }),
      ),
    ).toEqual([]);
  });

  it("Q70 PageRank runs through roQuery and ranks all six NPCs", async () => {
    const hubs = data(
      await db.ro(graph, "Q70_gossip_hubs", q.Q70_gossip_hubs, { limit: 6 }),
    );
    expect(hubs).toHaveLength(6);
    expect(new Set(hubs.map((h) => h.npc)).size).toBe(6);
    expect(hubs.map((h) => h.npc)).toEqual([
      "mira",
      "tilda",
      "fenn",
      "garrick",
      "brom",
      "ayla",
    ]);
    console.info("G2 PageRank order:", hubs.map((h) => h.npc).join(", "));
  });

  it("Q90 label predicates exclude metadata and decode entities", async () => {
    const nodes = data(
      await db.ro(graph, "Q90_snapshot_nodes", q.Q90_snapshot_nodes),
    );
    expect(nodes).toHaveLength(9);
    expect(nodes).toContainEqual({
      n: expect.objectContaining({
        labels: ["NPC"],
        properties: expect.objectContaining({ id: "brom" }),
      }),
    });
    const edges = data(
      await db.ro(graph, "Q90_snapshot_edges", q.Q90_snapshot_edges),
    );
    expect(edges).toContainEqual(
      expect.objectContaining({
        fromId: "mira",
        toId: "brom",
        fromLabels: ["NPC"],
        toLabels: ["NPC"],
        r: expect.objectContaining({
          relationshipType: "TRUSTS",
          properties: { weight: 0.9 },
        }),
      }),
    );
  });

  it("range-index DDL works and GRAPH.COPY carries index definitions", async () => {
    for (const [id, query] of [
      ["QG2_index_npc", q.QG2_index_npc],
      ["QG2_index_event", q.QG2_index_event],
      ["QG2_index_player", q.QG2_index_player],
      ["QG2_index_place", q.QG2_index_place],
    ] as const)
      data(await db.run(graph, id, query));
    const indexes = data(await db.ro(graph, "QG2_indexes", q.QG2_indexes));
    expect(indexes).toHaveLength(4);
    data(await db.copy(graph, copied));
    const copyIndexes = data(await db.ro(copied, "QG2_indexes", q.QG2_indexes));
    expect(copyIndexes).toHaveLength(4);
    expect(copyIndexes.map((i) => i.label).sort()).toEqual(
      indexes.map((i) => i.label).sort(),
    );
    expect(
      data(
        await db.ro(copied, "QG2_index_lookup", q.QG2_index_lookup, {
          id: "garrick",
        }),
      ),
    ).toEqual([{ id: "garrick" }]);
    for (const index of copyIndexes) {
      expect(index.properties).toEqual(["id"]);
      expect(index.status).toBe("OPERATIONAL");
      expect(index.entitytype).toBe("NODE");
    }
    console.info(
      "G2 copied index labels:",
      copyIndexes
        .map((index) => index.label)
        .sort()
        .join(", "),
    );
  });
});
