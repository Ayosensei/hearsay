import {
  AttitudeType,
  GraphEdge,
  GraphNode,
  NPC,
  ProvenanceChain,
  RumorKnowledge,
} from "./types";

/**
 * Pure helpers for the mock engine. They mirror what the real engine does with
 * graph queries (TRUSTS traversal, per-hop decay, explain-path), so the UI is
 * exercised against realistic behaviour until packages/hearsay is wired in.
 */

/** Rumors weaker than this are not worth repeating (mirrors the gossip cutoff). */
export const MIN_CONFIDENCE = 0.5;

/** How strongly a freshly heard rumor moves an attitude (confidence x this). */
export const ATTITUDE_SHIFT = 0.7;

export const round2 = (n: number): number => Math.round(n * 100) / 100;

export function attitudeFromScore(score: number): AttitudeType {
  if (score > 0.6) return "devoted";
  if (score > 0.2) return "friendly";
  if (score > -0.2) return "neutral";
  if (score > -0.6) return "wary";
  return "hostile";
}

export function clampScore(score: number): number {
  return round2(Math.max(-1, Math.min(1, score)));
}

/** Newest event wins; ties go to the more credible rumor, then to the one learned last. */
export function pickHeadline(rumors: RumorKnowledge[]): RumorKnowledge | undefined {
  return rumors
    .map((rumor, learnedAt) => ({ rumor, learnedAt }))
    .sort(
      (a, b) =>
        b.rumor.tickOccurred - a.rumor.tickOccurred ||
        b.rumor.confidence - a.rumor.confidence ||
        b.learnedAt - a.learnedAt
    )[0]?.rumor;
}

/** Re-derive headline rumor and knowledge state after `rumors` changed. */
export function deriveNpc(npc: NPC): NPC {
  const primaryRumor = pickHeadline(npc.rumors);
  const knowledgeState = !primaryRumor
    ? "none"
    : primaryRumor.hops === 0
    ? "eyewitness"
    : "heard";
  return { ...npc, primaryRumor, knowledgeState };
}

/** Keep graph node tints in step with NPC attitudes. */
export function syncNodeAttitudes(nodes: GraphNode[], npcs: NPC[]): GraphNode[] {
  return nodes.map((node) => {
    const npc = npcs.find((n) => n.id === node.id);
    return npc ? { ...node, attitude: npc.attitude } : node;
  });
}

function trustWeight(edges: GraphEdge[], from: string, to: string): number {
  const edge = edges.find((e) => e.type === "TRUSTS" && e.source === from && e.target === to);
  return edge?.weight ?? 1;
}

/** Walk the rumor's path and rebuild the per-hop confidences (the "Why?" chain). */
export function buildProvenance(
  rumor: RumorKnowledge,
  npcs: NPC[],
  edges: GraphEdge[]
): ProvenanceChain {
  let confidence = 1;
  const hops = rumor.path.flatMap((npcId, step) => {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return [];
    if (step > 0) confidence = round2(confidence * trustWeight(edges, rumor.path[step - 1], npcId));
    return [
      {
        npcId,
        npcName: npc.name,
        avatarInitials: npc.avatarInitials,
        role: npc.role,
        faction: npc.faction,
        confidence,
        step,
        isWitness: step === 0,
      },
    ];
  });

  return {
    eventId: rumor.eventId,
    eventTitle: rumor.eventTitle,
    eventType: rumor.eventType,
    witnessId: rumor.eyewitnessId,
    witnessName: rumor.eyewitnessName,
    hops,
    totalDecay: round2(1 - confidence),
    hopCount: Math.max(0, hops.length - 1),
  };
}

/** TRUSTS edges that connect consecutive hops, for highlighting the path in the graph. */
export function edgeIdsForPath(path: string[], edges: GraphEdge[]): string[] {
  return path.slice(1).flatMap((to, i) => {
    const edge = edges.find(
      (e) => e.type === "TRUSTS" && e.source === path[i] && e.target === to
    );
    return edge ? [edge.id] : [];
  });
}

export interface Spread {
  edgeId: string;
  fromId: string;
  toId: string;
  rumor: RumorKnowledge;
  /** True when the listener had never heard of this event before. */
  isNew: boolean;
}

/**
 * One gossip tick. Tellers speak from their pre-tick knowledge (one hop per tick);
 * each hop multiplies confidence by the TRUSTS weight and drops anything under
 * MIN_CONFIDENCE. A listener keeps the strongest version of each event.
 */
export function propagate(npcs: NPC[], edges: GraphEdge[]): { npcs: NPC[]; spreads: Spread[] } {
  const next = npcs.map((n) => ({ ...n, rumors: [...n.rumors] }));
  const spreads: Spread[] = [];

  for (const edge of edges) {
    if (edge.type !== "TRUSTS" || edge.weight === undefined) continue;
    const teller = npcs.find((n) => n.id === edge.source);
    const listener = next.find((n) => n.id === edge.target);
    if (!teller || !listener) continue;

    for (const rumor of teller.rumors) {
      if (rumor.path.includes(listener.id)) continue; // never echo back along the chain
      const confidence = round2(rumor.confidence * edge.weight);
      if (confidence < MIN_CONFIDENCE) continue;

      const existing = listener.rumors.find((r) => r.eventId === rumor.eventId);
      if (existing && existing.confidence >= confidence) continue;

      const heard: RumorKnowledge = {
        ...rumor,
        confidence,
        hops: rumor.hops + 1,
        heardFromId: teller.id,
        heardFromName: teller.name,
        path: [...rumor.path, listener.id],
      };
      listener.rumors = existing
        ? listener.rumors.map((r) => (r.eventId === rumor.eventId ? heard : r))
        : [...listener.rumors, heard];
      spreads.push({
        edgeId: edge.id,
        fromId: teller.id,
        toId: listener.id,
        rumor: heard,
        isNew: !existing,
      });
    }
  }

  return { npcs: next, spreads };
}
