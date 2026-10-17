"use client";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import type { Beat } from "./use-living-town";
import type { NPC } from "../../lib/types";

export function WhisperFlow({ beat, remaining, lastBeats, npcs, tick, busy, onReplay }: {
  beat?: Beat; remaining: number; lastBeats: Beat[]; npcs: NPC[]; tick: number;
  busy: boolean; onReplay: () => void;
}) {
  const current = beat?.to ? beat : lastBeats.at(-1);
  if (!current?.to) return null;
  const name = (id?: string) => npcs.find((npc) => npc.id === id)?.name ?? "Witness";
  const playing = Boolean(beat?.to);
  return <section className={`whisper-flow ${playing ? "playing" : "settled"}`} aria-label="Confirmed memory flow">
    <p className="flow-caption">{playing ? current.from ? `Word is travelling · Turn ${tick}` : "A memory begins" : `Turn ${tick} · ${lastBeats.length} confirmed ${lastBeats.length === 1 ? "whisper" : "whispers"}`}</p>
    <div className="flow-handoff">
      {current.from ? <><span>{name(current.from)}</span><ArrowRight size={20} aria-label="told" /></> : <span className="flow-witness">Witness</span>}
      <strong>{name(current.to)}</strong>
      <span className="flow-confidence">{Math.round((current.confidence ?? 1) * 100)}% sure</span>
    </div>
    {playing && current.from && <div className="flow-progress" aria-label={`${lastBeats.length - remaining + 1} of ${lastBeats.length} whispers`}>
      {lastBeats.map((item, index) => <span key={item.id} className={index < lastBeats.length - remaining + 1 ? "arrived" : ""} />)}
    </div>}
    {!playing && lastBeats.length > 0 && <Button variant="ghost" disabled={busy} onClick={onReplay}><RotateCcw size={14} /> Replay these whispers</Button>}
  </section>;
}
