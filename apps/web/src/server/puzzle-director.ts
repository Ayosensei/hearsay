import { randomInt } from "node:crypto";
import type { HearsayClient, ToolInput, ToolName, ToolOutput } from "@hearsay/contract";
import { LiveTownClient } from "../lib/live-town";
import { choicesFor, choiceBlocked, scenarioFromPlayer } from "../lib/scenarios";
import { scenarioState, VERDICT } from "../lib/scenario-state";
import { CASE_SUBJECT, eventKey, gameplayEvents, isPuzzle, pointsLeft, puzzleView } from "../lib/puzzle";
import type { DetectiveAnswer } from "../lib/puzzle";
import { homes, placeFor } from "../lib/town-residents";
import { observeAt, SIGHT_RADIUS } from "../lib/town-space";
import type { TownPosition } from "../lib/town-space";
import type { TownState, ToolEnvelope, TraceStep } from "../lib/types";

export interface PuzzleCommand {
  playerId: string; action: "inspect" | "wait" | "verdict" | "choose" | "ask" | "speak" | "accuse";
  choiceId?: string; position?: TownPosition; npcId?: string; eventId?: string;
  text?: string; conversationId?: string; answer?: DetectiveAnswer;
}
class PuzzleFailure extends Error { constructor(readonly code: string, message: string) { super(message); } }
export class PuzzleDirector {
  private readonly queues = new Map<string, Promise<unknown>>();
  constructor(private readonly tools: HearsayClient) {}
  execute(command: PuzzleCommand): Promise<ToolEnvelope<TownState>> {
    const previous = this.queues.get(command.playerId) ?? Promise.resolve();
    const pending = previous.catch(() => undefined).then(() => this.run(command));
    this.queues.set(command.playerId, pending);
    void pending.finally(() => { if (this.queues.get(command.playerId) === pending) this.queues.delete(command.playerId); });
    return pending;
  }
  private async run(command: PuzzleCommand): Promise<ToolEnvelope<TownState>> {
    const trace: TraceStep[] = [], adapter = new LiveTownClient(this.tools), playerId = command.playerId;
    function fail(message: string): never { throw new PuzzleFailure("BAD_ARGS", message); }
    const call = async <N extends ToolName>(name: N, input: ToolInput<N>): Promise<ToolOutput<N>> => {
      const result = await this.tools.call(name, input); trace.push(...result.trace);
      if (!result.ok) throw new PuzzleFailure(result.error.code, result.error.message);
      return result.data;
    };
    const unwrap = <T>(result: ToolEnvelope<T>): T => {
      trace.push(...(result.trace ?? [])); if (!result.ok) throw new PuzzleFailure(result.error.code, result.error.message); return result.data;
    };
    try {
      if (!isPuzzle(playerId)) fail("Not a puzzle save.");
      let town = unwrap(await adapter.getTownState(playerId));
      const refresh = async () => { town = unwrap(await adapter.getTownState(playerId)); };
      const record = async (subject: string, type: ToolInput<"recordEvent">["type"], npc: string, weight?: number, position?: TownPosition) => {
        const nearby = position ? observeAt(position, town) : undefined;
        town = unwrap(await adapter.recordEvent({ playerId, subject, type, weight, placeId: nearby?.place?.id ?? placeFor[npc], witnesses: nearby?.witnesses.map((person) => person.id) ?? [npc] }, town));
      };
      const id = scenarioFromPlayer(playerId);
      if (!id) fail("Unknown puzzle.");
      if (["coverup", "redemption", "detective"].includes(id) && !town.events.some((event) => event.subject === "Case prepared")) {
        let caseEvent = town.events.find((event) => event.subject?.startsWith("Case:"));
        if (!caseEvent) {
          const witness = id === "detective" ? town.npcs[randomInt(town.npcs.length)].id : id === "redemption" ? "ayla" : "brom";
          await record(id === "detective" ? CASE_SUBJECT : id === "redemption" ? "Case: a broken chapel promise" : "Case: the forge sword", id === "redemption" ? "lied" : "stole", witness);
          caseEvent = town.events.find((event) => event.subject?.startsWith("Case:"));
        }
        if (id === "detective" && caseEvent) { await call("spread", { playerId, eventId: caseEvent.id, maxHops: 3 }); await refresh(); }
        await record("Case prepared", "traded", "garrick", 0);
      }
      let state = scenarioState(town);
      if (!state) fail("Unknown puzzle state.");
      if (command.action !== "inspect" && state.stage !== "playing") fail("This puzzle is finished. Reveal the graph or begin a fresh attempt.");
      const local = (npcId?: string) => {
        const npc = town.npcs.find((person) => person.id === npcId), home = npc && homes[npc.id], p = command.position;
        if (!npc || !home || !p || p.district !== home.district || Math.hypot(home.x - p.x, home.y - p.y) > SIGHT_RADIUS) fail("Walk within sight of the villager first.");
        return npc;
      };
      const spending = ["choose", "ask", "speak", "accuse"].includes(command.action);
      if (spending && pointsLeft(town) === 0) fail("No action points remain. End the turn to let gossip spread.");
      if (command.action === "choose") {
        if (id === "detective") fail("Detective mode uses questions and a reconstruction, not new deeds.");
        const choice = choicesFor(id, town.npcs).find((item) => item.id === command.choiceId);
        if (!choice) fail("Unknown local choice.");
        local(choice.npc);
        const refused = `Refused|${choice.id}|${town.tick}`;
        if (town.events.some((event) => event.subject === refused)) fail("You already tried this request this turn.");
        const blocked = choiceBlocked(town, choice);
        if (blocked === "Already completed") fail(blocked);
        if (blocked) await record(refused, "traded", choice.npc, 0, command.position);
        else await record(choice.subject, choice.type, choice.npc, undefined, command.position);
      }
      if (command.action === "ask") {
        const npc = local(command.npcId);
        const target = command.eventId ? gameplayEvents(town).find((event) => event.id === command.eventId) : gameplayEvents(town).find((event) => event.subject?.startsWith("Case:")) ?? gameplayEvents(town)[0];
        const key = target && eventKey(town, target.id);
        if (!target || !key) fail("Choose a recorded deed to ask about.");
        const prefix = `Note|${npc.id}|${key}|`;
        if (town.events.some((event) => event.subject?.startsWith(prefix) && event.tickOccurred === town.tick)) fail("Already questioned about this deed this turn. Your dated note is in the notebook.");
        const recalled = await call("recall", { playerId, npcId: npc.id, limit: 50 });
        const memory = recalled.items.find((item) => item.eventId === target.id);
        await record(`${prefix}${memory?.learnedFrom ?? "?"}|${memory ? Number(memory.confidence.toFixed(4)) : 0}|${town.tick}`, "traded", npc.id, 0, command.position);
      }
      if (command.action === "speak") {
        const npc = local(command.npcId);
        const said = await call("say", { playerId, npcId: npc.id, text: command.text ?? "", conversationId: command.conversationId });
        await record(`Talk|${npc.id}|${town.tick}|${pointsLeft(town)}`, "traded", npc.id, 0, command.position);
        town.dialogueHistory = { [npc.id]: [{ id: crypto.randomUUID(), sender: "player", text: command.text ?? "", timestamp: "Just now", groundedInKnowledge: false }, { id: crypto.randomUUID(), sender: "npc", npcId: npc.id, text: said.reply, timestamp: "Just now", groundedInKnowledge: true, source: said.source, firewall: said.firewall, conversationId: said.conversationId }] };
      }
      if (command.action === "accuse") {
        if (id !== "detective" || !command.answer) fail("Submit a detective reconstruction.");
        const target = town.events.find((event) => event.subject === CASE_SUBJECT);
        if (!target) fail("Case is missing.");
        const answer = command.answer;
        if ([answer.witnessId, ...answer.route].some((npcId) => !town.npcs.some((npc) => npc.id === npcId))) throw new PuzzleFailure("UNKNOWN_NPC", "A reconstruction names an unknown villager.");
        const path = await call("explain", { playerId, npcId: "garrick", eventId: target.id });
        const truth: DetectiveAnswer = { witnessId: target.witnessId, route: path.chain.map((hop) => hop.npcId), account: path.status === "not_in_graph" ? "unaware" : path.chain.length === 1 ? "eyewitness" : "secondhand" };
        const score = Number(answer.witnessId === truth.witnessId) + Number(answer.account === truth.account) + Number(JSON.stringify(answer.route) === JSON.stringify(truth.route));
        await record(`Detective score: ${score}/3`, "traded", "garrick", 0);
        await record(score === 3 ? VERDICT.won : VERDICT.incorrect, "traded", "garrick", 0);
      }
      const turns = command.action === "verdict" ? state.remaining : command.action === "wait" || (spending && pointsLeft(town) === 0) ? 1 : 0;
      for (let round = 0; round < turns && scenarioState(town)?.stage === "playing"; round++) town = unwrap(await adapter.advanceTime(town));
      state = scenarioState(town);
      if (state && ["won", "lost"].includes(state.stage) && !town.events.some((event) => Object.values(VERDICT).some((value) => value === event.subject))) {
        const guard = town.npcs.find((npc) => npc.id === "garrick");
        const serious = town.events.some((event) => ["stole", "attacked"].includes(event.actionType ?? "") && (event.weight ?? 0) <= -.8 && guard?.rumors.some((memory) => memory.eventId === event.id));
        const outcome = state.stage === "won" ? VERDICT.won : id !== "detective" && serious && guard?.attitude === "hostile" ? VERDICT.arrest : id === "coverup" && (state.trust ?? 50) <= 40 ? VERDICT.exposed : (state.trust ?? 100) <= 20 ? VERDICT.trust : VERDICT.deadline;
        await record(outcome, "traded", "garrick", 0);
      }
      let truth: DetectiveAnswer | undefined;
      if (id === "detective" && scenarioState(town)?.stage !== "playing") {
        const target = town.events.find((event) => event.subject === CASE_SUBJECT);
        if (target) { const path = await call("explain", { playerId, npcId: "garrick", eventId: target.id }); truth = { witnessId: target.witnessId, route: path.chain.map((hop) => hop.npcId), account: path.status === "not_in_graph" ? "unaware" : path.chain.length === 1 ? "eyewitness" : "secondhand" }; }
      }
      const result = puzzleView({ ...town, recentTraces: [...trace].reverse().slice(0, 250) }, truth);
      return { ok: true, data: result, trace: result.puzzle?.fog ? [] : trace };
    } catch (error) {
      return { ok: false, error: { code: error instanceof PuzzleFailure ? error.code : "INTERNAL", message: error instanceof PuzzleFailure ? error.message : "Could not confirm the puzzle. Inspect the saved story before retrying." }, trace: [] };
    }
  }
}
