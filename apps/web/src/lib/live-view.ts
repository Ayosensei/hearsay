import type { ToolOutput } from "@hearsay/contract";
import type { NPC, TownEvent, GraphNode, GraphEdge, ProvenanceChain } from "./types";

export const initials = (name: string) => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2);
export const faction = (value: string): NPC["faction"] =>
  value === "guard" || value === "merchants" ? value : "townsfolk";
const coordinates: Record<string, [number, number]> = {
  brom: [120, 170], mira: [290, 180], garrick: [480, 120],
  ayla: [120, 320], fenn: [320, 330], tilda: [500, 300],
};

export function mapEvents(snapshot: ToolOutput<"snapshot">): TownEvent[] {
  return snapshot.nodes.filter((node) => node.kind === "Event").map((node): TownEvent => {
    const placeId = snapshot.edges.find((edge) => edge.type === "HAPPENED_AT" && edge.from === node.id)?.to;
    const witness = snapshot.edges.find((edge) => edge.type === "KNOWS" && edge.to === node.id && edge.props.via === "witness")?.from;
    const name = snapshot.nodes.find((candidate) => candidate.id === witness)?.label ?? "Witness";
    const subject = String(node.props.subject ?? "something");
    const titles: Record<string, string> = {
      stole: `${subject} stolen`, attacked: `Attacked ${subject}`, lied: `Lied about ${subject}`,
      helped: `Helped with ${subject}`, donated: `Donated ${subject}`, saved: `Saved ${subject}`, traded: `Traded ${subject}`,
    };
    const sentence = titles[String(node.props.type)] ?? `${String(node.props.type)} ${subject}`;
    const title = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    return {
      id: node.id.slice("Event:".length), title, description: title,
      weight: Number(node.props.weight),
      type: Number(node.props.weight) < 0 ? "harm" : "help",
      witnessId: witness?.slice("NPC:".length) ?? "", witnessName: name,
      placeName: snapshot.nodes.find((candidate) => candidate.id === placeId)?.label ?? "",
      tickOccurred: Number(node.props.tick),
    };
  }).sort((a, b) => b.tickOccurred - a.tickOccurred || b.id.localeCompare(a.id));
}

export function mapGraph(snapshot: ToolOutput<"snapshot">, npcs: NPC[]) {
  const nodes: GraphNode[] = snapshot.nodes.filter((node) => ["NPC", "Event", "Player"].includes(node.kind)).map((node, index) => {
    const npc = npcs.find((candidate) => `NPC:${candidate.id}` === node.id);
    const angle = 2 * Math.PI * npcs.findIndex((person) => person.id === npc?.id) / npcs.length - Math.PI / 2;
    const point = npc && npcs.length > 6 ? [320 + 250 * Math.cos(angle), 220 + 170 * Math.sin(angle)]
      : coordinates[npc?.id ?? ""] ?? [80 + (index % 5) * 100, node.kind === "Player" ? 410 : 45];
    return {
      id: node.id, label: node.kind === "Event" ? `${String(node.props.type)} ${String(node.props.subject ?? "")}`.trim() : node.label,
      type: node.kind === "NPC" ? "npc" : node.kind === "Player" ? "player" : "event",
      avatarInitials: npc?.avatarInitials, faction: npc?.faction, attitude: npc?.attitude,
      eventType: Number(node.props.weight) < 0 ? "harm" : "help", x: point[0], y: point[1],
    };
  });
  const visible = new Set(nodes.map((node) => node.id));
  const edges: GraphEdge[] = snapshot.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to)).map((edge) => ({
    id: edge.id, source: edge.from, target: edge.to,
    type: edge.type, weight: typeof edge.props.weight === "number" ? edge.props.weight : undefined,
    confidence: typeof edge.props.confidence === "number" ? edge.props.confidence : undefined,
  }));
  return { graphNodes: nodes, graphEdges: edges };
}

export function mapExplanation(why: ToolOutput<"explain">, event: TownEvent, npcs: NPC[]): ProvenanceChain | undefined {
  if (why.status === "not_in_graph") return undefined;
  return {
    eventId: event.id, eventTitle: event.title, eventType: event.type,
    witnessId: why.chain[0]?.npcId ?? "", witnessName: why.chain[0]?.name ?? "",
    hops: why.chain.map((person, step) => {
      const npc = npcs.find((candidate) => candidate.id === person.npcId);
      return { npcId: person.npcId, npcName: person.name, avatarInitials: initials(person.name),
        role: npc?.role ?? "", faction: npc?.faction ?? "townsfolk",
        confidence: step === 0 ? 1 : (why.hopConfidences[step - 1] ?? 0), step, isWitness: step === 0 };
    }),
    totalDecay: 1 - (why.hopConfidences.at(-1) ?? 1), hopCount: why.hopConfidences.length,
    edgeIds: why.edgeIds,
  };
}
