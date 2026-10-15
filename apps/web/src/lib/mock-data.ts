import {
  NPC,
  GraphNode,
  GraphEdge,
  TownEvent,
  TownState,
  ProvenanceChain,
  DialogueMessage,
  TraceStep,
  ToolEnvelope,
} from "./types";

export const INITIAL_NPCS: NPC[] = [
  {
    id: "martha",
    name: "Martha Finch",
    role: "Tavernkeeper (The Stumbling Badger)",
    faction: "townsfolk",
    avatarInitials: "MF",
    attitude: "wary",
    attitudeScore: -0.4,
    knowledgeState: "eyewitness",
    primaryRumor: {
      eventId: "event_relic_theft",
      eventTitle: "Theft of the Sun-Stone Relic",
      eventType: "harm",
      confidence: 1.0,
      hops: 0,
      eyewitnessId: "martha",
      eyewitnessName: "Martha Finch",
    },
  },
  {
    id: "garrick",
    name: "Garrick Vance",
    role: "Town Blacksmith",
    faction: "townsfolk",
    avatarInitials: "GV",
    attitude: "wary",
    attitudeScore: -0.32,
    knowledgeState: "heard",
    primaryRumor: {
      eventId: "event_relic_theft",
      eventTitle: "Theft of the Sun-Stone Relic",
      eventType: "harm",
      confidence: 0.85,
      hops: 1,
      heardFromId: "martha",
      heardFromName: "Martha Finch",
      eyewitnessId: "martha",
      eyewitnessName: "Martha Finch",
    },
  },
  {
    id: "captain_vane",
    name: "Captain Vane",
    role: "City Watch Commander",
    faction: "guard",
    avatarInitials: "CV",
    attitude: "neutral",
    attitudeScore: 0.0,
    knowledgeState: "none",
  },
  {
    id: "bartholomew",
    name: "Bartholomew",
    role: "Master Herbalist",
    faction: "merchants",
    avatarInitials: "BA",
    attitude: "friendly",
    attitudeScore: 0.65,
    knowledgeState: "eyewitness",
    primaryRumor: {
      eventId: "event_herbs_help",
      eventTitle: "Delivery of Fever-Herbs",
      eventType: "help",
      confidence: 1.0,
      hops: 0,
      eyewitnessId: "bartholomew",
      eyewitnessName: "Bartholomew",
    },
  },
  {
    id: "lyra",
    name: "Lyra Swift",
    role: "Guild Courier",
    faction: "merchants",
    avatarInitials: "LS",
    attitude: "neutral",
    attitudeScore: 0.1,
    knowledgeState: "heard",
    primaryRumor: {
      eventId: "event_relic_theft",
      eventTitle: "Theft of the Sun-Stone Relic",
      eventType: "harm",
      confidence: 0.9,
      hops: 1,
      heardFromId: "martha",
      heardFromName: "Martha Finch",
      eyewitnessId: "martha",
      eyewitnessName: "Martha Finch",
    },
  },
];

export const INITIAL_EVENTS: TownEvent[] = [
  {
    id: "event_relic_theft",
    title: "Theft of the Sun-Stone Relic",
    description: "An ancient glowing artifact was pilfered from the sanctuary altar at twilight.",
    type: "harm",
    witnessId: "martha",
    witnessName: "Martha Finch",
    placeName: "Chapel Vault",
    tickOccurred: 1,
  },
  {
    id: "event_herbs_help",
    title: "Delivery of Fever-Herbs",
    description: "The player gathered and delivered rare swamp herbs to save sick town children.",
    type: "help",
    witnessId: "bartholomew",
    witnessName: "Bartholomew",
    placeName: "Apothecary Lab",
    tickOccurred: 2,
  },
];

export const INITIAL_GRAPH_NODES: GraphNode[] = [
  { id: "martha", label: "Martha", type: "npc", faction: "townsfolk", attitude: "wary", x: 180, y: 140 },
  { id: "garrick", label: "Garrick", type: "npc", faction: "townsfolk", attitude: "wary", x: 340, y: 160 },
  { id: "captain_vane", label: "Capt. Vane", type: "npc", faction: "guard", attitude: "neutral", x: 500, y: 220 },
  { id: "bartholomew", label: "Bartholomew", type: "npc", faction: "merchants", attitude: "friendly", x: 260, y: 320 },
  { id: "lyra", label: "Lyra", type: "npc", faction: "merchants", attitude: "neutral", x: 120, y: 270 },
  { id: "event_relic_theft", label: "Relic Stolen", type: "event", eventType: "harm", x: 140, y: 60 },
  { id: "event_herbs_help", label: "Herbs Delivered", type: "event", eventType: "help", x: 380, y: 360 },
];

