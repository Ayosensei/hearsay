"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { MemoryWorld } from "./MemoryWorld";
import { GraphPeek } from "./GraphPeek";
import type { TownState, ProvenanceChain } from "../../lib/types";

export function MemorySpecimens({ town }: { town: TownState }) {
  const [empty, setEmpty] = useState(false);
  const [selected, setSelected] = useState("garrick");
  const [why, setWhy] = useState<ProvenanceChain>();
  const eventId = "ev_graph_specimen";
  const route = ["brom", "mira", "garrick"];
  const example: TownState = { ...town, tick: 2,
    npcs: town.npcs.map((npc) => ({ ...npc, rumors: !empty && route.includes(npc.id) ? [{ eventId, eventTitle: "Iron sword stolen", eventType: "harm", confidence: [1, .9, .63][route.indexOf(npc.id)], hops: route.indexOf(npc.id), heardFromId: route[route.indexOf(npc.id) - 1], eyewitnessId: "brom", eyewitnessName: "Brom", path: [], tickOccurred: 0 }] : [] })),
    events: empty ? [] : [{ id: eventId, title: "Iron sword stolen", description: "Iron sword stolen", type: "harm", weight: -.8, witnessId: "brom", witnessName: "Brom", placeName: "Brom's Forge", tickOccurred: 0 }],
    graphNodes: [...town.npcs.map((npc) => ({ id: `NPC:${npc.id}`, type: "npc" as const, label: npc.name, avatarInitials: npc.avatarInitials })), { id: `Event:${eventId}`, type: "event", label: "Iron sword stolen", eventType: "harm" }],
    graphEdges: empty ? [] : [
      ...route.map((id, index) => ({ id: `KNOWS:NPC:${id}->Event:${eventId}:${eventId}`, source: `NPC:${id}`, target: `Event:${eventId}`, type: "KNOWS" as const, confidence: [1, .9, .63][index] })),
      ...route.slice(1).map((id, index) => ({ id: `TOLD:NPC:${route[index]}->NPC:${id}:${eventId}`, source: `NPC:${route[index]}`, target: `NPC:${id}`, type: "TOLD" as const, confidence: [.9, .63][index] })),
    ],
  };
  function explain() {
    if (!route.includes(selected)) return;
    const stops = route.slice(0, route.indexOf(selected) + 1);
    setWhy({ eventId, eventTitle: "Iron sword stolen", eventType: "harm", witnessId: "brom", witnessName: "Brom", totalDecay: .37, hopCount: stops.length - 1,
      edgeIds: example.graphEdges.filter((edge) => edge.type === "TOLD" ? stops.some((id, index) => index > 0 && edge.target === `NPC:${id}`) : edge.source === `NPC:${selected}`).map((edge) => edge.id),
      hops: stops.map((id, index) => ({ npcId: id, npcName: town.npcs.find((npc) => npc.id === id)?.name ?? id, avatarInitials: id.slice(0, 2), role: "Specimen", faction: "townsfolk", confidence: [1, .9, .63][index], step: index, isWitness: index === 0 })) });
  }
  return <section className="space-y-4"><h2 className="font-serif text-4xl">Visible memory graph</h2><p>Synthetic specimens: empty town, known or unaware villager, and an explain highlight.</p>
    <Button onClick={() => { setEmpty(!empty); setWhy(undefined); }}>Toggle empty graph</Button>
    <div className="peek-specimen"><GraphPeek town={example} eventId={eventId} onOpen={() => setSelected("garrick")} /></div>
    <div className="living-town memory-specimen"><MemoryWorld town={example} eventId={empty ? "" : eventId} selected={selected} why={why} activeEdges={[]} busy={false} onEvent={() => {}} onSelect={(id) => { setSelected(id); setWhy(undefined); }} onExplain={explain} onTalk={() => {}} /></div>
  </section>;
}
