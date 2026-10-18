"use client";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { CrossingChat } from "./CrossingChat";
import { CrossingBrief } from "./CrossingBrief";
import { MissionPulse } from "./MissionPulse";
import type { TownState } from "../../lib/types";

export function CrossingSpecimens({ town }: { town: TownState }) {
  const [mode, setMode] = useState("opening"), [npc, setNpc] = useState("rowan");
  const [sampleNow, setSampleNow] = useState(0);
  useEffect(() => setSampleNow(Date.now()), [mode]);
  const ended = mode === "won" || mode === "lost";
  const example: TownState = { ...town, playerId: "puzzle_crossing_abcdefghijklmnopqrst", puzzle: {
    ap: mode === "one AP" ? 1 : 2, maxAp: 2, fog: !ended, clues: [],
    state: { id: "crossing", stage: ended ? mode === "won" ? "won" : "lost" : "playing", title: "Family Feud · Before Dusk", remaining: 6, reason: "Get Lysa across.", goals: [] },
    crossing: { deadlineAt: sampleNow + (mode === "urgent" ? 40_000 : 360_000), serverNow: sampleNow, flags: mode === "route closed" ? ["planks"] : [], lines: [{ id: "sample", npc, text: mode === "route closed" ? "You chose the secret crossing. My offer is gone." : "Marta has barred the bridge. Lysa needs the chapel before dusk.", tick: 0 }], ending: ended ? mode === "won" ? "Your purse, her passage" : "Dusk at a closed bridge" : undefined },
  } };
  return <section className="space-y-4"><h2 className="font-serif text-4xl">A living dilemma</h2><p>Synthetic chat, timer, AP, exclusive route and ending states.</p><div className="flex flex-wrap gap-2">{["opening", "one AP", "urgent", "route closed", "pending", "won", "lost"].map((value) => <Button key={value} onClick={() => setMode(value)}>{value}</Button>)}</div><label>Talk with<select value={npc} onChange={(e) => setNpc(e.target.value)}>{["rowan", "elin", "marta", "garrick", "oren", "silas", "lysa"].map((id) => <option key={id} value={id}>{id}</option>)}</select></label><div className="relative h-96 rounded-xl bg-background"><MissionPulse town={example} busy={mode === "pending"} onHeartbeat={async () => {}} /></div><div className="grid gap-4 md:grid-cols-2"><div className="memory-paper"><CrossingChat town={example} npcId={npc} busy={mode === "pending"} onChoose={() => setMode("one AP")} /></div><div className="memory-paper"><CrossingBrief town={example} busy={mode === "pending"} onWalk={setNpc} onGraph={() => {}} onRestart={() => setMode("opening")} /></div></div></section>;
}
