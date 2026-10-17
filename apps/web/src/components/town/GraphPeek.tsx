"use client";
import { Button } from "../ui/button";
import { memoryGraph } from "../../lib/memory-graph";
import type { TownState } from "../../lib/types";

export function GraphPeek({ town, eventId, onOpen }: { town: TownState; eventId: string; onOpen: () => void }) {
  const graph = memoryGraph(town, eventId);
  const points = new Map(graph.nodes.map((node) => [node.id, node]));
  return <Button variant="ghost" className="graph-peek" onClick={onOpen} aria-label="Open live FalkorDB memory graph">
    <svg viewBox="0 0 1000 620" aria-hidden="true">{graph.edges.map((edge) => { const a = points.get(edge.source), b = points.get(edge.target); return a && b ? <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> : null; })}{graph.nodes.map((node) => <circle key={node.id} cx={node.x} cy={node.y} r={node.type === "event" ? 24 : 15} />)}</svg>
    <span><strong>FalkorDB memory</strong><small>{town.npcs.filter((npc) => npc.rumors.some((memory) => memory.eventId === eventId)).length} know this deed · Open graph</small></span>
  </Button>;
}
