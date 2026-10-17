import {
  DialogueMessage,
  GraphEdge,
  GraphNode,
  NPC,
  RumorKnowledge,
  TownEvent,
  TownState,
  TraceStep,
} from "./types";
import { buildProvenance, deriveNpc, edgeIdsForPath } from "./gossip";

/**
 * Locked Hollowbrook fixtures matching docs/shared/03-graph-model.md.
 * 6 NPCs, 6 places, locked TRUSTS weights, and canonical provenance paths.
 */

const RELIC_BY_BROM: RumorKnowledge = {
  eventId: "event_relic_theft",
  eventTitle: "Theft of the Sun-Stone Relic",
  eventType: "harm",
  confidence: 1.0,
  hops: 0,
  eyewitnessId: "brom",
  eyewitnessName: "Brom",
  path: ["brom"],
  tickOccurred: 1,
};

const HERBS_BY_AYLA: RumorKnowledge = {
  eventId: "event_herbs_help",
  eventTitle: "Delivery of Fever-Herbs",
  eventType: "help",
  confidence: 1.0,
  hops: 0,
  eyewitnessId: "ayla",
  eyewitnessName: "Sister Ayla",
  path: ["ayla"],
  tickOccurred: 2,
};

export const INITIAL_NPCS: NPC[] = [
  {
    id: "brom",
    name: "Brom",
    role: "Town Blacksmith (Brom's Forge)",
    faction: "townsfolk",
    avatarInitials: "BR",
    attitude: "wary",
    attitudeScore: -0.45,
    knowledgeState: "eyewitness",
    rumors: [RELIC_BY_BROM],
  },
  {
    id: "mira",
    name: "Mira",
    role: "Innkeeper (The Copper Kettle)",
    faction: "townsfolk",
    avatarInitials: "MI",
    attitude: "wary",
    attitudeScore: -0.36,
    knowledgeState: "heard",
    rumors: [
      {
        ...RELIC_BY_BROM,
        confidence: 0.9,
        hops: 1,
        heardFromId: "brom",
        heardFromName: "Brom",
        path: ["brom", "mira"],
      },
    ],
  },
  {
    id: "garrick",
    name: "Garrick",
    role: "Guard Captain (Guard Barracks)",
    faction: "guard",
    avatarInitials: "GA",
    attitude: "wary",
    attitudeScore: -0.28,
    knowledgeState: "heard",
    rumors: [
      {
        ...RELIC_BY_BROM,
        confidence: 0.63,
        hops: 2,
        heardFromId: "mira",
        heardFromName: "Mira",
        path: ["brom", "mira", "garrick"],
      },
    ],
  },
  {
    id: "fenn",
    name: "Old Fenn",
    role: "Informant & Beggar (Town Square)",
    faction: "townsfolk",
    avatarInitials: "OF",
    attitude: "wary",
    attitudeScore: -0.3,
    knowledgeState: "heard",
    rumors: [
      {
        ...RELIC_BY_BROM,
        confidence: 0.72,
        hops: 2,
        heardFromId: "mira",
        heardFromName: "Mira",
        path: ["brom", "mira", "fenn"],
      },
    ],
  },
  {
    id: "tilda",
    name: "Tilda",
    role: "Market Merchant (Market Row)",
    faction: "merchants",
    avatarInitials: "TI",
    attitude: "neutral",
    attitudeScore: 0.0,
    knowledgeState: "none",
    rumors: [],
  },
  {
    id: "ayla",
    name: "Sister Ayla",
    role: "Chapel Healer (Chapel of Ash)",
    faction: "townsfolk",
    avatarInitials: "SA",
    attitude: "friendly",
    attitudeScore: 0.55,
    knowledgeState: "eyewitness",
    rumors: [HERBS_BY_AYLA],
  },
];

export const INITIAL_EVENTS: TownEvent[] = [
  {
    id: "event_relic_theft",
    title: "Theft of the Sun-Stone Relic",
    description: "An ancient glowing artifact was stolen from Brom's Forge altar at twilight.",
    type: "harm",
    witnessId: "brom",
    witnessName: "Brom",
    placeName: "Brom's Forge",
    tickOccurred: 1,
  },
  {
    id: "event_herbs_help",
    title: "Delivery of Fever-Herbs",
    description: "The player gathered and delivered rare marsh herbs to save feverish town children.",
    type: "help",
    witnessId: "ayla",
    witnessName: "Sister Ayla",
    placeName: "Chapel of Ash",
    tickOccurred: 2,
  },
];

export const INITIAL_GRAPH_NODES: GraphNode[] = [
  { id: "brom", label: "Brom", avatarInitials: "BR", type: "npc", faction: "townsfolk", attitude: "wary", x: 150, y: 150 },
  { id: "mira", label: "Mira", avatarInitials: "MI", type: "npc", faction: "townsfolk", attitude: "wary", x: 310, y: 180 },
  { id: "garrick", label: "Garrick", avatarInitials: "GA", type: "npc", faction: "guard", attitude: "wary", x: 480, y: 150 },
  { id: "ayla", label: "Ayla", avatarInitials: "SA", type: "npc", faction: "townsfolk", attitude: "friendly", x: 150, y: 310 },
  { id: "fenn", label: "Fenn", avatarInitials: "OF", type: "npc", faction: "townsfolk", attitude: "wary", x: 310, y: 330 },
  { id: "tilda", label: "Tilda", avatarInitials: "TI", type: "npc", faction: "merchants", attitude: "neutral", x: 480, y: 310 },
  { id: "event_relic_theft", label: "Relic Stolen", type: "event", eventType: "harm", x: 80, y: 80 },
  { id: "event_herbs_help", label: "Herbs Delivered", type: "event", eventType: "help", x: 80, y: 380 },
];

