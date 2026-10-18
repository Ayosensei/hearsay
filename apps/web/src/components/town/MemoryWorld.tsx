"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { MemoryCanvas } from "./MemoryCanvas";
import { memoryText } from "./TownStage";
import type { TownState, ProvenanceChain } from "../../lib/types";
import type { ReactNode } from "react";
import "./memory.css";

export function MemoryWorld({ town, eventId, selected, why, activeEdges, busy, objective, textOnly = false, onEvent, onSelect, onExplain, onTalk }: {
  town: TownState; eventId: string; selected: string; why?: ProvenanceChain; activeEdges: string[]; busy: boolean;
  objective?: ReactNode; onEvent: (id: string) => void; onSelect: (id: string) => void;
  textOnly?: boolean;
  onExplain: () => void; onTalk: () => void;
}) {
  const [trust, setTrust] = useState(Boolean(town.puzzle?.fog));
  const npc = town.npcs.find((person) => person.id === selected);
  const evidence = why?.eventId === eventId ? why : undefined;
  const highlighted = evidence?.edgeIds ?? activeEdges.filter((id) => id.endsWith(`:${eventId}`));
  const known = npc?.rumors.find((memory) => memory.eventId === eventId);
  return <section className="memory-world" aria-label="FalkorDB memory view">
    <header><div><p className="memory-brand">FalkorDB · {town.puzzle?.fog ? "public trust network" : "live player graph"}</p><h1>{town.puzzle?.fog ? <>Plan the next <em>whisper.</em></> : <>Watch a reputation <em>form.</em></>}</h1></div><p>Turn {town.tick} · {town.npcs.length} villagers</p></header>
    <div className="memory-controls"><label>Following<select aria-label="Memory graph deed" value={eventId} onChange={(event) => onEvent(event.target.value)}><option value="">Choose a deed</option>{town.events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label><Button variant="secondary" aria-pressed={trust} onClick={() => setTrust(!trust)}>Trust links: {trust ? "on" : "off"}</Button></div>
    {!town.events.length && <p className="memory-empty">No deeds yet. Take an action in town; its event and witness links will appear here.</p>}
    <div className="memory-layout"><div className="memory-drawing">{textOnly ? <ul className="memory-text">{town.npcs.map((person) => <li key={person.id}><strong>{person.name}</strong>: {memoryText(person, eventId)}</li>)}</ul> : <MemoryCanvas town={town} eventId={eventId} selected={selected} trust={trust} highlighted={highlighted} onSelect={onSelect} />}<p className="memory-legend">{town.puzzle?.fog ? "Arrows: trusts · Percentages: links touching the selected villager · Ring: body language" : <><span>Gold: witness</span> · Dashed: remembers · Blue arrow: told · Ring: attitude</>}</p></div>
      <aside><label>Inspect a villager<select aria-label="Inspect graph villager" value={selected} onChange={(event) => onSelect(event.target.value)}>{town.npcs.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
        {npc && <><h2>{npc.name}</h2><p className={`memory-mood attitude-${npc.attitude}`}>{npc.attitude}</p><p>{eventId ? memoryText(npc, eventId) : "Choose a deed to inspect their memory."}</p>
          <Button disabled={busy || !eventId || town.puzzle?.fog} onClick={onExplain}>Follow this memory{town.puzzle?.fog ? " · after verdict" : ""}</Button><Button variant="ghost" disabled={busy} onClick={onTalk}>{town.puzzle?.fog ? "Question" : "Talk to"} {npc.name}</Button>
          {evidence && <p className="memory-path">{evidence.hops.map((hop) => hop.npcName).join(" → ")}</p>}
          {eventId && !known && <p className="memory-note">{town.puzzle?.fog ? "Private memory. Questions cost 1 AP and add a dated clue to your notebook." : "No memory path for this deed. The NPC has not learned it."}</p>}
        </>}{objective}<p className="memory-note">{town.puzzle?.fog ? "Only public TRUSTS links are visible. Arrows point from the person who trusts to the person trusted; gossip travels the opposite way. Multiply trust along that direction to predict confidence." : "Nodes and links come from this player's graph snapshot. Explain highlights the recorded path; Gemini does not draw or explain it."}</p>
      </aside></div>
  </section>;
}
