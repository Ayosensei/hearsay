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
import { EngineSheet } from "./EngineSheet";
import { MinimalChrome } from "./MinimalChrome";
import { TownMenu } from "./TownMenu";
import "./minimal.css";
import "./cinematic.css";
import { WhisperFlow } from "./WhisperFlow";
import expandedSeed from "../../../../../seed/hollowbrook-expanded.json";
import { faction, initials } from "../../lib/live-view";
import type { NPC } from "../../lib/types";
import { ResidentsSheet } from "./ResidentsSheet";
import { MemorySpecimens } from "./MemorySpecimens";
import { ChallengeSpecimens } from "./ChallengeSpecimens";
import { ScenarioSpecimens } from "./ScenarioSpecimens";

export function TownSpecimens() {
  const [lens, setLens] = useState<"none" | "bonds" | "whispers">("none");
  const [reduced, setReduced] = useState(false);
  const [mood, setMood] = useState(0);
  const [sheet, setSheet] = useState("");
  const [loading, setLoading] = useState(false);
  const [chrome, setChrome] = useState(0);
  const [view, setView] = useState<"town" | "graph">("town");
  const initial = getInitialTownState();
  const moods = ["hostile", "wary", "neutral", "friendly", "devoted"] as const;
  const town = { ...initial, places: expandedSeed.places, npcs: expandedSeed.npcs.map((n, i): NPC => ({
    id: n.id, name: n.name, role: n.role, faction: faction(n.faction), avatarInitials: initials(n.name),
    attitude: moods[(i + mood) % moods.length], attitudeScore: 0, rumors: [], knowledgeState: "none",
  })) };
  return <section className="space-y-4">
    <MemorySpecimens town={town} />
    <ChallengeSpecimens />
    <ScenarioSpecimens town={town} />
    <h2 className="font-serif text-4xl">Cinematic town</h2>
    <p>Confirmed handoffs, static reduced-motion paths, and replay without advancing time.</p>
    <div className="flex flex-wrap gap-4">{[true, false].map((playing) => <WhisperFlow key={String(playing)} npcs={town.npcs} tick={2} busy={false} remaining={1} beat={playing ? { id: "specimen", from: "mira", to: "garrick", confidence: .63, text: "Mira told Garrick." } : undefined} lastBeats={[{ id: "specimen", from: "mira", to: "garrick", confidence: .63, text: "Mira told Garrick." }]} onReplay={() => {}} />)}<WhisperFlow npcs={town.npcs} tick={0} busy={false} remaining={1} lastBeats={[]} beat={{ id: "witness", to: "brom", confidence: 1, text: "Brom saw it happen." }} onReplay={() => {}} /></div>
    <div className="flex flex-wrap gap-2">{["Free exploration", "Welcome", "Guided", "Waiting", "Paused", "Scenario", "Game over"].map((name, i) => <Button key={name} variant="secondary" onClick={() => setChrome(i)}>{name}</Button>)}<Button onClick={() => setSheet("menu")}>Menu specimen</Button><Button onClick={() => setSheet("residents")}>13 villagers</Button></div>
    <div className="living-town minimal-town cinematic-specimen relative h-180 overflow-hidden rounded-xl" style={{ minHeight: 0 }}>
      <TownStage quiet showSword={false} town={town} eventId={town.events[0]?.id ?? ""} selected="garrick" lens="none" reduced paused={false} onSelect={() => setSheet("character")} onSword={() => {}} />
      <MinimalChrome actionLabel={chrome === 6 ? "Story finished" : chrome === 5 ? "Explore Chapel" : undefined} actionDisabled={chrome === 6} secondaryLabel={chrome >= 5 ? "Wait one turn" : undefined} secondaryDisabled={chrome === 6} view={view} onView={setView} location="At Brom’s Forge · Nearby: Brom" clock={{ paused: chrome === 4, label: chrome === 4 ? "Town paused" : "Next whispers in 12s", onToggle: () => setChrome(chrome === 4 ? 0 : 4) }} tour={chrome === 1 ? -1 : chrome === 2 ? 3 : 0} cue={chrome === 2 ? ["Let word spread", "Give the town a chance to share what it knows.", "Wait ahead"] : undefined} narration={chrome === 3 ? "Waiting for the town…" : "Mira told Garrick. He is 63% sure."} busy={chrome === 3} onMenu={() => setSheet("menu")} onLedger={() => setSheet("ledger")} onBegin={() => setChrome(2)} onSkip={() => setChrome(0)} onNext={() => setChrome(0)} onAction={() => setSheet("form")} onAdvance={() => setChrome(3)} />
    </div>
    <h2 className="font-serif text-4xl">The living <em>town</em></h2>
    <p>Synthetic visual specimens; these do not create game events. Cycle all five attitudes and both knowledge lenses.</p>
    <div className="flex flex-wrap gap-3">{(["none", "bonds", "whispers"] as const).map((value) => <Button key={value} onClick={() => setLens(value)}>{value}</Button>)}<Button onClick={() => setReduced(!reduced)}>Reduced motion: {String(reduced)}</Button><Button onClick={() => setMood((mood + 1) % 5)}>Cycle attitudes</Button></div>
    <div className="flex flex-wrap gap-2">{["prepared", "form", "out-of-sight", "character", "ledger", "evidence", "unaware", "witness", "attitude", "empty", "loading", "error", "offline", "reset", "arrival", "engine"].map((name) => <Button key={name} variant="secondary" onClick={() => setSheet(name)}>{name}</Button>)}<Button onClick={() => setLoading(!loading)}>Toggle pending / failed form</Button></div>
    <div className="relative h-180 overflow-hidden rounded-xl"><TownStage town={town} eventId={town.events[0]?.id ?? ""} selected="garrick" lens={lens} reduced={reduced} paused={false} why={initial.activeProvenance} onSelect={() => setSheet("character")} onSword={() => setSheet("prepared")} /></div>
    {["prepared", "form", "out-of-sight"].includes(sheet) && <DeedForm town={town} position={sheet === "out-of-sight" ? { district: "oldtown", x: 60, y: 800 } : undefined} prepared={sheet === "prepared"} goodDeed={false} busy={loading} error={loading ? "" : "Failure specimen: choices preserved. No automatic retry."} onClose={() => setSheet("")} onSubmit={async () => false} />}
    {sheet && !["prepared", "form", "out-of-sight"].includes(sheet) && <PaperDrawer title={`${sheet} specimen`} onClose={() => setSheet("")}>
      {sheet === "residents" && <ResidentsSheet npcs={town.npcs} onSelect={() => setSheet("character")} />}
      {sheet === "menu" && <TownMenu lens={lens} onLens={setLens} game={{ town, active: false, offline: false, slot: "a", eventId: town.events[0]?.id ?? "", switchSave: () => {}, setDrawer: () => {}, explain: async () => {}, reduced, setReduced, textMode: false, setTextMode: () => {}, largeText: false, setLargeText: () => {} }} />}
      {sheet === "character" && <CharacterSheet town={town} npc={town.npcs[0]} eventId={town.events[0]?.id ?? ""} busy={loading} onSpeak={async () => {}} onExplain={() => setSheet("evidence")} onAttitude={() => setSheet("attitude")} />}
      {sheet === "ledger" && <LedgerSheet town={town} eventId="" onSelect={() => {}} />}
      {sheet === "empty" && <LedgerSheet town={{ ...town, events: [] }} eventId="" onSelect={() => {}} />}
      {["evidence", "unaware", "witness"].includes(sheet) && <EvidenceSheet npc={town.npcs[0]} why={sheet === "unaware" ? undefined : sheet === "witness" && initial.activeProvenance ? { ...initial.activeProvenance, hops: initial.activeProvenance.hops.slice(0, 1), hopCount: 0 } : initial.activeProvenance} eventTitle="stole iron sword" />}
      {sheet === "attitude" && <AttitudeSheet town={town} npc={{ ...town.npcs[0], contributions: [{ eventId: "specimen", type: "stole", confidence: .63, effect: -.562464, learnedFrom: "mira" }] }} onSelect={() => {}} />}
      {sheet === "engine" && <EngineSheet town={town} selected="brom" onSelect={() => {}} onCompare={() => {}} />}
      {sheet === "loading" && <p role="status">Setting up Hollowbrook…</p>}
      {sheet === "error" && <p role="alert" className="paper-error">We could not confirm that this was recorded. Your choices are still here.</p>}
      {sheet === "offline" && <p role="alert">You are offline. Your last confirmed story is still here.</p>}
      {sheet === "reset" && <><h3>Reset story A?</h3><p>This removes its actions, memories and reputation changes.</p><Button variant="destructive">Reset story A</Button></>}
      {sheet === "arrival" && <><h3 className="font-serif text-4xl">Traveller, arrive.</h3><p>Take a sword. Only Brom sees you. Follow the whisper to the guard captain.</p><Button>Step into Hollowbrook</Button></>}
    </PaperDrawer>}
  </section>;
}
