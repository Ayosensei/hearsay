import type { Database } from "@hearsay/core";
import type { HearsayClient } from "@hearsay/contract";
import { LiveTownClient } from "../lib/live-town";
import { crossingBlocked, crossingChoices, CROSSING_TURN_MS } from "../lib/crossing";
import { pointsLeft } from "../lib/puzzle";
import { observeAt, SIGHT_RADIUS } from "../lib/town-space";
import { homes, placeFor } from "../lib/town-residents";
import { CrossingStore } from "./crossing-store";
import { finishCrossing, storyLine, storyReaction } from "./crossing-story";
import type { PuzzleCommand } from "./puzzle-director";
import type { CrossingSave } from "../lib/crossing";
import type { TownState, ToolEnvelope, TraceStep } from "../lib/types";

export class CrossingDirector {
  private readonly queues = new Map<string, Promise<ToolEnvelope<TownState>>>();
  constructor(private readonly tools: HearsayClient, private readonly db: Database, private readonly now = Date.now) {}
  execute(command: PuzzleCommand) {
    const previous = this.queues.get(command.playerId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(() => this.run(command));
    this.queues.set(command.playerId, next);
    void next.finally(() => { if (this.queues.get(command.playerId) === next) this.queues.delete(command.playerId); });
    return next;
  }
  private async run(command: PuzzleCommand): Promise<ToolEnvelope<TownState>> {
    const traces: TraceStep[] = [], playerId = command.playerId;
    const unwrap = <T>(result: ToolEnvelope<T>): T => { traces.push(...(result.trace ?? [])); if (!result.ok) throw new Error(result.error.message); return result.data; };
    try {
      if (!/^puzzle_crossing_[a-z0-9]{20}$/.test(playerId)) throw new Error("Unknown crossing save.");
      const adapter = new LiveTownClient(this.tools);
      let town = unwrap(await adapter.getTownState(playerId));
      const store = new CrossingStore(this.db, playerId, traces), save = await store.init(this.now());
      if (!save.flags.includes("seeded")) {
        await store.claim("payment", "elin", "Elin saw Rowan hand the bridge toll to Garrick, not Marta.", 0, "", true);
        await store.claim("ledger", "garrick", "Garrick's ledger records the toll; the money was never sent to Marta.", 0, "payment", true);
        save.flags.push("seeded"); await store.save(save);
      }
      const mark = (flag: string) => { if (!save.flags.includes(flag)) save.flags.push(flag); };
      const say = (npc: string, text: string) => storyLine(save, npc, text, town.tick);
      const advance = async () => {
        town = unwrap(await adapter.advanceTime(town)); save.spreadCount = (town.gossipSteps?.length ?? 0) + await store.spread(town.tick);
        await storyReaction(save, town, store); finishCrossing(save, town); await store.save(save);
      };
      // Elapsed time is checked on every request, so reloads and hidden tabs cannot reset dusk.
      const due = Math.min(6, Math.floor((this.now() - (save.deadlineAt - 6 * CROSSING_TURN_MS)) / CROSSING_TURN_MS));
      while (!save.ending && town.tick < due) await advance();
      if (command.action !== "inspect" && !save.ending) {
        if (["wait", "verdict"].includes(command.action)) {
          do { await advance(); } while (command.action === "verdict" && !save.ending);
        } else if (command.action === "choose") {
          const choice = crossingChoices.find((c) => c.id === command.choiceId);
          if (!choice) throw new Error("Choose one of this story's replies.");
          const home = homes[choice.npc], p = command.position;
          if (!p || p.district !== home.district || Math.hypot(home.x - p.x, home.y - p.y) > SIGHT_RADIUS) throw new Error("Walk closer before speaking.");
          if (pointsLeft(town) === 0) throw new Error("End the turn before another action.");
          const id = choice.id.slice(6), blocked = crossingBlocked(save.flags, id, town.tick);
          if (blocked) throw new Error(blocked);
          let refused = false;
          if (id === "witness" && (town.npcs.find((n) => n.id === "elin")?.attitudeScore ?? 0) < .2) {
            say("elin", "I saw something, but I won't put my family at risk for a stranger. Help me first."); refused = true;
          }
          const nearby = observeAt(p, town);
          town = unwrap(await adapter.recordEvent({ playerId, placeId: nearby.place?.id ?? placeFor[choice.npc], witnesses: nearby.witnesses.map((n) => n.id), type: refused ? "traded" : choice.type, subject: refused ? `Refused|${choice.id}|${town.tick}` : choice.subject, weight: refused || choice.type === "traded" ? 0 : undefined }, town));
          if (!refused) {
            mark(id);
            save.lines.push({ id: `${town.tick}-${save.lines.length}`, npc: "player", to: choice.npc, text: choice.label.replaceAll("“", "").replaceAll("”", ""), tick: town.tick });
            await this.resolve(id, save, town, store);
          }
          await storyReaction(save, town, store);
          finishCrossing(save, town, id === "escort" && !refused);
          await store.save(save);
          if (!save.ending && pointsLeft(town) === 0) await advance();
        } else throw new Error("Use the conversation replies in this story.");
      }
      await store.save(save);
      const claims = await store.claims(), ended = Boolean(save.ending);
      const state = { id: "crossing" as const, stage: ended ? save.won ? "won" as const : "lost" as const : "playing" as const, title: "Family Feud · Before Dusk", remaining: Math.max(0, 6 - town.tick), reason: save.ending ?? "Get Lysa to the chapel. The town will keep talking while you decide.", goals: [{ text: "Get Lysa safely across before dusk", complete: ended ? Boolean(save.won) : undefined }] };
      const result: TownState = { ...town, events: town.events.filter((e) => !e.subject?.startsWith("Refused|")),
        puzzle: { ap: pointsLeft(town), maxAp: 2, fog: !ended, state, clues: [], crossing: { spreadCount: save.spreadCount, deadlineAt: save.deadlineAt, serverNow: this.now(), flags: save.flags.filter((f) => f !== "seeded"), lines: save.lines, ending: save.ending, claims: ended ? claims : undefined } },
        npcs: ended ? town.npcs : town.npcs.map((n) => ({ ...n, knowledgeHidden: true, attitudeScore: 0, contributions: [], rumors: [], primaryRumor: undefined, knowledgeState: "none" })),
        graphNodes: ended ? town.graphNodes : town.graphNodes.filter((n) => n.type === "npc"), graphEdges: ended ? town.graphEdges : town.graphEdges.filter((e) => e.type === "TRUSTS"),
        recentTraces: ended ? traces.slice(-250) : [], gossipSteps: [], activePathEdgeIds: [], activeProvenance: undefined };
      return { ok: true, data: result, trace: ended ? traces : [] };
    } catch (error) { return { ok: false, error: { code: "BAD_ARGS", message: error instanceof Error ? error.message : "Could not resolve the crossing. Check the saved story." }, trace: [] }; }
  }
  private async resolve(id: string, save: CrossingSave, town: TownState, store: CrossingStore) {
    const say = (npc: string, text: string) => storyLine(save, npc, text, town.tick);
    const mark = (flag: string) => { if (!save.flags.includes(flag)) save.flags.push(flag); };
    const replies: Record<string, [string, string]> = {
      promise: ["rowan", "Thank you. Marta says I still owe the bridge toll. I paid it. That's all anyone needs to know."],
      press: ["rowan", "All right. I didn't pay Marta directly. Garrick took it at the guard post. I didn't want Elin dragged into this."],
      defend: ["rowan", "Then say it where people can hear. But Marta won't take kindly to being called a liar."],
      support: ["elin", "You helped when everyone else was shouting. Ask me about the payment. I'll tell you what I saw."],
      terms: ["marta", "Your travel purse buys one passage. No public insults, no secret crossing. Decide whose money you want to lose."],
      "mediate-first": ["elin", "I'll record both accounts. Rowan must say who received his money, and Marta must state her terms. Then come back before you settle the toll."],
      "mediation-note": ["elin", "Rowan claims payment to Garrick. Marta confirms she did not receive it. Both can be telling the truth. You can pay for passage now, or pursue the ledger."],
      pay: ["marta", "Your purse is mine. The barrier is open for Lysa. The debt between Rowan and me remains."],
      quiet: ["marta", "Keep Garrick's ledger between us. I open the bridge; you bury the scandal. Take her now."],
      expose: ["marta", "Garrick kept my money? I'll verify this publicly. Give me one turn, then bring Lysa."],
      planks: ["oren", "I'll lash a crossing by the docks. One turn to make it safe. You've chosen this route now; Marta won't sell you passage."],
      launch: ["silas", "The lines are sound. Bring Lysa. Do it before the fifth bell."],
    };
    if (replies[id]) say(...replies[id]);
    if (id === "witness" || id === "receipt") {
      const memories = await store.claims(), fact = memories.find((c) => c.id === (id === "witness" ? "payment" : "ledger") && c.npc === (id === "witness" ? "elin" : "garrick"));
      if (!fact) throw new Error("The witness's evidence is unavailable.");
      say(fact.npc, fact.text);
    }
    if (id === "pay" || id === "quiet") mark("bridge-open");
    if (id === "launch") mark("secret-open");
    if (id === "planks") await store.claim("secret-crossing", "oren", "The traveller and Oren are building a crossing to help Lysa.", town.tick);
    if (id.startsWith("question-")) {
      const npc = id.slice(9), memory = (await store.claims()).filter((c) => c.npc === npc && !c.private).sort((a, b) => b.tick - a.tick)[0];
      const source = memory && (memory.via === "witness" ? "This is my account" : `I heard it from ${town.npcs.find((n) => n.id === memory.via)?.name ?? memory.via}`);
      say(npc, memory ? `${source}: “${memory.text}” (${Math.round(memory.confidence * 100)}% sure.)` : "I haven't heard a public account of the crossing yet. Ask me about my part in it.");
    }
  }
}
