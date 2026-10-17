"use client";
import { GraphPanel } from "../GraphPanel";
import { TracePanel } from "../TracePanel";
import { Button } from "../ui/button";
import type { TownState, ProvenanceChain } from "../../lib/types";

export function EngineSheet({ town, selected, why, onSelect, onCompare }: {
  town: TownState; selected: string; why?: ProvenanceChain;
  onSelect: (id: string) => void; onCompare: () => void;
}) {
  return <div className="space-y-5">
    <p className="text-sm text-text-secondary">Live FalkorDB tools. Whispers and evidence come from confirmed responses.</p>
    <div className="engine-graph"><GraphPanel nodes={town.graphNodes} edges={town.graphEdges} selectedNpcId={selected} activePathEdgeIds={why?.edgeIds ?? []} onSelectNode={(id) => onSelect(id.replace("NPC:", ""))} /></div>
    <TracePanel traces={town.recentTraces} />
    <details><summary>Exact attitude scores</summary>{town.npcs.map((npc) => <p className="font-mono text-xs" key={npc.id}>{npc.name}: {npc.attitudeScore.toFixed(6)} ({npc.attitude})</p>)}</details>
    <details><summary>Recorded event weights</summary>{town.events.map((event) => <p className="font-mono text-xs" key={event.id}>{event.title}: {event.weight ?? "Not available in this specimen"}</p>)}</details>
    <Button variant="secondary" onClick={onCompare}>Compare knowledge boundaries</Button>
    <p className="text-xs text-text-secondary">Template replies may show no vocabulary leak. Comparison reports actual outcomes only.</p>
  </div>;
}
