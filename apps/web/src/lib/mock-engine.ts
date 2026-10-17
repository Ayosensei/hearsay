import {
  DialogueMessage,
  EventType,
  GraphNode,
  ProvenanceChain,
  RumorKnowledge,
  ToolEnvelope,
  TownEvent,
  TownState,
  TraceStep,
} from "./types";
import {
  ATTITUDE_SHIFT,
  attitudeFromScore,
  buildProvenance,
  clampScore,
  deriveNpc,
  MIN_CONFIDENCE,
  propagate,
  syncNodeAttitudes,
} from "./gossip";
import { answerFor } from "./dialogue";
import { isKnownPlace } from "./places";

/** Mock tools. Same envelope as the real ones: { ok, data, trace } or { ok: false, error }. */

const MAX_TRACES = 10;
const MAX_ACTION_TITLE = 80;
const firstName = (name: string): string => name.split(" ")[0];
const withTraces = (fresh: TraceStep[], old: TraceStep[]): TraceStep[] =>
  [...fresh, ...old].slice(0, MAX_TRACES);

function hearsayLine(from: string, title: string, type: EventType): string {
  return type === "help"
    ? `${from} says you did right by us: "${title}". Good to know who to trust.`
    : `${from} told me about "${title}". I don't like what that says about you.`;
}

export function advanceSimulationTick(state: TownState): ToolEnvelope<TownState> {
  const newTick = state.tick + 1;
  const { npcs: propagated, spreads } = propagate(state.npcs, state.graphEdges);
  const newHearings = spreads.filter((s) => s.isNew);

  // First-time hearers shift attitude by how credible the rumor is.
  const npcs = propagated.map((npc) => {
    const heard = newHearings.filter((s) => s.toId === npc.id);
    if (heard.length === 0) return deriveNpc(npc);
    const shift = heard.reduce(
      (sum, s) => sum + (s.rumor.eventType === "harm" ? -1 : 1) * s.rumor.confidence * ATTITUDE_SHIFT,
      0
    );
    const attitudeScore = clampScore(npc.attitudeScore + shift);
    return deriveNpc({ ...npc, attitudeScore, attitude: attitudeFromScore(attitudeScore) });
  });

  // New hearers speak up once, with the chain that brought the news to them.
  const dialogueHistory = { ...state.dialogueHistory };
  for (const s of newHearings) {
    const teller = state.npcs.find((n) => n.id === s.fromId);
    const message: DialogueMessage = {
      id: `gossip_${newTick}_${s.toId}_${s.rumor.eventId}`,
      sender: "npc",
      npcId: s.toId,
      text: hearsayLine(firstName(teller?.name ?? "Someone"), s.rumor.eventTitle, s.rumor.eventType),
      timestamp: "Just now",
      groundedInKnowledge: true,
      provenance: buildProvenance(s.rumor, npcs, state.graphEdges),
    };
    dialogueHistory[s.toId] = [...(dialogueHistory[s.toId] ?? []), message];
  }

  const traces: TraceStep[] = [
    { agent: "system", tool: "advance_time", queryId: "Q21_set_tick", args: { new_tick: newTick }, rows: 1, ms: 2.1 },
    { agent: "gossip", tool: "spread_gossip", queryId: "Q40_gossip_candidates_all", args: { tick: newTick, min_confidence: MIN_CONFIDENCE }, rows: spreads.length, ms: 3.8 },
  ];
  if (newHearings.length > 0) {
    traces.push({ agent: "npc", tool: "update_attitude", queryId: "Q51_attitude_inputs", args: { listeners: newHearings.map((s) => s.toId) }, rows: newHearings.length, ms: 1.6 });
  }

  const data: TownState = {
    ...state,
    tick: newTick,
    npcs,
    graphNodes: syncNodeAttitudes(state.graphNodes, npcs),
    dialogueHistory,
    // Light up every edge a rumor travelled this tick so the spread is visible.
    activePathEdgeIds: [...new Set(spreads.map((s) => s.edgeId))],
    activeProvenance: undefined,
    recentTraces: withTraces(traces, state.recentTraces),
  };
  return { ok: true, data, trace: traces };
}

export function sendMockDialogue(
  npcId: string,
  userMessage: string,
  state: TownState
): ToolEnvelope<{ message: DialogueMessage; updatedState: TownState }> {
  const npc = state.npcs.find((n) => n.id === npcId);
  if (!npc) {
    return {
      ok: false,
      error: { code: "UNKNOWN_NPC", message: `NPC with id "${npcId}" was not found in the world graph.` },
    };
  }
  if (!userMessage.trim()) {
    return { ok: false, error: { code: "EMPTY_MESSAGE", message: "Say something to the NPC first." } };
  }

  // The firewall decides what this NPC may talk about before any reply is written.
  const answer = answerFor(npc, userMessage, state.events);
  const traces: TraceStep[] = [
    { agent: "scribe", tool: "resolve_npc", queryId: "Q24_resolve_npcs", args: { npc_id: npcId }, rows: 1, ms: 1.2 },
    {
      agent: "npc",
      tool: "filter_knowledge",
      queryId: "Q92_dialogue_known",
      args: { npc_id: npcId, asked_about: answer.topics },
      rows: answer.rumor ? 1 : 0,
      ms: 2.4,
    },
  ];

  const provenance: ProvenanceChain | undefined = answer.rumor
    ? buildProvenance(answer.rumor, state.npcs, state.graphEdges)
    : undefined;
  const stamp = state.dialogueHistory[npcId]?.length ?? 0;

  const playerMessage: DialogueMessage = {
    id: `u_${npcId}_${stamp}`,
    sender: "player",
    text: userMessage,
    timestamp: "Just now",
    groundedInKnowledge: true,
  };
  const message: DialogueMessage = {
    id: `npc_${npcId}_${stamp + 1}`,
    sender: "npc",
    npcId,
    text: answer.text,
    timestamp: "Just now",
    groundedInKnowledge: true,
    provenance,
  };

  const updatedState: TownState = {
    ...state,
    dialogueHistory: {
      ...state.dialogueHistory,
      [npcId]: [...(state.dialogueHistory[npcId] ?? []), playerMessage, message],
    },
    activeProvenance: provenance,
    recentTraces: withTraces(traces, state.recentTraces),
  };
  return { ok: true, data: { message, updatedState }, trace: traces };
}

