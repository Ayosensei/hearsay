"use client";
import { useId } from "react";
import { memoryGraph } from "../../lib/memory-graph";
import type { TownState } from "../../lib/types";

export function MemoryCanvas({ town, eventId, selected, trust, highlighted, onSelect }: {
  town: TownState; eventId: string; selected: string; trust: boolean;
  highlighted: string[]; onSelect: (id: string) => void;
}) {
  const marker = useId();
  const graph = memoryGraph(town, eventId, trust);
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  return <div className="memory-canvas"><svg viewBox="0 0 1000 620" role="group" aria-label="Live FalkorDB NPC memory graph">
    <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10" fill="context-stroke" /></marker></defs>
    {graph.edges.map((edge) => {
      const from = nodes.get(edge.source), to = nodes.get(edge.target);
      if (!from || !to) return null;
      const person = town.npcs.find((npc) => `NPC:${npc.id}` === edge.source);
      const witnessed = edge.type === "KNOWS" && person?.rumors.some((memory) => memory.eventId === eventId && memory.hops === 0);
      const active = highlighted.includes(edge.id);
      // Stop arrows at the visible node boundary so direction remains readable.
      const dx = to.x - from.x, dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const boundary = to.type === "event" ? Math.min(110 / Math.max(Math.abs(dx / length), .001), 32 / Math.max(Math.abs(dy / length), .001)) : 32;
      const path = `M${from.x} ${from.y} L${to.x - dx / length * boundary} ${to.y - dy / length * boundary}`;
      return <g key={edge.id} className={`memory-link link-${edge.type.toLowerCase()} ${witnessed ? "direct-witness" : ""} ${active ? "active" : ""} ${highlighted.length && !active ? "dimmed" : ""}`}>
        <title>{from.label} {edge.type === "TOLD" ? "told" : edge.type === "TRUSTS" ? "trusts" : "remembers"} {to.label}{edge.confidence !== undefined ? ` · ${Math.round(edge.confidence * 100)}% confidence` : ""}</title>
        <path d={path} markerEnd={`url(#${marker})`} />
        {edge.type === "TOLD" && <text x={(from.x + to.x) / 2 + 10} y={(from.y + to.y) / 2 - 20}>{Math.round((edge.confidence ?? 0) * 100)}%</text>}
      </g>;
    })}
    {graph.nodes.map((node) => {
      if (node.type === "event") return <g key={node.id} className={`memory-event event-${node.eventType}`} transform={`translate(${node.x},${node.y})`}>
        <rect x="-110" y="-32" width="220" height="64" rx="12" />
        <foreignObject x="-100" y="-26" width="200" height="52"><p>{node.label}</p></foreignObject>
      </g>;
      const npc = town.npcs.find((person) => `NPC:${person.id}` === node.id);
      const known = npc?.rumors.find((memory) => memory.eventId === eventId);
      return <g key={node.id} transform={`translate(${node.x},${node.y})`} className={`memory-person attitude-${npc?.attitude ?? "neutral"} ${selected === npc?.id ? "selected" : ""} ${known?.hops === 0 ? "origin" : ""}`}
        role="button" tabIndex={0} aria-label={`Inspect ${node.label}`} aria-pressed={selected === npc?.id} onClick={() => npc && onSelect(npc.id)} onKeyDown={(event) => { if (npc && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(npc.id); } }}>
        <title>{node.label} · {npc?.attitude} · {known ? known.hops === 0 ? "Witness" : `${Math.round(known.confidence * 100)}% sure` : "Unaware of this deed"}</title>
        <circle r="28" /><text className="memory-initials" y="5">{node.avatarInitials}</text><text className="memory-name" y="48">{node.label}</text>
      </g>;
    })}
  </svg></div>;
}
