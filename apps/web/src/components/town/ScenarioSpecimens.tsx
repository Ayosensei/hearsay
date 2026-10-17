"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { ScenarioPanel, ScenarioPicker } from "./ScenarioPanel";
import { LocationChoices } from "./LocationChoices";
import { scenarioChoices } from "../../lib/scenarios";
import type { ScenarioId } from "../../lib/scenarios";
import { VERDICT } from "../../lib/scenario-state";
import { approach } from "../../lib/town-space";
import type { TownState } from "../../lib/types";

export function ScenarioSpecimens({ town }: { town: TownState }) {
  const [id, setId] = useState<ScenarioId>("medicine");
  const [mode, setMode] = useState("available");
  const [npc, setNpc] = useState("ayla");
  const marker = mode === "won" ? VERDICT.won : mode === "trust lost" ? VERDICT.trust : undefined;
  const completed = scenarioChoices.find((choice) => choice.id === "med-work");
  const example: TownState = { ...town, playerId: `quest_${id}_abcdefghijklmnopqrst`, tick: mode === "deadline" ? 7 : 0,
    npcs: town.npcs.map((person) => ({ ...person, attitude: "neutral", attitudeScore: person.id === "garrick" && mode === "trust lost" ? -1 : person.id === "ayla" && mode === "available" ? .5 : 0, rumors: [] })),
    events: marker ? [{ id: "ev_verdict", subject: marker, actionType: "traded", title: marker, description: marker, type: "help", weight: 0, witnessId: "garrick", witnessName: "Garrick", placeName: "Guard Barracks", tickOccurred: 0 }] : mode === "recorded" && completed ? [{ id: "ev_work", subject: completed.subject, actionType: completed.type, title: completed.label, description: completed.hint, type: "help", weight: .5, witnessId: "brom", witnessName: "Brom", placeName: "Brom’s Forge", tickOccurred: 0 }] : [],
  };
  const position = mode === "empty road" ? { district: "oldtown" as const, x: 60, y: 800 } : approach(npc);
  return <section className="space-y-4"><h2 className="font-serif text-4xl">Location choices and scenarios</h2><p>Synthetic UI states. The playable scenarios use real FalkorDB tool results.</p>
    <div className="flex flex-wrap gap-2">{["available", "blocked", "recorded", "pending", "error", "empty road", "won", "trust lost", "deadline"].map((value) => <Button key={value} variant="secondary" aria-pressed={mode === value} onClick={() => setMode(value)}>{value}</Button>)}</div>
    <label>Location<select aria-label="Specimen location" value={npc} onChange={(event) => setNpc(event.target.value)}>{town.npcs.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
    <div className="grid gap-4 md:grid-cols-2"><div className="memory-paper"><ScenarioPicker busy={mode === "pending"} onStart={setId} /></div><div className="memory-paper"><ScenarioPanel town={example} busy={mode === "pending"} onWalk={setNpc} onVerdict={() => setMode("deadline")} onGraph={() => {}} onRestart={setId} onExit={() => {}} /></div><div className="memory-paper"><LocationChoices town={example} position={position} busy={mode === "pending"} error={mode === "error" ? "Connection interrupted. Inspect the saved story before deciding again." : ""} onChoose={() => {}} onFreeAction={() => {}} onCustom={() => {}} onInspect={() => setMode("recorded")} /></div><div className="memory-paper"><LocationChoices town={{ ...town, playerId: "free_specimen" }} position={position} busy={mode === "pending"} error="" onChoose={() => {}} onFreeAction={() => {}} onCustom={() => {}} onInspect={() => {}} /></div></div>
  </section>;
}
