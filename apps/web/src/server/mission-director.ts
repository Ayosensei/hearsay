import { randomInt } from "node:crypto";
import type { Database } from "@hearsay/core";
import type { HearsayClient } from "@hearsay/contract";
import { LiveTownClient } from "../lib/live-town";
import { missions } from "../lib/mission-catalog";
import { missionFromPlayer, missionBlocked } from "../lib/missions";
import type { MissionSave } from "../lib/missions";
import { observeAt, SIGHT_RADIUS } from "../lib/town-space";
import { homes, placeFor } from "../lib/town-residents";
import { CrossingStore } from "./crossing-store";
import { storyLine } from "./crossing-story";
import { addFlag, endMission, missionDeadline, missionReactions, resolveMission, specialBlock } from "./mission-rules";
import type { PuzzleCommand } from "./puzzle-director";
import type { DetectiveAnswer } from "../lib/puzzle";
import type { TownState, ToolEnvelope, TraceStep } from "../lib/types";
import { detectiveSubmissionBlock } from "./complication-reactions";

export class MissionDirector {
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
    const unwrap = <T>(r: ToolEnvelope<T>): T => { traces.push(...(r.trace ?? [])); if (!r.ok) throw new Error(r.error.message); return r.data; };
    try {
      const id = missionFromPlayer(playerId); if (!id) throw new Error("Unknown story save.");
      const definition = missions[id], adapter = new LiveTownClient(this.tools);
      let town = unwrap(await adapter.getTownState(playerId));
      const store = new CrossingStore(this.db, playerId, traces);
      const initial: MissionSave = { version: 1, mission: id, ap: 2, deadlineAt: this.now() + definition.deadline * 60_000, flags: [], clues: [], lastTick: 0, lines: [{ id: "opening", npc: definition.start, text: definition.opening, tick: 0 }] };
      const save = await store.init(this.now(), initial) as MissionSave;
      const refresh = async () => { town = unwrap(await adapter.getTownState(playerId)); };
      if (!save.flags.includes("initialized")) {
        for (const fact of definition.facts) await store.claim(fact.id, fact.npc, fact.text, 0, "", true);
        if (["coverup", "redemption", "detective"].includes(id)) {
          const subject = id === "coverup" ? "Case: the stolen forge sword" : id === "redemption" ? "Case: the broken chapel pledge" : "Case: the missing silver seal";
          let event = town.events.find((e) => e.subject === subject);
          if (!event) {
            const witness = id === "coverup" ? "brom" : id === "redemption" ? "ayla" : town.npcs[randomInt(town.npcs.length)].id;
            town = unwrap(await adapter.recordEvent({ playerId, placeId: placeFor[witness], witnesses: [witness], type: id === "redemption" ? "lied" : "stole", subject }, town));
            event = town.events.find((e) => e.subject === subject);
          }
          if (!event) throw new Error("Case initialization is incomplete.");
          save.caseEventId = event.id;
          if (id === "detective") {
            unwrap(await this.tools.call("spread", { playerId, eventId: event.id, maxHops: 3 })); await refresh();
            const path = unwrap(await this.tools.call("explain", { playerId, eventId: event.id, npcId: "garrick" }));
            const offRoute = town.npcs.filter((n) => !["garrick", "fenn", event.witnessId].includes(n.id) && !path.chain.some((hop) => hop.npcId === n.id));
            const candidates = offRoute.length ? offRoute : town.npcs.filter((n) => !["garrick", "fenn", event.witnessId].includes(n.id));
            save.liarId ??= candidates[randomInt(candidates.length)].id;
            const name = town.npcs.find((n) => n.id === save.liarId)?.name ?? save.liarId;
            await store.claim("alibi", "fenn", `${name} appears beside Fenn in the old watch-clock entry. Compare the chapel bell and Tilda's dated copy before deciding whether this rules out a firsthand claim.`, 0, "", true);
            await store.claim("false-witness", save.liarId, `${name} claims to have seen the seal taken firsthand.`, 0, event.id);
          }
        }
        addFlag(save, "initialized"); await store.save(save);
      }
      if (!save.flags.includes("complications-seeded")) {
        for (const fact of definition.facts) await store.claim(fact.id, fact.npc, fact.text, 0, "", true);
        if (id === "detective") {
          await store.claim("noise-cart", "silas", "Silas saw packing dumped beside the floodgate. This account concerns a cart, not the silver seal.", 0);
          await store.claim("noise-toll", "rowan", "Rowan says the bridge toll was paid to the guard. This account concerns money, not the silver seal.", 0);
          await store.claim("noise-copy", "mira", "A copied night entry is being discussed alongside a missing cart and the seal accusation. Their times and witnesses may differ.", 0);
        }
        addFlag(save, "complications-seeded"); await store.save(save);
      }
      const say = (npc: string, text: string) => storyLine(save, npc, text, town.tick);
      const after = async () => { await missionReactions(save, town, store); missionDeadline(save, town, definition.deadline, await store.claims()); await store.save(save); };
      const advance = async () => { town = unwrap(await adapter.advanceTime(town)); save.ap = 2; save.lastTick = town.tick; save.spreadCount = (town.gossipSteps?.length ?? 0) + await store.spread(town.tick); await after(); };
      const due = Math.min(definition.deadline, Math.floor((this.now() - (save.deadlineAt - definition.deadline * 60_000)) / 60_000));
      while (!save.ending && town.tick < due) await advance();
      const local = (npc?: string) => {
        const person = town.npcs.find((n) => n.id === npc), p = command.position, home = person && homes[person.id];
        if (!person || !home || !p || home.district !== p.district || Math.hypot(home.x - p.x, home.y - p.y) > SIGHT_RADIUS) throw new Error("Walk within sight of this villager.");
        return person;
      };
      if (!save.ending && command.action !== "inspect") {
        if (command.action === "wait" || command.action === "verdict") {
          do { await advance(); } while (command.action === "verdict" && !save.ending);
        } else {
          if (save.ap <= 0) throw new Error("No AP remain. End the turn.");
          if (command.action === "choose") {
            const choice = definition.choices.find((c) => c.id === command.choiceId); if (!choice) throw new Error("Unknown story reply.");
            local(choice.npc);
            const blocked = missionBlocked(choice, save.flags, town.tick) ?? specialBlock(save, choice.key, town);
            if (blocked) throw new Error(blocked);
            const refused = choice.trust !== undefined && (town.npcs.find((n) => n.id === choice.npc)?.attitudeScore ?? -1) < choice.trust;
            if (!command.position) throw new Error("Walk within sight of this villager.");
            const nearby = observeAt(command.position, town);
            town = unwrap(await adapter.recordEvent({ playerId, type: refused ? "traded" : choice.type, subject: refused ? `Refused|${choice.id}|${town.tick}` : choice.subject, placeId: nearby.place?.id ?? placeFor[choice.npc], witnesses: nearby.witnesses.map((n) => n.id), weight: refused || choice.type === "traded" ? 0 : choice.weight }, town));
            save.ap--;
            save.lines.push({ id: `${town.tick}-${save.lines.length}`, npc: "player", to: choice.npc, text: choice.label.replaceAll("“", "").replaceAll("”", ""), tick: town.tick });
            if (refused) say(choice.npc, "I need to trust you before I agree. An attempt still costs time. Help, or let truthful news reach me.");
            else {
              addFlag(save, choice.key); for (const flag of choice.grants ?? []) addFlag(save, flag); say(choice.npc, choice.reply);
              if (choice.fact) { const fact = (await store.claims()).find((c) => c.id === choice.fact && c.npc === choice.npc); if (!fact) throw new Error("That witness has no evidence to share."); say(choice.npc, fact.text); }
              if (choice.claim) await store.claim(choice.claim.id, choice.npc, choice.claim.text, town.tick, choice.claim.parent ?? "");
              const refusal = resolveMission(save, town, choice.key, await store.claims());
              if (refusal) { save.flags = save.flags.filter((f) => f !== choice.key); say(choice.npc, refusal); }
            }
          } else if (command.action === "ask" && id === "detective") {
            const npc = local(command.npcId);
            if (!save.caseEventId) throw new Error("The case is unavailable.");
            if (save.clues.some((c) => c.npcId === npc.id && c.tick === town.tick)) throw new Error("You already collected this person's statement this turn.");
            const recalled = unwrap(await this.tools.call("recall", { playerId, npcId: npc.id, limit: 50 }));
            const memory = recalled.items.find((m) => m.eventId === save.caseEventId), lying = npc.id === save.liarId;
            const source = lying ? "witness" : memory?.learnedFrom ?? "?", confidence = lying ? 1 : memory?.confidence ?? 0;
            save.clues.push({ npcId: npc.id, eventId: save.caseEventId, title: "The missing silver seal · statement", source, confidence, tick: town.tick });
            say(npc.id, source === "?" ? "I haven't heard the accusation." : source === "witness" ? "I saw it firsthand. That's my account." : `I heard it from ${town.npcs.find((n) => n.id === source)?.name ?? source}. I'm ${Math.round(confidence * 100)}% sure.`);
            const other = (await store.claims()).find((claim) => claim.npc === npc.id && claim.id.startsWith("noise-"));
            if (other) say(npc.id, `Separately, ${other.via === "witness" ? "my other account is" : `I heard from ${town.npcs.find((n) => n.id === other.via)?.name ?? other.via}`}: ${other.text}`);
            save.ap--;
          } else if (command.action === "accuse" && id === "detective" && command.answer) {
            const blocked = detectiveSubmissionBlock(save); if (blocked) throw new Error(blocked);
            if (!save.caseEventId) throw new Error("The case is unavailable.");
            const answer = command.answer;
            if ([answer.witnessId, ...answer.route, answer.liarId ?? ""].some((nid) => !town.npcs.some((n) => n.id === nid))) throw new Error("Name known villagers in all four fields.");
            const truth = await this.truth(save, town, unwrap);
            const score = Number(answer.witnessId === truth?.witnessId) + Number(answer.account === truth?.account) + Number(JSON.stringify(answer.route) === JSON.stringify(truth?.route)) + Number(answer.liarId === truth?.liarId);
            save.detectiveScore = score; save.ap--;
            endMission(save, town, score === 4 ? "The borrowed eyewitness exposed" : "A reconstruction with loose ends", score === 4, "garrick", `The graph and night register support ${score} of four answers. The recorded routes are now open for inspection.`);
          } else throw new Error("Use this story's chat replies or source questions.");
          await after();
          if (!save.ending && save.ap === 0) await advance();
        }
      }
      await store.save(save);
      const ended = Boolean(save.ending), claims = ended ? await store.claims() : undefined;
      const truth = ended && id === "detective" ? await this.truth(save, town, unwrap) : undefined;
      const result: TownState = { ...town, events: town.events.filter((e) => !e.subject?.startsWith("Refused|")).map((e) => ended ? e : { ...e, witnessId: "", witnessName: "Hidden until the ending" }),
        npcs: ended ? town.npcs : town.npcs.map((n) => ({ ...n, knowledgeHidden: true, rumors: [], contributions: [], attitudeScore: 0, primaryRumor: undefined, knowledgeState: "none" })),
        graphNodes: ended ? town.graphNodes : town.graphNodes.filter((n) => n.type === "npc"), graphEdges: ended ? town.graphEdges : town.graphEdges.filter((e) => e.type === "TRUSTS"),
        recentTraces: ended ? traces.slice(-250) : [], gossipSteps: [], activeProvenance: undefined, activePathEdgeIds: [],
        puzzle: { ap: save.ap, maxAp: 2, fog: !ended, clues: save.clues, caseEventId: save.caseEventId,
          state: { id, title: definition.title, stage: ended ? save.won ? "won" : "lost" : "playing", reason: save.ending ?? definition.objective, remaining: Math.max(0, definition.deadline - town.tick), goals: [{ text: definition.objective, complete: ended ? Boolean(save.won) : undefined }] },
          story: { mission: id, maxTurns: definition.deadline, objective: definition.objective, spreadCount: save.spreadCount, deadlineAt: save.deadlineAt, serverNow: this.now(), flags: save.flags.filter((f) => !["initialized", "complications-seeded"].includes(f)), lines: save.lines, ending: save.ending, claims },
          detective: id === "detective" ? { score: save.detectiveScore, maxScore: 4, truth } : undefined } };
      return { ok: true, data: result, trace: ended ? traces : [] };
    } catch (error) { return { ok: false, error: { code: "BAD_ARGS", message: error instanceof Error ? error.message : "Could not confirm this story. Inspect before retrying." }, trace: [] }; }
  }
  private async truth(save: MissionSave, town: TownState, unwrap: <T>(r: ToolEnvelope<T>) => T): Promise<DetectiveAnswer | undefined> {
    const event = town.events.find((e) => e.id === save.caseEventId); if (!event) return;
    const path = unwrap(await this.tools.call("explain", { playerId: town.playerId ?? "", npcId: "garrick", eventId: event.id }));
    return { witnessId: event.witnessId, route: path.chain.map((hop) => hop.npcId), account: path.status === "not_in_graph" ? "unaware" : path.chain.length === 1 ? "eyewitness" : "secondhand", liarId: save.liarId };
  }
}
