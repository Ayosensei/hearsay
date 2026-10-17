"use client";
import { useState } from "react";
import { EventType } from "@hearsay/contract";
import { Swords, HandHeart, Shield, MessageCircle, Gift, Handshake, Heart } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PaperDrawer } from "./PaperDrawer";
import type { TownState } from "../../lib/types";
import type { ToolInput } from "@hearsay/contract";
import { placeFor } from "../../lib/town-residents";

const verbs = [
  { id: "stole", label: "Steal", verb: "steal", icon: Swords, hint: "Strongly harmful" },
  { id: "attacked", label: "Attack", verb: "attack", icon: Shield, hint: "Strongly harmful" },
  { id: "lied", label: "Lie", verb: "lie about", icon: MessageCircle, hint: "Harmful" },
  { id: "helped", label: "Help", verb: "help with", icon: HandHeart, hint: "Helpful" },
  { id: "donated", label: "Donate", verb: "donate", icon: Gift, hint: "Helpful" },
  { id: "saved", label: "Save", verb: "save", icon: Heart, hint: "Strongly helpful" },
  { id: "traded", label: "Trade", verb: "trade", icon: Handshake, hint: "Too minor to spread" },
] as const;
export function DeedForm({ town, busy, error, prepared, goodDeed, initialWitness = "brom", onClose, onSubmit }: {
  town: TownState; busy: boolean; error: string; prepared: boolean; goodDeed: boolean; initialWitness?: string;
  onClose: () => void; onSubmit: (input: ToolInput<"recordEvent">) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(!prepared);
  const [type, setType] = useState<EventType>(goodDeed ? "helped" : "stole");
  const [subject, setSubject] = useState(goodDeed ? "repairing the gate" : "iron sword");
  const firstWitness = goodDeed ? "garrick" : prepared ? "brom" : initialWitness;
  const initialPlace = placeFor[firstWitness] ?? "forge";
  const [place, setPlace] = useState(town.places?.some((p) => p.id === initialPlace) ? initialPlace : town.places?.[0]?.id ?? "");
  const [witnesses, setWitnesses] = useState([firstWitness]);
  const verb = verbs.find((v) => v.id === type) ?? verbs[0];
  const name = town.npcs.filter((n) => witnesses.includes(n.id)).map((n) => n.name).join(", ");
  const family = town.npcs.filter((n) => n.role.includes("Vale")).map((n) => n.id);
  const location = town.places?.find((p) => p.id === place)?.name ?? "this location";
  return <PaperDrawer title={editing ? "A deed to remember" : "The iron sword"} onClose={onClose}>
    <p className="paper-eyebrow">Walking is free. Actions are remembered.</p>
    {editing && <div className="verb-wheel" role="group" aria-label="Choose your action">
      {verbs.map((v) => <Button key={v.id} variant="secondary" aria-pressed={type === v.id} title={v.hint} onClick={() => setType(v.id)} disabled={busy}>
        <v.icon size={20} /><span>{v.label}</span>
      </Button>)}
    </div>}
    <p className="deed-sentence">You <em>{verb.verb}</em> {subject || "something"} at {location}. <strong>{name || "Choose a witness"}{name ? witnesses.length === 1 ? " sees you." : " see you." : ""}</strong></p>
    <p className="paper-caption">Only your chosen witnesses learn immediately. Other villagers may hear later, through people they trust.</p>
    <form onSubmit={async (event) => {
      event.preventDefault(); await onSubmit({ playerId: town.playerId ?? "", type, subject: subject.trim(), placeId: place, witnesses });
    }} className="space-y-4">
      {editing && <>
        <label className="paper-field">Item or detail<Input aria-label="Item or detail" maxLength={60} value={subject} onChange={(e) => setSubject(e.target.value)} disabled={busy} required /></label>
        <label className="paper-field">Where?<select aria-label="Where did it happen?" value={place} onChange={(e) => setPlace(e.target.value)} disabled={busy}>{town.places?.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <fieldset className="paper-field"><legend>Who sees you? Choose 1–6.</legend>
          {family.length === 4 && <Button type="button" variant="secondary" disabled={busy} onClick={() => setWitnesses(family)}>The Vale family · all four</Button>}
          <div className="witnesses-grid">{town.npcs.map((n) => <Button type="button" key={n.id} variant="secondary" aria-pressed={witnesses.includes(n.id)} disabled={busy || witnesses.length === 6 && !witnesses.includes(n.id)} onClick={() => setWitnesses((old) => old.includes(n.id) ? old.filter((id) => id !== n.id) : [...old, n.id])}>{n.name}</Button>)}</div>
        </fieldset>
      </>}
      <p className="paper-caption">{verb.hint}{type === "traded" ? ". A small trade can affect its witness’s opinion, but does not become gossip." : ". The memory can travel when you let the town talk."}</p>
      {error && <p role="alert" className="paper-error">{error} Your choices are still here.</p>}
      <Button type="submit" disabled={busy || !subject.trim() || !witnesses.length || witnesses.some((id) => !town.npcs.some((n) => n.id === id)) || !town.places?.some((p) => p.id === place)}>{busy ? "Recording…" : editing ? "Remember this deed" : "Take the sword"}</Button>
      {!editing && <Button type="button" variant="ghost" disabled={busy} onClick={() => setEditing(true)}>Change this</Button>}
    </form>
  </PaperDrawer>;
}
