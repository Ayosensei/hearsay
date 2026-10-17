"use client";
import { useState } from "react";
import { getInitialTownState } from "../../lib/mock-data";
import { TownStage } from "./TownStage";
import { Button } from "../ui/button";
import "./town.css";
import "./paper.css";
import { PaperDrawer } from "./PaperDrawer";
import { CharacterSheet } from "./CharacterSheet";
import { DeedForm } from "./DeedForm";
import { LedgerSheet, EvidenceSheet, AttitudeSheet } from "./StorySheets";

export function TownSpecimens() {
  const [lens, setLens] = useState<"none" | "bonds" | "whispers">("none");
  const [reduced, setReduced] = useState(false);
  const [mood, setMood] = useState(0);
  const [sheet, setSheet] = useState("");
  const [loading, setLoading] = useState(false);
  const initial = getInitialTownState();
  const moods = ["hostile", "wary", "neutral", "friendly", "devoted"] as const;
  const town = { ...initial, npcs: initial.npcs.filter((n) => ["brom", "mira", "garrick"].includes(n.id)).map((n, i) => ({ ...n, attitude: moods[(i + mood) % moods.length] })) };
  return <section className="space-y-4">
    <h2 className="font-serif text-4xl">The living <em>town</em></h2>
    <p>Synthetic visual specimens; these do not create game events. Cycle all five attitudes and both knowledge lenses.</p>
    <div className="flex flex-wrap gap-3">{(["none", "bonds", "whispers"] as const).map((value) => <Button key={value} onClick={() => setLens(value)}>{value}</Button>)}<Button onClick={() => setReduced(!reduced)}>Reduced motion: {String(reduced)}</Button><Button onClick={() => setMood((mood + 1) % 5)}>Cycle attitudes</Button></div>
    <div className="flex flex-wrap gap-2">{["prepared", "form", "character", "ledger", "evidence", "unaware", "witness", "attitude", "empty", "loading", "error", "offline", "reset", "arrival"].map((name) => <Button key={name} variant="secondary" onClick={() => setSheet(name)}>{name}</Button>)}<Button onClick={() => setLoading(!loading)}>Toggle pending / failed form</Button></div>
    <div className="relative h-180 overflow-hidden rounded-xl"><TownStage town={town} eventId={town.events[0]?.id ?? ""} selected="garrick" lens={lens} reduced={reduced} paused={false} why={initial.activeProvenance} onSelect={() => setSheet("character")} onSword={() => setSheet("prepared")} /></div>
    {["prepared", "form"].includes(sheet) && <DeedForm town={{ ...town, places: [{ id: "forge", name: "Brom’s Forge" }] }} prepared={sheet === "prepared"} goodDeed={false} busy={loading} error={loading ? "" : "Failure specimen: choices preserved. No automatic retry."} onClose={() => setSheet("")} onSubmit={async () => false} />}
    {sheet && !["prepared", "form"].includes(sheet) && <PaperDrawer title={`${sheet} specimen`} onClose={() => setSheet("")}>
      {sheet === "character" && <CharacterSheet town={town} npc={town.npcs[0]} eventId={town.events[0]?.id ?? ""} busy={loading} onSpeak={async () => {}} onExplain={() => setSheet("evidence")} onAttitude={() => setSheet("attitude")} />}
      {sheet === "ledger" && <LedgerSheet town={town} eventId="" onSelect={() => {}} />}
      {sheet === "empty" && <LedgerSheet town={{ ...town, events: [] }} eventId="" onSelect={() => {}} />}
      {["evidence", "unaware", "witness"].includes(sheet) && <EvidenceSheet npc={town.npcs[0]} why={sheet === "unaware" ? undefined : sheet === "witness" && initial.activeProvenance ? { ...initial.activeProvenance, hops: initial.activeProvenance.hops.slice(0, 1), hopCount: 0 } : initial.activeProvenance} eventTitle="stole iron sword" />}
      {sheet === "attitude" && <AttitudeSheet town={town} npc={{ ...town.npcs[0], contributions: [{ eventId: "specimen", type: "stole", confidence: .63, effect: -.562464, learnedFrom: "mira" }] }} onSelect={() => {}} />}
      {sheet === "loading" && <p role="status">Setting up Hollowbrook…</p>}
      {sheet === "error" && <p role="alert" className="paper-error">We could not confirm that this was recorded. Your choices are still here.</p>}
      {sheet === "offline" && <p role="alert">You are offline. Your last confirmed story is still here.</p>}
      {sheet === "reset" && <><h3>Reset story A?</h3><p>This removes its actions, memories and reputation changes.</p><Button variant="destructive">Reset story A</Button></>}
      {sheet === "arrival" && <><h3 className="font-serif text-4xl">Traveller, arrive.</h3><p>Take a sword. Only Brom sees you. Follow the whisper to the guard captain.</p><Button>Step into Hollowbrook</Button></>}
    </PaperDrawer>}
  </section>;
}
