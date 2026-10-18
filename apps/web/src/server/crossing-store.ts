import { feudQueries as q } from "@hearsay/core";
import type { Database, QueryParams, Row } from "@hearsay/core";
import type { ClaimMemory, CrossingSave } from "../lib/crossing";
import type { TraceStep } from "../lib/types";

export class CrossingStore {
  constructor(private readonly db: Database, private readonly playerId: string, private readonly trace: TraceStep[]) {}
  private async query(id: keyof typeof q, params: QueryParams, write = false): Promise<Row[]> {
    const result = await (write ? this.db.run : this.db.ro)(`player:${this.playerId}`, id, q[id], params, { agent: "system", tool: "crossing" });
    this.trace.push(...result.trace);
    if (!result.ok) throw new Error(result.error.code);
    return result.data;
  }
  async init(now: number, seed?: CrossingSave): Promise<CrossingSave> {
    const initial: CrossingSave = seed ?? { version: 1, deadlineAt: now + 360_000, flags: [], lines: [{ id: "opening", npc: "rowan", tick: 0, text: "Marta's barred the bridge. Lysa needs the chapel before dusk. I paid that debt. You have to believe me." }], lastTick: 0 };
    const rows = await this.query("Q110_feud_init", { payload: JSON.stringify(initial) }, true);
    return JSON.parse(String(rows[0].payload)) as CrossingSave;
  }
  async read(): Promise<CrossingSave> {
    const rows = await this.query("Q111_feud_read", {});
    return JSON.parse(String(rows[0].payload)) as CrossingSave;
  }
  async save(state: CrossingSave) { await this.query("Q112_feud_save", { payload: JSON.stringify(state) }, true); }
  async claims(): Promise<ClaimMemory[]> {
    const rows = await this.query("Q113_feud_claims", {});
    return rows.map((r) => ({ id: String(r.id), text: String(r.text), parent: String(r.parent), private: r.private === true, npc: String(r.npc), via: String(r.via), confidence: Number(r.confidence), tick: Number(r.tick) }));
  }
  async claim(id: string, npc: string, text: string, tick: number, parent = "", hidden = false) {
    await this.query("Q114_feud_claim", { id, npc, text, tick, parent, private: hidden }, true);
  }
  async spread(tick: number) {
    const candidates = await this.query("Q115_feud_candidates", { tick });
    const learned = new Set<string>();
    for (const row of candidates) {
      const confidence = Number(row.confidence) * .98;
      if (confidence < .25) continue;
      await this.query("Q116_feud_learn", { npc: String(row.listener), id: String(row.id), via: String(row.teller), confidence, tick }, true);
      learned.add(`${row.listener}:${row.id}`);
    }
    return learned.size;
  }
}
