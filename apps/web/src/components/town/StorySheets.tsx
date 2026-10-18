"use client";
import { Eye, Ear, Scale } from "lucide-react";
import { Button } from "../ui/button";
import type { TownState, NPC, ProvenanceChain } from "../../lib/types";

export function LedgerSheet({ town, eventId, onSelect }: { town: TownState; eventId: string; onSelect: (id: string) => void }) {
  return <div className="space-y-4"><p>Every deed leaves a page. Choose one to see who knows about that story.</p>
    {!town.events.length && <div className="memory-paper"><h3>A blank page</h3><p>Your story has not started. Take an action to give the town something to remember.</p></div>}
    {town.events.map((event) => <Button className={`ledger-deed ${event.type}`} variant="secondary" key={event.id} aria-pressed={event.id === eventId} onClick={() => onSelect(event.id)}>
      <strong>{event.title}</strong><span>{event.placeName} · Turn {event.tickOccurred}</span><span>{town.puzzle?.fog ? "Knowledge hidden · collect dated clues" : `${town.npcs.filter((n) => n.rumors.some((r) => r.eventId === event.id)).length} villagers know`}</span>
    </Button>)}
    <p className="paper-caption">Selecting a deed changes the knowledge shown. Overall attitude still reflects all known deeds.</p>
  </div>;
}
export function EvidenceSheet({ npc, why, eventTitle }: { npc: NPC; why?: ProvenanceChain; eventTitle?: string }) {
  return <div className="space-y-5">
    <p className="paper-eyebrow">The origin of knowledge</p><h3 className="font-serif text-3xl">{eventTitle ?? "Choose a deed"}</h3>
    {!why ? <div className="memory-paper"><h3>{npc.name} has not learned about this event yet.</h3><p>No evidence path exists. Being unaware is different from having a neutral opinion.</p></div>
      : <>
        <ol className="evidence-stops">{why.hops.map((hop, i) => <li key={hop.npcId}>
          {i === 0 ? <Eye size={22} /> : <Ear size={22} />}<div><strong>{hop.npcName}</strong><p>{i === 0 ? "Saw it happen" : `Heard from ${why.hops[i - 1].npcName}`}</p><span className="font-mono">{Math.round(hop.confidence * 100)}% sure</span></div>
        </li>)}</ol>
        <p>{why.hopCount === 0 ? `${npc.name} saw this happen firsthand. No gossip chain was needed.` : `${npc.name} did not see this happen. This story reached them through other people.`}</p>
        {why.hopCount > 0 && <details className="paper-details"><summary>Show the arithmetic</summary><p>Each listener’s confidence is the teller’s confidence multiplied by their trust in the teller.</p>
          {why.hops.slice(1).map((hop, i) => {
            const previous = why.hops[i].confidence;
            return <p className="font-mono" key={hop.npcId}>{Math.round(previous * 100)}% × {previous ? Math.round(hop.confidence / previous * 100) : 0}% = {Math.round(hop.confidence * 100)}%</p>;
          })}
        </details>}
        <p className="paper-caption">This is a recorded graph path, not an AI-generated explanation.</p>
      </>}
  </div>;
}
export function AttitudeSheet({ town, npc, onSelect }: { town: TownState; npc: NPC; onSelect: (id: string) => void }) {
  return <div className={`space-y-4 attitude-${npc.attitude}`}><p className="paper-eyebrow">The reason for an opinion</p><h3 className="font-serif text-3xl flex gap-3 items-center"><Scale /> {npc.name} is {npc.attitude}</h3>
    <p>Deeds, certainty, recency and personal traits shape this opinion.</p>
    {!npc.contributions?.length && <p>No remembered deeds are influencing this opinion.</p>}
    {npc.contributions?.map((item) => <article className={`memory-paper contribution ${item.effect < 0 ? "harm" : "help"}`} key={item.eventId}>
      <strong>{town.events.find((e) => e.id === item.eventId)?.title ?? item.type}</strong>
      <p>{item.effect < 0 ? "Damages" : "Improves"} their opinion · {Math.round(item.confidence * 100)}% confidence.</p>
      <Button variant="link" onClick={() => onSelect(item.eventId)}>Follow this memory</Button>
      <details><summary>Exact contribution</summary><span className="font-mono">{item.effect.toFixed(6)}</span></details>
    </article>)}
    <details className="paper-details"><summary>Overall score</summary><p className="font-mono">{npc.attitudeScore.toFixed(6)}</p><p>Older memories gradually have less influence. Passing time does not erase them.</p></details>
  </div>;
}
