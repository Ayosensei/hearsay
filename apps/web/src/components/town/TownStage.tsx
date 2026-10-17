"use client";
import { useEffect, useRef, useState } from "react";
import { Eye, Ear, Swords, Moon, Footprints } from "lucide-react";
import { Button } from "../ui/button";
import type { NPC, TownState, ProvenanceChain } from "../../lib/types";
import type { Beat } from "./use-living-town";
import { homes, homeOf, districtOf, districts, extraCast } from "../../lib/town-residents";
import type { District } from "../../lib/town-residents";
import "./expanded.css";

export { homes } from "../../lib/town-residents";
export function memoryText(person: NPC, eventId: string) {
  const memory = person.rumors.find((r) => r.eventId === eventId);
  return !memory ? "Has not heard about this deed" : memory.hops === 0 ? "Saw it happen · 100% sure"
    : `Heard from ${memory.heardFromName ?? memory.heardFromId} · ${Math.round(memory.confidence * 100)}% sure`;
}
interface Props { town: TownState; eventId: string; selected: string; beat?: Beat; why?: ProvenanceChain;
  lens: "none" | "bonds" | "whispers"; reduced: boolean; paused: boolean; quiet?: boolean; showSword?: boolean; onFocus?: (id: string) => void; onSelect: (id: string) => void; onSword: () => void }