export const INITIAL_GRAPH_EDGES: GraphEdge[] = [
  // Locked TRUSTS edges (listener -> teller : weight)
  { id: "e_mira_brom", source: "mira", target: "brom", type: "TRUSTS", weight: 0.9 },
  { id: "e_brom_mira", source: "brom", target: "mira", type: "TRUSTS", weight: 0.8 },
  { id: "e_fenn_mira", source: "fenn", target: "mira", type: "TRUSTS", weight: 0.8 },
  { id: "e_mira_fenn", source: "mira", target: "fenn", type: "TRUSTS", weight: 0.6 },
  { id: "e_garrick_mira", source: "garrick", target: "mira", type: "TRUSTS", weight: 0.7 },
  { id: "e_mira_garrick", source: "mira", target: "garrick", type: "TRUSTS", weight: 0.6 },
  { id: "e_tilda_fenn", source: "tilda", target: "fenn", type: "TRUSTS", weight: 0.5 },
  { id: "e_fenn_tilda", source: "fenn", target: "tilda", type: "TRUSTS", weight: 0.3 },
  { id: "e_ayla_mira", source: "ayla", target: "mira", type: "TRUSTS", weight: 0.6 },
  { id: "e_mira_ayla", source: "mira", target: "ayla", type: "TRUSTS", weight: 0.7 },
  { id: "e_tilda_garrick", source: "tilda", target: "garrick", type: "TRUSTS", weight: 0.5 },
  { id: "e_garrick_tilda", source: "garrick", target: "tilda", type: "TRUSTS", weight: 0.4 },
  { id: "e_ayla_brom", source: "ayla", target: "brom", type: "TRUSTS", weight: 0.5 },
  // Eyewitness WITNESSED links
  { id: "e_wit_brom", source: "brom", target: "event_relic_theft", type: "WITNESSED", weight: 1.0 },
  { id: "e_wit_ayla", source: "ayla", target: "event_herbs_help", type: "WITNESSED", weight: 1.0 },
];

/** Canonical seed lines grounded in graph knowledge. */
const SEED_LINES: Record<string, { text: string; timestamp: string }> = {
  brom: {
    text: "Keep your distance from my forge fire. I saw what you took from the altar with my own eyes.",
    timestamp: "10:14 PM",
  },
  mira: {
    text: "Brom stopped by the tavern right after it happened. If you took that relic, you've brought trouble to our town.",
    timestamp: "10:18 PM",
  },
  garrick: {
    text: "Mira reported the theft to the guard. If word reaches me that you're holding stolen goods, I'll have you in chains.",
    timestamp: "10:20 PM",
  },
  fenn: {
    text: "Old Fenn hears everything through the tavern shutters. Mira says you crossed Brom. Best watch your step.",
    timestamp: "10:22 PM",
  },
  tilda: {
    text: "Welcome to Market Row. State your business, stranger. I haven't heard anything about you yet.",
    timestamp: "10:24 PM",
  },
  ayla: {
    text: "Bless you, friend. The fever children in the chapel would not have lasted the night without those herbs.",
    timestamp: "10:26 PM",
  },
};

export const INITIAL_TRACES: TraceStep[] = [
  { agent: "scribe", tool: "load_world_state", queryId: "Q10_get_npcs", args: { player_id: "player_default" }, rows: 6, ms: 3.2 },
  { agent: "gossip", tool: "gossip_step", queryId: "Q40_gossip_candidates_all", args: { max_hops: 2, min_confidence: 0.25 }, rows: 8, ms: 2.8 },
  { agent: "npc", tool: "check_knowledge_firewall", queryId: "Q60_explain_knows", args: { npc_id: "garrick", event_id: "event_relic_theft" }, rows: 1, ms: 1.9 },
];

export function getInitialTownState(): TownState {
  const npcs = INITIAL_NPCS.map((npc) => deriveNpc(structuredClone(npc)));
  const graphEdges = structuredClone(INITIAL_GRAPH_EDGES);

  const dialogueHistory: Record<string, DialogueMessage[]> = {};
  for (const npc of npcs) {
    const line = SEED_LINES[npc.id];
    if (!line) continue;
    dialogueHistory[npc.id] = [
      {
        id: `seed_${npc.id}`,
        sender: "npc",
        npcId: npc.id,
        text: line.text,
        timestamp: line.timestamp,
        groundedInKnowledge: true,
        provenance: npc.primaryRumor ? buildProvenance(npc.primaryRumor, npcs, graphEdges) : undefined,
      },
    ];
  }

  const garrick = npcs.find((n) => n.id === "garrick");
  return {
    tick: 3,
    selectedNpcId: "garrick",
    npcs,
    graphNodes: structuredClone(INITIAL_GRAPH_NODES),
    graphEdges,
    events: structuredClone(INITIAL_EVENTS),
    dialogueHistory,
    activeProvenance: dialogueHistory.garrick?.[0]?.provenance,
    activePathEdgeIds: garrick?.primaryRumor
      ? edgeIdsForPath(garrick.primaryRumor.path, graphEdges)
      : [],
    recentTraces: [...INITIAL_TRACES],
  };
}
