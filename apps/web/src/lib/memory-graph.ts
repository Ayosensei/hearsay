import type { TownState } from "./types";

// This is a selected-deed view of snapshot IDs, not a new graph or gossip engine.
export function memoryGraph(town: TownState, eventId: string, trust = false) {
  const nodes = town.graphNodes.filter((node) => node.type === "npc" || node.id === `Event:${eventId}`);
  const ids = new Set(nodes.map((node) => node.id));
  const edges = town.graphEdges.filter((edge) => ids.has(edge.source) && ids.has(edge.target) &&
    (edge.type === "TRUSTS" ? trust : ["KNOWS", "TOLD"].includes(edge.type) && edge.id.endsWith(`:${eventId}`)));
  const people = nodes.filter((node) => node.type === "npc");
  return { edges, nodes: nodes.map((node) => {
    const angle = people.findIndex((person) => person.id === node.id) * Math.PI * 2 / Math.max(1, people.length) - Math.PI / 2;
    return { ...node, x: node.type === "event" ? 500 : 500 + 390 * Math.cos(angle),
      y: node.type === "event" ? 310 : 300 + 230 * Math.sin(angle) };
  }) };
}