export function TownStage({ town, eventId, selected, beat, why, lens, reduced, paused, quiet = false, showSword = true, onFocus, onSelect, onSword }: Props) {
  const [traveller, setTraveller] = useState({ x: 150, y: 710 });
  const [district, setDistrict] = useState<District>(districtOf(selected));
  const svg = useRef<SVGSVGElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const point = (id: string) => {
    const home = homeOf(id.replace("NPC:", ""));
    return home.district === district ? home : { x: 60, y: district === "riverside" ? 520 : 660 };
  };
  const locals = town.npcs.filter((npc) => districtOf(npc.id) === district);
  const road = district === "riverside" ? { min: 490, max: 550 } : { min: 610, max: 800 };
  useEffect(() => {
    const home = homes[selected];
    if (home) { setDistrict(home.district); setTraveller({ x: home.x - 140, y: home.y + 20 }); }
  }, [selected]);
  useEffect(() => {
    if (beat?.to) setDistrict(districtOf(beat.to));
  }, [beat?.id, beat?.to]);
  useEffect(() => {
    const element = stage.current;
    if (!element || !svg.current || element.clientWidth >= svg.current.clientWidth) return;
    element.scrollTo({ left: traveller.x / 1800 * svg.current.clientWidth - element.clientWidth / 2, behavior: reduced ? "instant" : "smooth" });
  }, [traveller, reduced]);
  const inDistrict = (id: string) => districtOf(id.replace("NPC:", "")) === district;
  const edges = town.graphEdges.filter((edge) => (inDistrict(edge.source) || inDistrict(edge.target)) && (lens === "bonds" ? edge.type === "TRUSTS"
    : lens === "whispers" && edge.type === "TOLD" && edge.id.endsWith(`:${eventId}`)));
  function move(event: React.KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    const keys: Record<string, [number, number]> = { ArrowLeft: [-35, 0], a: [-35, 0], ArrowRight: [35, 0], d: [35, 0], ArrowUp: [0, -20], w: [0, -20], ArrowDown: [0, 20], s: [0, 20] };
    const direction = keys[event.key]; if (!direction) return;
    event.preventDefault(); const speed = event.shiftKey ? 2 : 1;
    setTraveller((p) => ({ x: Math.max(60, Math.min(1740, p.x + direction[0] * speed)), y: Math.max(road.min, Math.min(road.max, p.y + direction[1] * speed)) }));
  }
  const deed = town.events.find((e) => e.id === eventId);
  return <div ref={stage} className={`town-stage ${reduced ? "still" : ""} ${paused ? "world-paused" : ""}`}>
    <svg ref={svg} viewBox="0 0 1800 900" className="town-panorama" role="group" aria-label="Hollowbrook. Focus the town and use arrow keys or WASD to walk. Walking does not create deeds."
      tabIndex={0} onKeyDown={move} onClick={(event) => {
        if (event.target !== event.currentTarget && (event.target as Element).tagName !== "image") return;
        const matrix = svg.current?.getScreenCTM(); if (!matrix) return;
        const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
        setTraveller({ x: Math.max(60, Math.min(1740, p.x)), y: Math.max(road.min, Math.min(road.max, p.y)) });
      }}>
      <defs>
        <marker id="bond-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="currentColor" /></marker>
        <filter id="paper-glow"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>
      <image key={district} href={districts[district].image} x="0" y="130" width="1800" height="600" aria-hidden="true" />
      <g className="town-clouds" aria-hidden="true"><path d="M450 180q60-30 120 0t120 0M1170 130q40-20 80 0t90 0" /></g>
      {beat && !reduced && <ellipse key={`pulse:${beat.id}`} cx="900" cy="650" rx="840" ry="180" className="turn-pulse" aria-hidden="true" />}
      {edges.map((edge) => {
        const a = point(edge.source), b = point(edge.target);
        return <g key={edge.id} className={lens === "bonds" ? "bond-line" : "whisper-history"}>
          <title>{lens === "bonds" ? `${town.npcs.find((n) => `NPC:${n.id}` === edge.source)?.name} trusts ${town.npcs.find((n) => `NPC:${n.id}` === edge.target)?.name}: ${Math.round((edge.weight ?? 0) * 100)}%` : `Confirmed gossip: ${edge.source.replace("NPC:", "")} told ${edge.target.replace("NPC:", "")}`}</title>
          <path d={`M${a.x} ${a.y - 100} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 240} ${b.x} ${b.y - 100}`} markerEnd="url(#bond-arrow)" />
        </g>;
      })}
      {why?.hops.slice(1).map((hop, index) => {
        if (!inDistrict(why.hops[index].npcId) && !inDistrict(hop.npcId)) return null;
        const a = point(why.hops[index].npcId), b = point(hop.npcId);
        return <path key={`evidence:${hop.npcId}`} className="evidence-thread" d={`M${a.x} ${a.y - 90} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 230} ${b.x} ${b.y - 90}`} />;
      })}
      {beat?.from && beat.to && (() => {
        const a = point(beat.from), b = point(beat.to);
        const path = `M${a.x} ${a.y - 90} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 240} ${b.x} ${b.y - 90}`;
        return <g key={`whisper:${beat.id}`} className="confirmed-whisper" aria-label={beat.text}>
          {!inDistrict(beat.from) && <text x="65" y={district === "riverside" ? 290 : 430} className="district-origin">From {town.npcs.find((n) => n.id === beat.from)?.name} · {districts[districtOf(beat.from)].name}</text>}
          <path d={path} className="whisper-flight-path" />
          {!reduced && <g className="whisper-moth" opacity={beat.confidence}>
            <animateMotion dur="1.6s" path={path} fill="freeze" />
            <path d="M0 0Q-28-28-25-3Q-18 10 0 0Q28-28 25-3Q18 10 0 0" />
            <rect x="-8" y="0" width="16" height="12" rx="2" />
          </g>}
        </g>;
      })()}
      {deed && !quiet && <foreignObject x={deed.placeName.includes("Forge") ? 230 : deed.placeName.includes("Kettle") ? 780 : 1360} y="355" width="270" height="70">
        <div className={`deed-pin ${deed.type}`}><Swords size={18} /><span>{deed.title}</span></div>
      </foreignObject>}
      <g className="traveller-position" style={{ transform: `translate(${traveller.x - 50}px, ${traveller.y - 135}px)` }} aria-hidden="true">
        <foreignObject width="100" height="150"><div className="puppet traveller" /></foreignObject>
        <ellipse cx="50" cy="145" rx="35" ry="7" className="ground-shadow" />
      </g>
      {locals.map((npc, index) => {
        const home = homeOf(npc.id, index);
        const memory = npc.rumors.find((r) => r.eventId === eventId);
        const reacting = beat?.to === npc.id;
        const newThisTurn = town.gossipSteps?.some((s) => s.listenerId === npc.id && s.eventId === eventId);
        return <g key={`npc:${npc.id}`} className={`villager npc-${npc.id} attitude-${npc.attitude} ${reacting || newThisTurn ? "just-learned" : ""} ${beat?.from === npc.id ? "is-telling" : ""}`}>
          <ellipse cx={home.x} cy={home.y + 15} rx="65" ry="12" className="ground-shadow" />
          <foreignObject x={home.x - 80} y={home.y - 200} width="160" height="280">
            <Button variant="ghost" className={`villager-button ${selected === npc.id ? "chosen" : ""}`} aria-label={`Talk to ${npc.name}. ${npc.attitude}. ${memoryText(npc, eventId)}`} onClick={() => onSelect(npc.id)}>
              <span className={`puppet ${extraCast.includes(npc.id) ? "expanded-puppet" : ""} ${npc.id} ${reacting ? "notice" : ""}`} aria-hidden="true" />
              <span className="villager-caption"><strong>{npc.name}</strong><span className="attitude-label">{npc.attitude === "hostile" ? "⌢" : npc.attitude === "wary" ? "−" : npc.attitude === "neutral" ? "·" : "⌣"} {npc.attitude}</span></span>
            </Button>
          </foreignObject>
          {eventId && (!quiet || reacting) && <foreignObject x={home.x + 45} y={home.y - 205} width="170" height="70">
            <div className={`thought-note ${memory?.hops === 0 ? "witness" : memory ? "heard" : "unaware"} ${memory && memory.confidence < .7 ? "smudged-note" : ""}`} title={memoryText(npc, eventId)}>
              {memory?.hops === 0 ? <Eye size={16} /> : memory ? <Ear size={16} /> : <Moon size={16} />}
              {memory ? <span>{memory.hops === 0 ? "Witness" : `${Math.round(memory.confidence * 100)}% sure`}</span> : "Unaware"}
            </div>
          </foreignObject>}
        </g>;
      })}
      {showSword && district === "oldtown" && <foreignObject x="100" y="535" width="140" height="55"><Button className="sword-hotspot" variant="secondary" onClick={onSword}><Swords size={17} /> Iron sword</Button></foreignObject>}
      {[{ x: 360, label: "Brom’s Forge" }, { x: 900, label: "The Copper Kettle" }, { x: 1490, label: "Guard Barracks" }].map((place) => <text key={place.label} x={place.x} y="300" className="place-label">{place.label}</text>)}
      <foreignObject x="70" y="795" width="450" height="50"><p className="walk-hint"><Footprints size={16} /> Click the road to walk · Arrow keys / WASD</p></foreignObject>
    </svg>
    <div className="district-picker"><label>District<select aria-label="Choose a district" value={district} onChange={(event) => {
      const next = event.target.value;
      if (next !== "oldtown" && next !== "vale" && next !== "riverside") return;
      setDistrict(next);
      const first = town.npcs.find((npc) => districtOf(npc.id) === next);
      if (first) { const home = homeOf(first.id); setTraveller({ x: home.x - 140, y: home.y + 20 }); onFocus?.(first.id); }
    }}>{Object.entries(districts).map(([id, item]) => <option key={id} value={id}>{item.name} · {town.npcs.filter((npc) => districtOf(npc.id) === id).length}</option>)}</select></label></div>
    <div className="location-nav"><select aria-label="Walk to a villager" value="" onChange={(event) => { const npc = locals.find((n) => n.id === event.target.value); if (npc) { const home = homeOf(npc.id); setTraveller({ x: home.x - 140, y: home.y + 20 }); } }}><option value="" disabled>Walk to a villager…</option>{locals.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}</select></div>
  </div>;
}
