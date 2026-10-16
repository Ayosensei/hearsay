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

/** Synthetic Hollowbrook fixtures. Behaviour lives in mock-engine.ts / gossip.ts. */

const RELIC_BY_MARTHA: RumorKnowledge = {
  eventId: "event_relic_theft",
  eventTitle: "Theft of the Sun-Stone Relic",
  eventType: "harm",
  confidence: 1.0,
  hops: 0,
  eyewitnessId: "martha",
  eyewitnessName: "Martha Finch",
  path: ["martha"],
  tickOccurred: 1,
};

const HERBS_BY_BARTHOLOMEW: RumorKnowledge = {
  eventId: "event_herbs_help",
  eventTitle: "Delivery of Fever-Herbs",
  eventType: "help",
  confidence: 1.0,
  hops: 0,
  eyewitnessId: "bartholomew",
  eyewitnessName: "Bartholomew",
  path: ["bartholomew"],
  tickOccurred: 2,
};

/** Rumor as heard second-hand from Martha over a TRUSTS edge. */
const relicHeardBy = (npcId: string, confidence: number): RumorKnowledge => ({
  ...RELIC_BY_MARTHA,
  confidence,
  hops: 1,
  heardFromId: "martha",
  heardFromName: "Martha Finch",
  path: ["martha", npcId],
});

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
    rumors: [RELIC_BY_MARTHA],
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
    rumors: [relicHeardBy("garrick", 0.85)],
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
    rumors: [],
  },
  {
    id: "bartholomew",
    name: "Bartholomew",
    role: "Master Herbalist",
    faction: "merchants",
    avatarInitials: "BA",
    attitude: "friendly",
    attitudeScore: 0.55,
    knowledgeState: "eyewitness",
    rumors: [HERBS_BY_BARTHOLOMEW],
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
    rumors: [relicHeardBy("lyra", 0.9)],
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
  { id: "martha", label: "Martha", avatarInitials: "MF", type: "npc", faction: "townsfolk", attitude: "wary", x: 180, y: 140 },
  { id: "garrick", label: "Garrick", avatarInitials: "GV", type: "npc", faction: "townsfolk", attitude: "wary", x: 340, y: 160 },
  { id: "captain_vane", label: "Capt. Vane", avatarInitials: "CV", type: "npc", faction: "guard", attitude: "neutral", x: 500, y: 220 },
  { id: "bartholomew", label: "Bartholomew", avatarInitials: "BA", type: "npc", faction: "merchants", attitude: "friendly", x: 260, y: 320 },
  { id: "lyra", label: "Lyra", avatarInitials: "LS", type: "npc", faction: "merchants", attitude: "neutral", x: 120, y: 270 },
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

/** Opening lines. Provenance is derived from what each NPC actually knows. */
const SEED_LINES: Record<string, { text: string; timestamp: string }> = {
  martha: {
    text: "I keep my taproom doors open to all, stranger, but I saw what happened at the chapel vault. I don't forget faces.",
    timestamp: "10:14 PM",
  },
  garrick: {
    text: "Look, Martha told me someone slipped out of the vault with the relic. If it was you, keep your hands off my forge tools.",
    timestamp: "10:18 PM",
  },
  captain_vane: {
    text: "State your business in Hollowbrook. Keep the peace and we won't have problems. I haven't heard anything to suspect you yet.",
    timestamp: "10:20 PM",
  },
  bartholomew: {
    text: "Bless you, friend! The children would not have survived the fever without those Blackwood marsh-herbs you brought.",
    timestamp: "10:22 PM",
  },
  lyra: {
    text: "Packages, gossip, letters—everything moves through me. Martha mentioned some trouble at the chapel. Best watch your step.",
    timestamp: "10:24 PM",
  },
};

export const INITIAL_TRACES: TraceStep[] = [
  { agent: "scribe", tool: "load_world_state", queryId: "Q01_load_player_graph", args: { player_id: "player_default" }, rows: 12, ms: 4.2 },
  { agent: "gossip", tool: "gossip_step", queryId: "Q40_gossip_candidates", args: { max_hops: 2, min_confidence: 0.6 }, rows: 8, ms: 3.1 },
  { agent: "npc", tool: "check_knowledge_firewall", queryId: "Q22_filter_knowledge_firewall", args: { npc_id: "garrick", topic: "theft" }, rows: 1, ms: 1.9 },
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
