"use client";
import { useEffect, useState } from "react";
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
import { ResidentsSheet } from "./ResidentsSheet";
import { WhisperFlow } from "./WhisperFlow";
import { useTownClock } from "./use-town-clock";
import { approach, observeAt } from "../../lib/town-space";
import "./town.css";
import "./paper.css";
import "./minimal.css";
import "./cinematic.css";

export function LivingTownApp() {
  const game = useLivingTown();
  const [action, setAction] = useState<"sword" | "free" | "good">();
  const [lens, setLens] = useState<"none" | "bonds" | "whispers">("none");
  const [compare, setCompare] = useState(false);
  const [position, setPosition] = useState(() => approach("brom"));
  const [clockPaused, setClockPaused] = useState(false);
  const { town } = game;
  const clockEnabled = Boolean(town?.events.length && !clockPaused && !game.active && !game.offline && !game.error && !game.drawer && !action && !compare && [0, 3, 4].includes(game.tour));
  const clock = useTownClock(clockEnabled, town?.playerId, town?.tick ?? 0, game.advance);
  useEffect(() => { setPosition(approach("brom")); }, [town?.playerId]);
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
  function openAction(kind: "sword" | "free" | "good") {
    if (kind !== "free") setPosition(approach(kind === "sword" ? "brom" : "garrick"));
    game.setDrawer(undefined); setAction(kind);
  }
  function selectResident(id: string) { setPosition(approach(id)); game.select(id); }
  const nearby = observeAt(position, town);
  const location = `At ${nearby.place?.name ?? "the road"} · Nearby: ${nearby.witnesses.map((n) => n.name).join(", ") || "nobody"}`;
  const clockLabel = clockPaused || game.error || game.offline ? "Town paused" : !town.events.length ? "Town is quiet" : game.active ? "Following the story" : clock.running ? `Next whispers in ${clock.remaining}s` : "Time pauses while you read";
  const tourCopy: Record<number, [string, string, string]> = {
    1: ["One small deed", "An iron sword rests at Brom’s forge. He is close enough to see everything.", "Look at the sword"],
    2: ["Does Garrick know?", "Brom saw you. Garrick hasn’t heard yet. Ask the guard what he knows.", "Talk to Garrick"],
    3: ["Let word spread", "Gossip spreads automatically while you explore. Watch the next whisper, or wait ahead.", "Wait ahead"],
    4: ["One person at a time", "Someone who just learned a story can tell it next turn. The town keeps talking on its own.", "Wait ahead"],
    5: ["Follow the whisper", "Look at Garrick’s memory and opinion. The graph can show exactly how he learned.", "How did he find out?"],
    6: ["Hollowbrook remembers", "Your deed became someone else’s story. Every memory has a source.", "Explore the town"],
  };
  const cue = tourCopy[game.tour];
  async function nextBeat() {
    if (game.tour === 1) openAction("sword");
    else if (game.tour === 2) selectResident("garrick");
    else if (game.tour === 3 || game.tour === 4) { game.setDrawer(undefined); await game.advance(); }
    else if (game.tour === 5) await game.explain("garrick");
    else { game.setDrawer(undefined); game.finishTour(); }
  }
  return <main className={`living-town minimal-town ${game.tour === -1 ? "tour-arrival" : ""} ${game.reduced ? "reduce-motion" : ""} ${game.largeText ? "large-text" : ""}`}>
    <div inert={Boolean(game.drawer || action || compare)}>
      {!game.textMode && <TownStage town={town} eventId={game.beats[0]?.eventId ?? game.eventId} selected={game.selected} beat={game.beats[0]} why={game.why}
        position={position} onPosition={setPosition} quiet showSword={game.tour === 1} lens={lens} reduced={game.reduced} paused={Boolean(game.busy)} onFocus={game.setSelected} onSelect={selectResident} onSword={() => !frozen && openAction("sword")} />}
      <MinimalChrome tour={game.tour} cue={cue} narration={game.busy || game.narration} busy={frozen}
        location={location} clock={{ paused: clockPaused || Boolean(game.error), label: clockLabel, onToggle: () => { if (game.error) { game.clearError(); setClockPaused(false); } else setClockPaused(!clockPaused); } }}
        flow={!game.textMode && <WhisperFlow beat={game.beats[0]} remaining={game.beats.length} lastBeats={game.lastBeats} npcs={town.npcs} tick={town.tick} busy={frozen} onReplay={game.replayWhispers} />}
        onMenu={() => game.setDrawer("settings")} onLedger={() => game.setDrawer("ledger")}
        onBegin={() => game.setTour(1)} onSkip={game.finishTour} onNext={() => void nextBeat()}
        onAction={() => openAction("free")} onAdvance={() => void game.advance()} />
      {game.textMode && <section className="text-story" aria-label="Story as text"><h2 className="font-serif text-3xl">Your story, as text</h2><label>Walk near a villager<select aria-label="Walk to a villager" onChange={(e) => setPosition(approach(e.target.value))} value=""><option value="" disabled>Choose someone to approach…</option>{town.npcs.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><p>{location}. Nearby villagers witness recorded actions.</p>{deed && <p>Selected deed: <strong>{deed.title}</strong></p>}{town.npcs.map((person) => <article key={person.id}><h3>{person.name} · {person.role}</h3><p>Attitude: {person.attitude}. {deed ? memoryText(person, deed.id) : "No deeds yet."}</p><Button onClick={() => selectResident(person.id)}>Talk to {person.name}</Button></article>)}<ol>{game.log.map((line, i) => <li key={i}>{line}</li>)}</ol></section>}
    </div>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{game.busy || game.narration}</p>
    {game.offline && <p className="status-banner" role="alert">You are offline. Your last confirmed story is still here.</p>}
    {game.error && !action && <p className="status-banner" role="alert">{game.error}</p>}
    {action && <DeedForm town={town} prepared={action === "sword"} goodDeed={action === "good"} position={position} busy={Boolean(game.busy)} error={game.error} onClose={close} onSubmit={async (input) => { const observation = observeAt(position, town); const ok = await game.record({ ...input, placeId: observation.place?.id ?? "", witnesses: observation.witnesses.map((n) => n.id) }); if (ok) setAction(undefined); return ok; }} />}
    {game.drawer && <PaperDrawer title={game.drawer === "residents" ? "Meet the villagers" : game.drawer === "character" ? npc.name : game.drawer === "ledger" ? "The Ledger" : game.drawer === "evidence" ? "Follow the whisper" : game.drawer === "attitude" ? "The weight of a memory" : game.drawer === "engine" ? "Under the hood" : game.drawer === "settings" ? "Menu" : "Begin again?"} onClose={close} dark={game.drawer === "engine"}>
      {game.drawer === "residents" && <ResidentsSheet npcs={town.npcs} onSelect={selectResident} />}
      {game.drawer === "character" && <CharacterSheet key={npc.id} town={town} npc={npc} eventId={game.eventId} busy={frozen} onSpeak={game.speak} onExplain={() => void game.explain()} onAttitude={() => game.setDrawer("attitude")} />}
      {game.drawer === "ledger" && <LedgerSheet town={town} eventId={game.eventId} onSelect={(id) => { game.setEventId(id); game.setDrawer(undefined); game.tell(`Following ${town.events.find((e) => e.id === id)?.title}. Select a villager to inspect their memory.`); }} />}
      {game.drawer === "evidence" && <><EvidenceSheet npc={npc} why={game.why} eventTitle={deed?.title} />{game.tour === 6 && <div className="space-y-3 mt-6"><h3 className="font-serif text-3xl">Now you have seen how Hollowbrook <em>remembers.</em></h3><Button onClick={() => { game.finishTour(); openAction("good"); }}>Try a good deed</Button><Button variant="secondary" disabled={frozen} onClick={() => { game.finishTour(); game.switchSave(game.slot === "a" ? "b" : "a"); }}>Meet a second traveller</Button><Button variant="ghost" onClick={() => { game.finishTour(); close(); }}>Explore the town</Button></div>}</>}
      {game.drawer === "attitude" && <AttitudeSheet town={town} npc={npc} onSelect={(id) => { game.setEventId(id); game.setDrawer("character"); }} />}
      {game.drawer === "engine" && <EngineSheet town={town} selected={npc.id} why={game.why} onSelect={selectResident} onCompare={() => { close(); setCompare(true); }} />}
      {game.drawer === "settings" && <TownMenu game={game} lens={lens} onLens={(value) => { setLens(value); game.setDrawer(undefined); }} />}
      {(game.drawer === "reset" || game.drawer === "replay") && <div className="space-y-5"><h3 className="font-serif text-3xl">Reset story {game.slot.toUpperCase()}?</h3><p>This removes its actions, memories and reputation changes. The other traveller’s history is unaffected.</p><Button variant="destructive" disabled={frozen} onClick={() => void game.reset(game.drawer === "replay")}>{game.busy || `Reset story ${game.slot.toUpperCase()}${game.drawer === "replay" ? " and replay" : ""}`}</Button><Button variant="secondary" disabled={frozen} onClick={close}>Keep my story</Button></div>}
    </PaperDrawer>}
    <ControlVsHearsayModal isOpen={compare} playerId={town.playerId} npcId={npc.id} onClose={() => setCompare(false)} />
  </main>;
}