const SHORT_LABELS: Array<[string, string]> = [
  ["donate", "Gold Donated"],
  ["pickpocket", "Pickpocketed"],
  ["poison", "Well Poisoned"],
  ["smuggle", "Contraband"],
  ["rescue", "Courier Rescued"],
];

function shortLabel(title: string): string {
  const lower = title.toLowerCase();
  const hit = SHORT_LABELS.find(([keyword]) => lower.includes(keyword));
  if (hit) return hit[1];
  return title.length > 14 ? `${title.slice(0, 12)}…` : title;
}

export function recordPlayerAction(
  actionTitle: string,
  actionType: EventType,
  witnessNpcId: string,
  placeName: string,
  state: TownState
): ToolEnvelope<TownState> {
  const witness = state.npcs.find((n) => n.id === witnessNpcId);
  if (!witness) {
    return {
      ok: false,
      error: { code: "UNKNOWN_NPC", message: `Witness NPC "${witnessNpcId}" was not found.` },
    };
  }
  if (!isKnownPlace(placeName)) {
    return { ok: false, error: { code: "UNKNOWN_PLACE", message: `Place "${placeName}" is not in Hollowbrook.` } };
  }
  if (actionType !== "help" && actionType !== "harm") {
    return { ok: false, error: { code: "INVALID_ACTION", message: "An action must be help or harm." } };
  }
  const title = actionTitle.trim().slice(0, MAX_ACTION_TITLE);
  if (!title) {
    return { ok: false, error: { code: "EMPTY_ACTION", message: "Describe what you did." } };
  }

  const serial = state.events.length + 1;
  const eventId = `event_player_${serial}`;
  const event: TownEvent = {
    id: eventId,
    title,
    description: `Player performed ${actionType === "help" ? "a helpful" : "a harmful"} deed: "${title}" at ${placeName}.`,
    type: actionType,
    witnessId: witness.id,
    witnessName: witness.name,
    placeName,
    tickOccurred: state.tick,
  };

  // Stack multiple deeds by one witness diagonally so the nodes never overlap.
  const witnessNode = state.graphNodes.find((n) => n.id === witness.id);
  const earlier = state.graphEdges.filter((e) => e.type === "WITNESSED" && e.source === witness.id).length;
  // Keep the node inside the graph's 640x440 viewBox so it can never be clipped.
  const clampX = (v: number): number => Math.max(40, Math.min(600, v));
  const clampY = (v: number): number => Math.max(40, Math.min(400, v));
  const eventNode: GraphNode = {
    id: eventId,
    label: shortLabel(title),
    type: "event",
    eventType: actionType,
    x: clampX((witnessNode?.x ?? 300) + 55 + earlier * 30),
    y: clampY((witnessNode?.y ?? 200) - 55 - earlier * 12),
  };

  const rumor: RumorKnowledge = {
    eventId,
    eventTitle: title,
    eventType: actionType,
    confidence: 1.0,
    hops: 0,
    eyewitnessId: witness.id,
    eyewitnessName: witness.name,
    path: [witness.id],
    tickOccurred: state.tick,
  };

  const npcs = state.npcs.map((n) => {
    if (n.id !== witness.id) return n;
    const attitudeScore = clampScore(n.attitudeScore + (actionType === "help" ? 0.35 : -0.35));
    return deriveNpc({
      ...n,
      attitudeScore,
      attitude: attitudeFromScore(attitudeScore),
      rumors: [...n.rumors, rumor],
    });
  });
  const graphEdges = [
    ...state.graphEdges,
    { id: `e_wit_player_${serial}`, source: witness.id, target: eventId, type: "WITNESSED" as const, weight: 1.0 },
  ];

  const trace: TraceStep = {
    agent: "scribe",
    tool: "record_event",
    queryId: "Q30_record_event",
    args: { event_id: eventId, action_type: actionType, witness_id: witness.id, place: placeName },
    rows: 1,
    ms: 1.5,
  };

  // The witness reacts immediately, grounded in what they just saw.
  const provenance = buildProvenance(rumor, npcs, graphEdges);
  const reaction: DialogueMessage = {
    id: `react_${eventId}`,
    sender: "npc",
    npcId: witness.id,
    text:
      actionType === "help"
        ? `I saw what you did: "${title}". I won't forget it.`
        : `I saw what you did: "${title}". Don't expect me to stay quiet about it.`,
    timestamp: "Just now",
    groundedInKnowledge: true,
    provenance,
  };

  const data: TownState = {
    ...state,
    events: [event, ...state.events],
    graphNodes: syncNodeAttitudes([...state.graphNodes, eventNode], npcs),
    graphEdges,
    npcs,
    dialogueHistory: {
      ...state.dialogueHistory,
      [witness.id]: [...(state.dialogueHistory[witness.id] ?? []), reaction],
    },
    recentTraces: withTraces([trace], state.recentTraces),
  };
  return { ok: true, data, trace: [trace] };
}
