import type { HearsayClient, ToolInput } from "@hearsay/contract";
import { LiveTownClient } from "../lib/live-town";
import { choicesFor, choiceBlocked, scenarioFromPlayer } from "../lib/scenarios";
import { scenarioState, VERDICT } from "../lib/scenario-state";
import { homes } from "../lib/town-residents";
import { observeAt, SIGHT_RADIUS } from "../lib/town-space";
import type { TownPosition } from "../lib/town-space";
import type { TownState, ToolEnvelope, TraceStep } from "../lib/types";

export interface ScenarioCommand { playerId: string; action: "inspect" | "wait" | "verdict" | "choose"; choiceId?: string; position?: TownPosition }

// A director composes existing tools; it never writes Cypher or changes the memory contract.
export class ScenarioDirector {
  private readonly queues = new Map<string, Promise<unknown>>();
  constructor(private readonly tools: HearsayClient) {}
  execute(command: ScenarioCommand): Promise<ToolEnvelope<TownState>> {
    const previous = this.queues.get(command.playerId) ?? Promise.resolve();
    const pending = previous.catch(() => undefined).then(() => this.run(command));
    this.queues.set(command.playerId, pending);
    void pending.finally(() => { if (this.queues.get(command.playerId) === pending) this.queues.delete(command.playerId); });
    return pending;
  }
  private async run(command: ScenarioCommand): Promise<ToolEnvelope<TownState>> {
    const trace: TraceStep[] = [];
    const bad = (message: string): ToolEnvelope<TownState> => ({ ok: false, error: { code: "BAD_ARGS", message }, trace });
    if (!scenarioFromPlayer(command.playerId)) return bad("Not a scenario save.");
    const adapter = new LiveTownClient(this.tools);
    try {
      const loaded = await adapter.getTownState(command.playerId); trace.push(...(loaded.trace ?? []));
      if (!loaded.ok) return { ...loaded, trace };
      let town = loaded.data;
      let state = scenarioState(town);
      if (!state) return bad("Unknown scenario.");
      if (command.action !== "inspect" && state.stage !== "playing") return bad("This scenario is finished. Start a fresh one or return to free play.");
      if (command.action === "choose") {
        const choice = choicesFor(state.id, town.npcs).find((item) => item.id === command.choiceId);
        if (!choice || !command.position) return bad("Choose a valid local action.");
        const blocked = choiceBlocked(town, choice);
        if (blocked) return bad(blocked);
        const home = homes[choice.npc], position = command.position;
        if (!home || home.district !== position.district || Math.hypot(home.x - position.x, home.y - position.y) > SIGHT_RADIUS) return bad("Walk within sight of this villager first.");
        const nearby = observeAt(position, town);
        if (!nearby.place || !nearby.witnesses.length || nearby.witnesses.length > 6) return bad("Move closer to a valid witnessed location.");
        const input: ToolInput<"recordEvent"> = { playerId: command.playerId, type: choice.type, subject: choice.subject, placeId: nearby.place.id, witnesses: nearby.witnesses.map((npc) => npc.id) };
        const recorded = await adapter.recordEvent(input, town); trace.push(...(recorded.trace ?? []));
        if (!recorded.ok) return { ...recorded, trace };
        town = recorded.data;
        // Check immediate consequences before recency can soften them on the next tick.
        state = scenarioState(town);
      }
      const turns = command.action === "inspect" ? 0 : command.action === "verdict" ? state?.remaining ?? 0 : 1;
      for (let round = 0; round < turns && scenarioState(town)?.stage === "playing"; round++) {
        const next = await adapter.advanceTime(town); trace.push(...(next.trace ?? []));
        if (!next.ok) return { ...next, error: { ...next.error, message: `${next.error.message} A choice may already be recorded; inspect the story before deciding again.` }, trace };
        town = next.data;
      }
      state = scenarioState(town);
      if (state && ["won", "lost"].includes(state.stage) && !town.events.some((event) => Object.values(VERDICT).some((subject) => event.subject === subject))) {
        // A zero-weight verdict is an ordinary persistent event, not a hidden local win flag.
        const verdict = await adapter.recordEvent({ playerId: command.playerId, type: "traded", weight: 0, placeId: "barracks", witnesses: ["garrick"], subject: state.stage === "won" ? VERDICT.won : (state.trust ?? 100) <= 20 ? VERDICT.trust : VERDICT.deadline }, town);
        trace.push(...(verdict.trace ?? []));
        if (!verdict.ok) return { ...verdict, trace };
        town = verdict.data;
      }
      return { ok: true, data: { ...town, recentTraces: [...trace].reverse().slice(0, 250) }, trace };
    } catch {
      return { ok: false, error: { code: "INTERNAL", message: "Could not confirm the scenario. Inspect the saved story before retrying a decision." }, trace };
    }
  }
}
