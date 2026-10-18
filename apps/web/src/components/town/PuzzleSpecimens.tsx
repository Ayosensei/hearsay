"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { PuzzleInterview } from "./PuzzleInterview";
import { ScenarioPanel } from "./ScenarioPanel";
import { MemoryWorld } from "./MemoryWorld";
import { puzzleView, CASE_SUBJECT } from "../../lib/puzzle";
import { VERDICT } from "../../lib/scenario-state";
import type { TownState } from "../../lib/types";

export function PuzzleSpecimens({ town }: { town: TownState }) {
  const [mode, setMode] = useState("fresh");
  const [selected, select] = useState("garrick");
  const event = { id: "case", subject: CASE_SUBJECT, actionType: "stole", title: "The missing silver seal", description: "A synthetic detective case", type: "harm" as const, weight: -.9, witnessId: "brom", witnessName: "Brom", placeName: "Forge", tickOccurred: 0 };
  const receipt = (subject: string) => ({ ...event, id: subject, subject, actionType: "traded", weight: 0 });
  const ended = ["won", "lost", "deadline"].includes(mode);
  const raw: TownState = { ...town, playerId: "puzzle_detective_abcdefghijklmnopqrst", events: [event], tick: mode === "deadline" ? 8 : 0 };
  if (!["fresh", "pending"].includes(mode)) raw.events.push(receipt("Note|garrick|case|mira|0.63|0"));
  if (mode === "exhausted") raw.events.push(receipt("Talk|brom|0|1"));
  if (mode === "refused") raw.events.push(receipt("Refused|help-brom|0"));
  if (["won", "lost"].includes(mode)) raw.events.push(receipt(`Detective score: ${mode === "won" ? 3 : 1}/3`), receipt(mode === "won" ? VERDICT.won : VERDICT.incorrect));
  const example = puzzleView(raw, ended ? { witnessId: "brom", route: ["brom", "mira", "garrick"], account: "secondhand" } : undefined);
  const npc = example.npcs.find((person) => person.id === selected) ?? example.npcs[0];
  return <section className="space-y-4"><h2 className="font-serif text-4xl">Rumour puzzle states</h2><p>Synthetic visual fixtures: AP, private memories, dated clues, one submission and final graph reveal.</p>
    <div className="flex flex-wrap gap-2">{["fresh", "one AP", "exhausted", "pending", "refused", "won", "lost", "deadline"].map((value) => <Button key={value} variant="secondary" aria-pressed={mode === value} onClick={() => setMode(value)}>{value}</Button>)}</div>
    <div className="grid gap-4 md:grid-cols-2"><div className="memory-paper"><ScenarioPanel key={mode} town={example} busy={mode === "pending"} onWalk={select} onVerdict={() => setMode("deadline")} onGraph={() => {}} onRestart={() => setMode("fresh")} onExit={() => {}} onChoose={() => {}} onAccuse={() => setMode("won")} /></div><div className="memory-paper"><PuzzleInterview key={selected} town={example} npc={npc} eventId="case" busy={mode === "pending" || ended} onAsk={() => setMode("one AP")} onSpeak={async () => false} /></div></div>
    <MemoryWorld town={example} eventId="case" selected={selected} activeEdges={[]} busy={mode === "pending"} onEvent={() => {}} onSelect={select} onExplain={() => {}} onTalk={() => {}} />
  </section>;
}