export const INITIAL_GRAPH_EDGES: GraphEdge[] = [
  { id: "e1", source: "martha", target: "garrick", type: "TRUSTS", weight: 0.85 },
  { id: "e2", source: "garrick", target: "captain_vane", type: "TRUSTS", weight: 0.75 },
  { id: "e3", source: "martha", target: "lyra", type: "TRUSTS", weight: 0.9 },
  { id: "e4", source: "lyra", target: "bartholomew", type: "TRUSTS", weight: 0.8 },
  { id: "e5", source: "bartholomew", target: "garrick", type: "TRUSTS", weight: 0.6 },
  { id: "e_wit_1", source: "martha", target: "event_relic_theft", type: "WITNESSED", weight: 1.0 },
  { id: "e_wit_2", source: "bartholomew", target: "event_herbs_help", type: "WITNESSED", weight: 1.0 },
];

export const INITIAL_DIALOGUES: Record<string, DialogueMessage[]> = {
  martha: [
    {
      id: "m_1",
      sender: "npc",
      npcId: "martha",
      text: "I keep my taproom doors open to all, stranger, but I saw what happened at the chapel vault. I don't forget faces.",
      timestamp: "10:14 PM",
      groundedInKnowledge: true,
      provenance: {
        eventId: "event_relic_theft",
        eventTitle: "Theft of the Sun-Stone Relic",
        eventType: "harm",
        witnessId: "martha",
        witnessName: "Martha Finch",
        hops: [
          {
            npcId: "martha",
            npcName: "Martha Finch",
            avatarInitials: "MF",
            role: "Tavernkeeper",
            faction: "townsfolk",
            confidence: 1.0,
            step: 0,
            isWitness: true,
          },
        ],
        totalDecay: 0.0,
        hopCount: 0,
      },
    },
  ],
  garrick: [
    {
      id: "g_1",
      sender: "npc",
      npcId: "garrick",
      text: "Look, Martha told me someone slipped out of the vault with the relic. If it was you, keep your hands off my forge tools.",
      timestamp: "10:18 PM",
      groundedInKnowledge: true,
      provenance: {
        eventId: "event_relic_theft",
        eventTitle: "Theft of the Sun-Stone Relic",
        eventType: "harm",
        witnessId: "martha",
        witnessName: "Martha Finch",
        hops: [
          {
            npcId: "martha",
            npcName: "Martha Finch",
            avatarInitials: "MF",
            role: "Tavernkeeper",
            faction: "townsfolk",
            confidence: 1.0,
            step: 0,
            isWitness: true,
          },
          {
            npcId: "garrick",
            npcName: "Garrick Vance",
            avatarInitials: "GV",
            role: "Blacksmith",
            faction: "townsfolk",
            confidence: 0.85,
            step: 1,
            isWitness: false,
          },
        ],
        totalDecay: 0.15,
        hopCount: 1,
      },
    },
  ],
  captain_vane: [
    {
      id: "v_1",
      sender: "npc",
      npcId: "captain_vane",
      text: "State your business in Hollowbrook. Keep the peace and we won't have problems. I haven't heard anything to suspect you yet.",
      timestamp: "10:20 PM",
      groundedInKnowledge: true,
    },
  ],
  bartholomew: [
    {
      id: "b_1",
      sender: "npc",
      npcId: "bartholomew",
      text: "Bless you, friend! The children would not have survived the fever without those Blackwood marsh-herbs you brought.",
      timestamp: "10:22 PM",
      groundedInKnowledge: true,
      provenance: {
        eventId: "event_herbs_help",
        eventTitle: "Delivery of Fever-Herbs",
        eventType: "help",
        witnessId: "bartholomew",
        witnessName: "Bartholomew",
        hops: [
          {
            npcId: "bartholomew",
            npcName: "Bartholomew",
            avatarInitials: "BA",
            role: "Master Herbalist",
            faction: "merchants",
            confidence: 1.0,
            step: 0,
            isWitness: true,
          },
        ],
        totalDecay: 0.0,
        hopCount: 0,
      },
    },
  ],
  lyra: [
    {
      id: "l_1",
      sender: "npc",
      npcId: "lyra",
      text: "Packages, gossip, letters—everything moves through me. Martha mentioned some trouble at the chapel. Best watch your step.",
      timestamp: "10:24 PM",
      groundedInKnowledge: true,
    },
  ],
};

export const INITIAL_TRACES: TraceStep[] = [
  {
    agent: "scribe",
    tool: "load_world_state",
    queryId: "Q01_load_player_graph",
    args: { player_id: "player_default" },
    rows: 12,
    ms: 4.2,
  },
  {
    agent: "gossip",
    tool: "gossip_step",
    queryId: "Q40_gossip_candidates",
    args: { max_hops: 2, min_confidence: 0.6 },
    rows: 8,
    ms: 3.1,
  },
  {
    agent: "npc",
    tool: "check_knowledge_firewall",
    queryId: "Q22_filter_knowledge_firewall",
    args: { npc_id: "garrick", topic: "theft" },
    rows: 1,
    ms: 1.9,
  },
];

