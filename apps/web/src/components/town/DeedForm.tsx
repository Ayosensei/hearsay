"use client";
import { useState } from "react";
import { EventType } from "@hearsay/contract";
import { Swords, HandHeart, Shield, MessageCircle, Gift, Handshake, Heart } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PaperDrawer } from "./PaperDrawer";
import type { TownState } from "../../lib/types";
import type { ToolInput } from "@hearsay/contract";
import { approach, observeAt } from "../../lib/town-space";
import type { TownPosition } from "../../lib/town-space";

const verbs = [
  { id: "stole", label: "Steal", verb: "steal", icon: Swords, hint: "Strongly harmful" },
  { id: "attacked", label: "Attack", verb: "attack", icon: Shield, hint: "Strongly harmful" },
  { id: "lied", label: "Lie", verb: "lie about", icon: MessageCircle, hint: "Harmful" },
  { id: "helped", label: "Help", verb: "help with", icon: HandHeart, hint: "Helpful" },
  { id: "donated", label: "Donate", verb: "donate", icon: Gift, hint: "Helpful" },
  { id: "saved", label: "Save", verb: "save", icon: Heart, hint: "Strongly helpful" },
  { id: "traded", label: "Trade", verb: "trade", icon: Handshake, hint: "Too minor to spread" },
] as const;
export function DeedForm({ town, busy, error, prepared, goodDeed, initialWitness = "brom", position, locked = false, onClose, onSubmit }: {
  town: TownState; busy: boolean; error: string; prepared: boolean; goodDeed: boolean; initialWitness?: string;
  position?: TownPosition;
  locked?: boolean;
  onClose: () => void; onSubmit: (input: ToolInput<"recordEvent">) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(!prepared);
  const [type, setType] = useState<EventType>(goodDeed ? "helped" : "stole");
  const [subject, setSubject] = useState(goodDeed ? "repairing the gate" : "iron sword");
  const observation = observeAt(position ?? approach(goodDeed ? "garrick" : prepared ? "brom" : initialWitness), town);
  const witnesses = observation.witnesses.map((npc) => npc.id);
  const place = observation.place?.id ?? "";
  const verb = verbs.find((v) => v.id === type) ?? verbs[0];
  const name = town.npcs.filter((n) => witnesses.includes(n.id)).map((n) => n.name).join(", ");
  const location = town.places?.find((p) => p.id === place)?.name ?? "this location";
  return <PaperDrawer title={editing ? "A deed to remember" : "The iron sword"} onClose={onClose}>
    <p className="paper-eyebrow">Walking is free. Actions are remembered.</p>
    {editing && <div className="verb-wheel" role="group" aria-label="Choose your action">
      {verbs.map((v) => <Button key={v.id} variant="secondary" aria-pressed={type === v.id} title={v.hint} onClick={() => setType(v.id)} disabled={busy}>
        <v.icon size={20} /><span>{v.label}</span>
      </Button>)}
    </div>}
    <p className="deed-sentence">You <em>{verb.verb}</em> {subject || "something"} at {location}. <strong>{name || "Nobody is nearby."}{name ? " can see you." : ""}</strong></p>
    <p className="paper-caption">Everyone within sight witnesses your action. News spreads automatically through people they trust.</p>
    <form onSubmit={async (event) => {
      event.preventDefault(); await onSubmit({ playerId: town.playerId ?? "", type, subject: subject.trim(), placeId: place, witnesses });
    }} className="space-y-4">
      {editing && <>
        <label className="paper-field">Item or detail<Input aria-label="Item or detail" maxLength={60} value={subject} onChange={(e) => setSubject(e.target.value)} disabled={busy} required /></label>
        <div className="paper-field"><span>Your location</span><strong>{location}</strong><p className="paper-caption">Walk somewhere else to change where you act.</p></div>
        <div className="paper-field"><span>Within sight</span><strong>{name || "Nobody nearby"}</strong>{!witnesses.length && <p className="paper-caption">Move closer to a villager to record a witnessed deed.</p>}</div>
      </>}
      <p className="paper-caption">{verb.hint}{type === "traded" ? ". A small trade can affect its witness’s opinion, but does not become gossip." : ". The memory can travel as time passes."}</p>
      {error && <p role="alert" className="paper-error">{error} Your choices are still here.</p>}
      <Button type="submit" disabled={busy || !subject.trim() || !witnesses.length || witnesses.length > 6 || !place}>{busy ? "Recording…" : editing ? "Do it here" : "Take the sword"}</Button>
      {!editing && !locked && <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(true)}>Change this</Button>}
    </form>
  </PaperDrawer>;
}
