"use client";
import { useState } from "react";
import { DEFAULT_EVENT_WEIGHT, EventType } from "@hearsay/contract";
import type { ToolInput } from "@hearsay/contract";
import type { NPC } from "../../lib/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useEscapeKey } from "../../lib/use-escape-key";

interface Props {
  npcs: NPC[]; places: { id: string; name: string }[]; playerId: string;
  busy?: boolean; onClose: () => void; onSubmit: (input: ToolInput<"recordEvent">) => void;
}
export function EventForm({ npcs, places, playerId, busy, onClose, onSubmit }: Props) {
  const [type, setType] = useState<EventType>("stole");
  const [placeId, setPlace] = useState(places.find((p) => p.id === "forge")?.id ?? places[0]?.id ?? "");
  const [witness, setWitness] = useState(npcs.find((n) => n.id === "brom")?.id ?? npcs[0]?.id ?? "");
  const [subject, setSubject] = useState("iron sword");
  useEscapeKey(!busy, onClose);
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-labelledby="event-title" className="w-full max-w-lg rounded-xl bg-surface-2 p-6 space-y-5 card-elevation">
      <h2 id="event-title" className="font-serif text-3xl text-balance">Do something they <em>remember</em></h2>
      <p className="text-sm text-text-secondary">Only your chosen witness learns about this event. Advance time to spread it.</p>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit({ playerId, type, placeId, witnesses: [witness], subject }); }}>
        <label className="block text-sm space-y-2">What did you do?
          <select aria-label="Event type" value={type} disabled={busy} onChange={(event) => setType(EventType.parse(event.target.value))} className="block h-11 w-full rounded-md bg-surface-3 px-3 text-text-primary border border-border">
            {EventType.options.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="block text-sm space-y-2">Where?
          <select aria-label="Event place" value={placeId} disabled={busy} onChange={(event) => setPlace(event.target.value)} className="block h-11 w-full rounded-md bg-surface-3 px-3 text-text-primary border border-border">
            {places.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
          </select>
        </label>
        <label className="block text-sm space-y-2">Who saw it?
          <select aria-label="Event witness" value={witness} disabled={busy} onChange={(event) => setWitness(event.target.value)} className="block h-11 w-full rounded-md bg-surface-3 px-3 text-text-primary border border-border">
            {npcs.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
          </select>
        </label>
        <label className="block text-sm space-y-2">Item or detail
          <Input aria-label="Event detail" value={subject} maxLength={60} disabled={busy} onChange={(event) => setSubject(event.target.value)} />
        </label>
        <p className="font-mono text-xs text-text-secondary tabular-nums">Event weight: {DEFAULT_EVENT_WEIGHT[type]}</p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button disabled={busy || !placeId || !witness} type="submit">{busy ? "Recording…" : "Do it"}</Button>
        </div>
      </form>
    </section>
  </div>;
}