export function getInitialTownState(): TownState {
  return {
    tick: 3,
    selectedNpcId: "garrick",
    npcs: JSON.parse(JSON.stringify(INITIAL_NPCS)),
    graphNodes: JSON.parse(JSON.stringify(INITIAL_GRAPH_NODES)),
    graphEdges: JSON.parse(JSON.stringify(INITIAL_GRAPH_EDGES)),
    events: JSON.parse(JSON.stringify(INITIAL_EVENTS)),
    dialogueHistory: JSON.parse(JSON.stringify(INITIAL_DIALOGUES)),
    activeProvenance: INITIAL_DIALOGUES.garrick[0]?.provenance,
    activePathEdgeIds: ["e1"],
    recentTraces: [...INITIAL_TRACES],
  };
}

export function advanceSimulationTick(state: TownState): ToolEnvelope<TownState> {
  const newTick = state.tick + 1;
  const newNpcs = state.npcs.map((npc) => ({ ...npc }));
  const newEdges = [...state.graphEdges];
  const newNodes = state.graphNodes.map((n) => ({ ...n }));
  const traces: TraceStep[] = [];

  // Gossip hop: Garrick tells Captain Vane about relic theft if Vane doesn't know
  const vane = newNpcs.find((n) => n.id === "captain_vane");
  let vaneHeard = false;

  if (vane && vane.knowledgeState === "none") {
    vane.knowledgeState = "heard";
    vane.attitude = "wary";
    vane.attitudeScore = -0.45;
    vane.primaryRumor = {
      eventId: "event_relic_theft",
      eventTitle: "Theft of the Sun-Stone Relic",
      eventType: "harm",
      confidence: 0.64, // 0.85 * 0.75
      hops: 2,
      heardFromId: "garrick",
      heardFromName: "Garrick Vance",
      eyewitnessId: "martha",
      eyewitnessName: "Martha Finch",
    };
    vaneHeard = true;

    // Update node attitude
    const vaneNode = newNodes.find((n) => n.id === "captain_vane");
    if (vaneNode) vaneNode.attitude = "wary";
  }

  // Record realistic TraceSteps
  traces.push({
    agent: "system",
    tool: "advance_time",
    queryId: "Q33_advance_world_tick",
    args: { new_tick: newTick },
    rows: 1,
    ms: 2.1,
  });

  traces.push({
    agent: "gossip",
    tool: "spread_gossip",
    queryId: "Q40_gossip_candidates",
    args: { tick: newTick, min_confidence: 0.5 },
    rows: vaneHeard ? 2 : 1,
    ms: 3.8,
  });

  if (vaneHeard) {
    traces.push({
      agent: "npc",
      tool: "update_attitude",
      queryId: "Q05_decay_credibility",
      args: { source: "garrick", target: "captain_vane", decay: 0.75 },
      rows: 1,
      ms: 1.6,
    });
  }

  // Update dialogues if Vane learned
  const newDialogues = { ...state.dialogueHistory };
  if (vaneHeard) {
    newDialogues.captain_vane = [
      ...(newDialogues.captain_vane || []),
      {
        id: `v_update_${newTick}`,
        sender: "npc",
        npcId: "captain_vane",
        text: "Halt right there. Garrick just informed the Watch that Martha witnessed the Sun-Stone robbery. You match the description.",
        timestamp: "Just now",
        groundedInKnowledge: true,
        provenance: {
          eventId: "event_relic_theft",
          eventTitle: "Theft of the Sun-Stone Relic",
          eventType: "harm",
          witnessId: "martha",
          witnessName: "Martha Finch",
          hops: [
            {
              npcId: "martha",
              npcName: "Martha Finch",
              avatarInitials: "MF",
              role: "Tavernkeeper",
              faction: "townsfolk",
              confidence: 1.0,
              step: 0,
              isWitness: true,
            },
            {
              npcId: "garrick",
              npcName: "Garrick Vance",
              avatarInitials: "GV",
              role: "Blacksmith",
              faction: "townsfolk",
              confidence: 0.85,
              step: 1,
              isWitness: false,
            },
            {
              npcId: "captain_vane",
              npcName: "Captain Vane",
              avatarInitials: "CV",
              role: "Watch Commander",
              faction: "guard",
              confidence: 0.64,
              step: 2,
              isWitness: false,
            },
          ],
          totalDecay: 0.36,
          hopCount: 2,
        },
      },
    ];
  }

  const updatedState: TownState = {
    ...state,
    tick: newTick,
    npcs: newNpcs,
    graphNodes: newNodes,
    graphEdges: newEdges,
    dialogueHistory: newDialogues,
    recentTraces: [...traces, ...state.recentTraces].slice(0, 10),
  };

  return {
    ok: true,
    data: updatedState,
    trace: traces,
  };
}

