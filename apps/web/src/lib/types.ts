export type AgentType = "scribe" | "gossip" | "npc" | "system";

export type FactionType = "townsfolk" | "guard" | "merchants";

export type AttitudeType = "hostile" | "wary" | "neutral" | "friendly" | "devoted";

export type KnowledgeStateType = "none" | "heard" | "eyewitness";

export type EventType = "harm" | "help";

export interface TraceStep {
  agent: AgentType;
  tool: string;
  queryId: string;
  args: Record<string, unknown>;
  rows: number;
  ms: number;
}

export type ToolEnvelope<T> =
  | { ok: true; data: T; trace: TraceStep[] }
  | { ok: false; error: { code: string; message: string } };

export interface RumorKnowledge {
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  confidence: number;
  hops: number;
  heardFromId?: string;
  heardFromName?: string;
  eyewitnessId: string;
  eyewitnessName: string;
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  faction: FactionType;
  avatarInitials: string;
  attitude: AttitudeType;
  attitudeScore: number; // -1.0 to +1.0
  knowledgeState: KnowledgeStateType;
  primaryRumor?: RumorKnowledge;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "npc" | "event" | "player";
  faction?: FactionType;
  attitude?: AttitudeType;
  eventType?: EventType;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "TRUSTS" | "WITNESSED" | "HEARD";
  weight?: number;
  confidence?: number;
}

export interface ProvenanceHop {
  npcId: string;
  npcName: string;
  avatarInitials: string;
  role: string;
  faction: FactionType;
  confidence: number;
  step: number;
  isWitness: boolean;
}

export interface ProvenanceChain {
  eventId: string;
  eventTitle: string;
  eventType: EventType;
  witnessId: string;
  witnessName: string;
  hops: ProvenanceHop[];
  totalDecay: number;
  hopCount: number;
}

export interface DialogueMessage {
  id: string;
  sender: "player" | "npc";
  npcId?: string;
  text: string;
  timestamp: string;
  groundedInKnowledge: boolean;
  provenance?: ProvenanceChain;
}

export interface TownEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  witnessId: string;
  witnessName: string;
  placeName: string;
  tickOccurred: number;
}

export interface TownState {
  tick: number;
  selectedNpcId: string;
  npcs: NPC[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  events: TownEvent[];
  dialogueHistory: Record<string, DialogueMessage[]>;
  activeProvenance?: ProvenanceChain;
  activePathEdgeIds: string[];
  recentTraces: TraceStep[];
}
