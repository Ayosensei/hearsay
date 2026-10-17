"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { useLivingTown } from "./use-living-town";
import { TownStage, memoryText } from "./TownStage";
import { PaperDrawer } from "./PaperDrawer";
import { DeedForm } from "./DeedForm";
import { CharacterSheet } from "./CharacterSheet";
import { LedgerSheet, EvidenceSheet, AttitudeSheet } from "./StorySheets";
import { EngineSheet } from "./EngineSheet";
import { ControlVsHearsayModal } from "../ControlVsHearsayModal";
import { MinimalChrome } from "./MinimalChrome";
import { TownMenu } from "./TownMenu";
import "./town.css";
import "./paper.css";
import "./minimal.css";

export function LivingTownApp() {
  const game = useLivingTown();
  const [action, setAction] = useState<"sword" | "free" | "good">();
  const [lens, setLens] = useState<"none" | "bonds" | "whispers">("none");
  const [compare, setCompare] = useState(false);
  const { town } = game;
  if (!town) return <main className="town-loading" aria-busy={Boolean(game.busy)}>
    <div className="silhouettes" aria-hidden="true"><span /><span /><span /></div>
    <h1>A town that <em>remembers.</em></h1><p role={game.error ? "alert" : "status"}>{game.error || "Setting up Hollowbrook…"}</p>
    {game.error && <Button onClick={() => void game.load()}>Try again</Button>}
  </main>;
  const npc = town.npcs.find((n) => n.id === game.selected) ?? town.npcs[0];
  if (!npc) return <main className="town-loading">There are no villagers in this world.</main>;
  const deed = town.events.find((e) => e.id === game.eventId);
  const frozen = game.active || game.offline;
  const close = () => { if (!game.busy) { game.setDrawer(undefined); setAction(undefined); } };
  function openAction(kind: "sword" | "free" | "good") { game.setDrawer(undefined); setAction(kind); }
  const tourCopy: Record<number, [string, string, string]> = {
    1: ["One small deed", "An iron sword rests at Brom’s forge. He is close enough to see everything.", "Look at the sword"],
    2: ["Does Garrick know?", "Brom saw you. Garrick hasn’t heard yet. Ask the guard what he knows.", "Talk to Garrick"],
    3: ["Let word spread", "Garrick has no memory of your deed. Give the town a chance to talk.", "Let the town talk"],
    4: ["One person at a time", "Check the memory notes. Someone who just learned a story can tell it next turn.", "Let the town talk again"],
    5: ["Follow the whisper", "Look at Garrick’s memory and opinion. The graph can show exactly how he learned.", "How did he find out?"],
    6: ["Hollowbrook remembers", "Your deed became someone else’s story. Every memory has a source.", "Explore the town"],
  };
  const cue = tourCopy[game.tour];
  async function nextBeat() {
    if (game.tour === 1) openAction("sword");
    else if (game.tour === 2) game.select("garrick");
    else if (game.tour === 3 || game.tour === 4) { game.setDrawer(undefined); await game.advance(); }
    else if (game.tour === 5) await game.explain("garrick");
    else { game.setDrawer(undefined); game.finishTour(); }
  }
  return <main className={`living-town minimal-town ${game.reduced ? "reduce-motion" : ""} ${game.largeText ? "large-text" : ""}`}>
    <div inert={Boolean(game.drawer || action || compare)}>
      {!game.textMode && <TownStage town={town} eventId={game.eventId} selected={game.selected} beat={game.beats[0]} why={game.why}
        quiet showSword={game.tour === 1} lens={lens} reduced={game.reduced} paused={Boolean(game.busy)} onSelect={game.select} onSword={() => !frozen && openAction("sword")} />}
      <MinimalChrome tour={game.tour} cue={cue} narration={game.busy || game.narration} busy={frozen}
        onMenu={() => game.setDrawer("settings")} onLedger={() => game.setDrawer("ledger")}
        onBegin={() => game.setTour(1)} onSkip={game.finishTour} onNext={() => void nextBeat()}
        onAction={() => openAction("free")} onAdvance={() => void game.advance()} />
      {game.textMode && <section className="text-story" aria-label="Story as text"><h2 className="font-serif text-3xl">Your story, as text</h2><p>Walking is decoration. Only recorded actions change the world.</p>{deed && <p>Selected deed: <strong>{deed.title}</strong></p>}{town.npcs.map((person) => <article key={person.id}><h3>{person.name} · {person.role}</h3><p>Attitude: {person.attitude}. {deed ? memoryText(person, deed.id) : "No deeds yet."}</p><Button onClick={() => game.select(person.id)}>Talk to {person.name}</Button></article>)}<ol>{game.log.map((line, i) => <li key={i}>{line}</li>)}</ol></section>}
    </div>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{game.busy || game.narration}</p>
    {game.offline && <p className="status-banner" role="alert">You are offline. Your last confirmed story is still here.</p>}
    {game.error && !action && <p className="status-banner" role="alert">{game.error}</p>}
    {action && <DeedForm town={town} prepared={action === "sword"} goodDeed={action === "good"} busy={Boolean(game.busy)} error={game.error} onClose={close} onSubmit={async (input) => { const ok = await game.record(input); if (ok) setAction(undefined); return ok; }} />}
    {game.drawer && <PaperDrawer title={game.drawer === "character" ? npc.name : game.drawer === "ledger" ? "The Ledger" : game.drawer === "evidence" ? "Follow the whisper" : game.drawer === "attitude" ? "The weight of a memory" : game.drawer === "engine" ? "Under the hood" : game.drawer === "settings" ? "Menu" : "Begin again?"} onClose={close} dark={game.drawer === "engine"}>
      {game.drawer === "character" && <CharacterSheet key={npc.id} town={town} npc={npc} eventId={game.eventId} busy={frozen} onSpeak={game.speak} onExplain={() => void game.explain()} onAttitude={() => game.setDrawer("attitude")} />}
      {game.drawer === "ledger" && <LedgerSheet town={town} eventId={game.eventId} onSelect={(id) => { game.setEventId(id); game.setDrawer(undefined); game.tell(`Following ${town.events.find((e) => e.id === id)?.title}. Select a villager to inspect their memory.`); }} />}
      {game.drawer === "evidence" && <><EvidenceSheet npc={npc} why={game.why} eventTitle={deed?.title} />{game.tour === 6 && <div className="space-y-3 mt-6"><h3 className="font-serif text-3xl">Now you have seen how Hollowbrook <em>remembers.</em></h3><Button onClick={() => { game.finishTour(); openAction("good"); }}>Try a good deed</Button><Button variant="secondary" disabled={frozen} onClick={() => { game.finishTour(); game.switchSave(game.slot === "a" ? "b" : "a"); }}>Meet a second traveller</Button><Button variant="ghost" onClick={() => { game.finishTour(); close(); }}>Explore the town</Button></div>}</>}
      {game.drawer === "attitude" && <AttitudeSheet town={town} npc={npc} onSelect={(id) => { game.setEventId(id); game.setDrawer("character"); }} />}
      {game.drawer === "engine" && <EngineSheet town={town} selected={npc.id} why={game.why} onSelect={game.select} onCompare={() => { close(); setCompare(true); }} />}
      {game.drawer === "settings" && <TownMenu game={game} lens={lens} onLens={(value) => { setLens(value); game.setDrawer(undefined); }} />}
      {(game.drawer === "reset" || game.drawer === "replay") && <div className="space-y-5"><h3 className="font-serif text-3xl">Reset story {game.slot.toUpperCase()}?</h3><p>This removes its actions, memories and reputation changes. The other traveller’s history is unaffected.</p><Button variant="destructive" disabled={frozen} onClick={() => void game.reset(game.drawer === "replay")}>{game.busy || `Reset story ${game.slot.toUpperCase()}${game.drawer === "replay" ? " and replay" : ""}`}</Button><Button variant="secondary" disabled={frozen} onClick={close}>Keep my story</Button></div>}
    </PaperDrawer>}
    <ControlVsHearsayModal isOpen={compare} playerId={town.playerId} npcId={npc.id} onClose={() => setCompare(false)} />
  </main>;
}
