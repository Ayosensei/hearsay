import type { HearsayClient, ToolInput, ToolName, ToolOutput } from "@hearsay/contract";
import type { NPC, TownState, ToolEnvelope, DialogueMessage, TraceStep } from "./types";
import { faction, initials, mapEvents, mapGraph, mapExplanation } from "./live-view";

type Call = <N extends ToolName>(name: N, input: ToolInput<N>) => Promise<ToolOutput<N>>;
class ToolFailure extends Error {
  constructor(readonly error: { code: string; message: string }) { super(error.message); }
}
export function browserPlayer(slot = "a") {
  let id = localStorage.getItem("hearsay-player");
  if (!id) {
    id = `web_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
    localStorage.setItem("hearsay-player", id);
  }
  return `${id}_${slot}`;
}

// This adapter only prepares presentation data. All knowledge and provenance come from tools.
export class LiveTownClient {
  constructor(readonly tools: HearsayClient) {}

  private async operation<T>(work: (call: Call) => Promise<T>): Promise<ToolEnvelope<T>> {
    const trace: TraceStep[] = [];
    const call: Call = async (name, input) => {
      let result = await this.tools.call(name, input);
      trace.push(...result.trace);
      if (!result.ok && result.error.code === "UNKNOWN_PLAYER" && "playerId" in input && input.playerId) {
        const created = await this.tools.call("newPlayer", { playerId: input.playerId });
        trace.push(...created.trace);
        if (!created.ok) throw new ToolFailure(created.error);
        result = await this.tools.call(name, input);
        trace.push(...result.trace);
      }
      if (!result.ok) throw new ToolFailure(result.error);
      return result.data;
    };
    try {
      const data = await work(call);
      return { ok: true, data, trace };
    } catch (error) {
      return { ok: false, error: error instanceof ToolFailure ? error.error : { code: "INTERNAL", message: "Could not load the town. Retry the request." }, trace };
    }
  }

  private async refresh(call: Call, playerId: string, previous?: TownState): Promise<TownState> {
    const [world, snapshot] = await Promise.all([
      call("getWorld", {}), call("snapshot", { playerId }),
    ]);
    const events = mapEvents(snapshot);
    const npcs = await Promise.all(world.npcs.map(async (person): Promise<NPC> => {
      const [attitude, recall] = await Promise.all([
        call("attitude", { playerId, npcId: person.id }),
        call("recall", { playerId, npcId: person.id, limit: 50 }),
      ]);
      const rumors = recall.items.map((item) => {
        const event = events.find((candidate) => candidate.id === item.eventId);
        return {
          eventId: item.eventId, eventTitle: event?.title ?? item.type,
          eventType: event?.type ?? (item.weight < 0 ? "harm" as const : "help" as const),
          confidence: item.confidence, hops: item.hop,
          heardFromId: item.learnedFrom, heardFromName: world.npcs.find((n) => n.id === item.learnedFrom)?.name,
          eyewitnessId: event?.witnessId ?? "", eyewitnessName: event?.witnessName ?? "",
          path: [], tickOccurred: item.tick,
        };
      });
      return {
        id: person.id, name: person.name, role: person.role, faction: faction(person.faction),
        avatarInitials: initials(person.name), attitude: attitude.label, attitudeScore: attitude.score,
        rumors, primaryRumor: rumors[0], knowledgeState: !rumors.length ? "none" : rumors.some((r) => r.hops === 0) ? "eyewitness" : "heard",
      };
    }));
    return {
      playerId, places: world.places, tick: snapshot.tick, npcs, events,
      ...mapGraph(snapshot, npcs), selectedNpcId: previous?.selectedNpcId ?? world.npcs[0]?.id ?? "",
      dialogueHistory: previous?.dialogueHistory ?? {}, activePathEdgeIds: [], recentTraces: [],
    };
  }

  private finish(result: ToolEnvelope<TownState>, previous?: TownState) {
    if (result.ok) result.data.recentTraces = [...result.trace].reverse().concat(previous?.recentTraces ?? []).slice(0, 250);
    return result;
  }

  async getTownState(playerId = browserPlayer()) {
    return this.finish(await this.operation(async (call) => {
      await call("newPlayer", { playerId });
      return this.refresh(call, playerId);
    }));
  }

  async resetTown(state: TownState) {
    return this.finish(await this.operation(async (call) => {
      const playerId = state.playerId ?? browserPlayer();
      await call("resetPlayer", { playerId });
      return this.refresh(call, playerId, { ...state, dialogueHistory: {} });
    }), state);
  }

  async advanceTime(state: TownState) {
    return this.finish(await this.operation(async (call) => {
      const playerId = state.playerId ?? browserPlayer();
      const advanced = await call("advanceTime", { playerId });
      const next = await this.refresh(call, playerId, state);
      next.activePathEdgeIds = advanced.steps.map((step) => `TOLD:NPC:${step.tellerId}->NPC:${step.listenerId}:${step.eventId}`);
      return next;
    }), state);
  }

  async recordEvent(input: ToolInput<"recordEvent">, state: TownState) {
    return this.finish(await this.operation(async (call) => {
      const recorded = await call("recordEvent", input);
      const next = await this.refresh(call, input.playerId, state);
      next.events.sort((a, b) => Number(b.id === recorded.eventId) - Number(a.id === recorded.eventId));
      return next;
    }), state);
  }

  recordAction(title: string, kind: "harm" | "help", witness: string, placeName: string, state: TownState) {
    const place = state.places?.find((p) => p.name === placeName);
    return this.recordEvent({ playerId: state.playerId ?? browserPlayer(), type: kind === "harm" ? "stole" : "helped",
      subject: title, witnesses: [witness], placeId: place?.id ?? "unknown" }, state);
  }

  explainProvenance(npcId: string, eventId: string, state: TownState) {
    return this.operation(async (call) => {
      const why = await call("explain", { playerId: state.playerId ?? browserPlayer(), npcId, eventId });
      const event = state.events.find((candidate) => candidate.id === eventId);
      return event ? mapExplanation(why, event, state.npcs) : undefined;
    });
  }

  async sendMessage(npcId: string, text: string, state: TownState): Promise<ToolEnvelope<{ message: DialogueMessage; updatedState: TownState }>> {
    const result = await this.operation(async (call) => {
      const playerId = state.playerId ?? browserPlayer();
      const history = state.dialogueHistory[npcId] ?? [];
      const conversationId = [...history].reverse().find((message) => message.conversationId)?.conversationId;
      const said = await call("say", { playerId, npcId, text, conversationId });
      const next = await this.refresh(call, playerId, state);
      const event = next.events.find((candidate) => said.usedEventIds.includes(candidate.id));
      const why = event ? await call("explain", { playerId, npcId, eventId: event.id }) : undefined;
      const provenance = event && why ? mapExplanation(why, event, next.npcs) : undefined;
      const message: DialogueMessage = {
        id: crypto.randomUUID(), sender: "npc", npcId, text: said.reply, timestamp: "Just now",
        groundedInKnowledge: true, provenance, source: said.source, firewall: said.firewall, conversationId: said.conversationId,
      };
      next.dialogueHistory = { ...next.dialogueHistory, [npcId]: [...history,
        { id: crypto.randomUUID(), sender: "player", text, timestamp: "Just now", groundedInKnowledge: false }, message] };
      next.activeProvenance = provenance;
      next.activePathEdgeIds = why?.edgeIds ?? [];
      return { message, updatedState: next };
    });
    if (result.ok) result.data.updatedState.recentTraces = [...result.trace].reverse().concat(state.recentTraces).slice(0, 250);
    return result;
  }
}