export function sendMockDialogue(
  npcId: string,
  userMessage: string,
  state: TownState
): ToolEnvelope<{ message: DialogueMessage; updatedState: TownState }> {
  const npc = state.npcs.find((n) => n.id === npcId);
  const traces: TraceStep[] = [];

  if (!npc) {
    return {
      ok: false,
      error: { code: "UNKNOWN_NPC", message: `NPC with id "${npcId}" was not found in the world graph.` },
    };
  }

  traces.push({
    agent: "scribe",
    tool: "resolve_npc",
    queryId: "Q01_resolve_npc",
    args: { npc_id: npcId },
    rows: 1,
    ms: 1.2,
  });

  traces.push({
    agent: "npc",
    tool: "filter_knowledge",
    queryId: "Q22_filter_knowledge_firewall",
    args: { npc_id: npcId, message_keywords: userMessage.slice(0, 20) },
    rows: npc.primaryRumor ? 1 : 0,
    ms: 2.4,
  });

  let replyText = "";
  let provenance: ProvenanceChain | undefined = undefined;

  if (npc.knowledgeState === "none") {
    replyText = `I have no quarrel with you, stranger, but I haven't heard any town talk regarding your deeds.`;
  } else if (npc.knowledgeState === "eyewitness" && npc.primaryRumor) {
    const rumor = npc.primaryRumor;
    if (rumor.eventType === "help") {
      replyText = `I saw your kindness with my own eyes when you aided us. You have my gratitude and respect.`;
    } else {
      replyText = `I saw what happened at the chapel myself. Don't try to deny it to my face.`;
    }
    provenance = {
      eventId: rumor.eventId,
      eventTitle: rumor.eventTitle,
      eventType: rumor.eventType,
      witnessId: npc.id,
      witnessName: npc.name,
      hops: [
        {
          npcId: npc.id,
          npcName: npc.name,
          avatarInitials: npc.avatarInitials,
          role: npc.role,
          faction: npc.faction,
          confidence: 1.0,
          step: 0,
          isWitness: true,
        },
      ],
      totalDecay: 0.0,
      hopCount: 0,
    };
  } else {
    // Hearsay
    const rumor = npc.primaryRumor;
    if (rumor) {
      replyText = `${rumor.heardFromName || "Someone"} told me about the ${rumor.eventTitle.toLowerCase()}. They seemed quite sure, but I wasn't there in person.`;
      const witness = state.npcs.find((n) => n.id === rumor.eyewitnessId) || npc;
      provenance = {
        eventId: rumor.eventId,
        eventTitle: rumor.eventTitle,
        eventType: rumor.eventType,
        witnessId: rumor.eyewitnessId,
        witnessName: rumor.eyewitnessName,
        hops: [
          {
            npcId: witness.id,
            npcName: witness.name,
            avatarInitials: witness.avatarInitials,
            role: witness.role,
            faction: witness.faction,
            confidence: 1.0,
            step: 0,
            isWitness: true,
          },
          {
            npcId: npc.id,
            npcName: npc.name,
            avatarInitials: npc.avatarInitials,
            role: npc.role,
            faction: npc.faction,
            confidence: rumor.confidence,
            step: 1,
            isWitness: false,
          },
        ],
        totalDecay: Number((1.0 - rumor.confidence).toFixed(2)),
        hopCount: rumor.hops,
      };
    }
  }

  const userMsg: DialogueMessage = {
    id: `u_${Date.now()}`,
    sender: "player",
    text: userMessage,
    timestamp: "Just now",
    groundedInKnowledge: true,
  };

  const npcMsg: DialogueMessage = {
    id: `npc_${Date.now() + 1}`,
    sender: "npc",
    npcId: npc.id,
    text: replyText,
    timestamp: "Just now",
    groundedInKnowledge: true,
    provenance,
  };

  const currentDialogue = state.dialogueHistory[npcId] || [];
  const updatedDialogue = [...currentDialogue, userMsg, npcMsg];

  const updatedState: TownState = {
    ...state,
    dialogueHistory: {
      ...state.dialogueHistory,
      [npcId]: updatedDialogue,
    },
    activeProvenance: provenance,
    recentTraces: [...traces, ...state.recentTraces].slice(0, 10),
  };

  return {
    ok: true,
    data: { message: npcMsg, updatedState },
    trace: traces,
  };
}
