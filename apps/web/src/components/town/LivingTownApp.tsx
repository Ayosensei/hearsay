"use client";
import { useState } from "react";
import { BookOpen, Flame as Lantern, Footprints, Route, Settings, Network, VolumeX, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { useLivingTown } from "./use-living-town";
import { TownStage, memoryText } from "./TownStage";
import { PaperDrawer } from "./PaperDrawer";
import { DeedForm } from "./DeedForm";
import { CharacterSheet } from "./CharacterSheet";
import { LedgerSheet, EvidenceSheet, AttitudeSheet } from "./StorySheets";
import { GraphPanel } from "../GraphPanel";
import { TracePanel } from "../TracePanel";
import { ControlVsHearsayModal } from "../ControlVsHearsayModal";
import "./town.css";
import "./paper.css";

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
  return <main className={`living-town ${game.reduced ? "reduce-motion" : ""} ${game.largeText ? "large-text" : ""}`}>
    <div inert={Boolean(game.drawer || action || compare)}>
      {!game.textMode && <TownStage town={town} eventId={game.eventId} selected={game.selected} beat={game.beats[0]} why={game.why}
        lens={lens} reduced={game.reduced} paused={Boolean(game.busy)} onSelect={game.select} onSword={() => !frozen && openAction("sword")} />}
      <header className="town-topline">
        <div className="town-brand"><Button className="town-tag" variant="secondary" onClick={() => game.setDrawer("ledger")}><BookOpen size={18} /> Ledger{town.events.length > 0 && ` · ${town.events.length}`}</Button><span>Hearsay</span></div>
        <div><div className="flex gap-2 items-center">
          {["a", "b"].map((slot) => <Button key={slot} variant="secondary" className="town-tag" aria-pressed={game.slot === slot} disabled={frozen} title="Same town, separate history. Saved in this browser." onClick={() => game.switchSave(slot)}>Traveller {slot.toUpperCase()}</Button>)}
          <Button variant="ghost" size="icon" aria-label="Settings and accessibility" onClick={() => game.setDrawer("settings")}><Settings size={19} /></Button>
        </div><p className="turn-label">TURN {String(town.tick).padStart(2, "0")} · <VolumeX size={12} className="inline" /> Silent town</p></div>
      </header>
      <div className="town-title"><span className="eyebrow">Hollowbrook · A living story</span><h1>A town that <em>remembers.</em></h1><p>Do one thing. Then watch Hollowbrook talk about it.</p></div>
      {game.tour === -1 && <section className="arrival-card" aria-label="Begin your story"><p className="paper-eyebrow">An invitation from Hollowbrook</p><h2>Traveller, <em>arrive.</em></h2><p>Take a sword. Only Brom sees you.<br />Follow the whisper to the guard captain.</p><Button onClick={() => game.setTour(1)}>Step into Hollowbrook <ArrowRight size={17} /></Button><Button variant="ghost" onClick={game.finishTour}>Explore freely</Button><small>About one minute. Three villagers. Every reaction explained.</small></section>}
      {cue && <section className="story-cue" aria-label="Your next step"><div className="story-progress" aria-label={`Step ${game.tour} of 6`}>{[1, 2, 3, 4, 5, 6].map((i) => <span key={i} className={i <= game.tour ? "done" : ""} />)}</div><h2>{cue[0]}</h2><p>{cue[1]}</p><Button disabled={frozen} onClick={() => void nextBeat()}>{cue[2]}</Button><button className="skip-tour" onClick={game.finishTour}>Skip the tour</button></section>}
      {game.textMode && <section className="text-story" aria-label="Story as text"><h2 className="font-serif text-3xl">Your story, as text</h2><p>Walking is decoration. Only recorded actions change the world.</p>{deed && <p>Selected deed: <strong>{deed.title}</strong></p>}{town.npcs.map((person) => <article key={person.id}><h3>{person.name} · {person.role}</h3><p>Attitude: {person.attitude}. {deed ? memoryText(person, deed.id) : "No deeds yet."}</p><Button onClick={() => game.select(person.id)}>Talk to {person.name}</Button></article>)}<ol>{game.log.map((line, i) => <li key={i}>{line}</li>)}</ol></section>}
      <footer className="town-bottom">
        <p className="narrator-strip" role="status" aria-live="polite" aria-atomic="true">{game.busy || game.narration}</p>
        <div className="action-dock" aria-label="Story actions" onKeyDown={(event) => { if (event.key === " " && event.target === event.currentTarget && !frozen) { event.preventDefault(); void game.advance(); } }} tabIndex={0}>
          <Button variant="secondary" className="town-tag" disabled={frozen} onClick={() => openAction("free")}><Footprints size={18} /> Take an action</Button>
          <Button disabled={frozen} onClick={() => void game.advance()} title="Advance exactly one turn. People can pass on what they already know."><Lantern size={20} /> {game.beats.length ? "Hollowbrook is talking…" : "Let the town talk"}</Button>
          <Button variant="secondary" className="town-tag" disabled={frozen || !deed} title={deed ? `Trace ${deed.title} to ${npc.name}` : "Create an action first, then follow how people learn about it."} onClick={() => void game.explain()}><Route size={18} /> Trace a story</Button>
        </div>
        <div className="lens-controls"><Button variant="ghost" aria-pressed={lens === "bonds"} onClick={() => setLens(lens === "bonds" ? "none" : "bonds")}>Bonds · who trusts whom</Button><Button variant="ghost" aria-pressed={lens === "whispers"} onClick={() => setLens(lens === "whispers" ? "none" : "whispers")}>Whispers · confirmed routes</Button><Button variant="ghost" onClick={() => game.setDrawer("engine")}><Network size={14} /> Under the hood</Button></div>
      </footer>
    </div>
    {game.offline && <p className="status-banner" role="alert">You are offline. Your last confirmed story is still here.</p>}
    {game.error && !action && <p className="status-banner" role="alert">{game.error}</p>}
    {action && <DeedForm town={town} prepared={action === "sword"} goodDeed={action === "good"} busy={Boolean(game.busy)} error={game.error} onClose={close} onSubmit={async (input) => { const ok = await game.record(input); if (ok) setAction(undefined); return ok; }} />}
    {game.drawer && <PaperDrawer title={game.drawer === "character" ? npc.name : game.drawer === "ledger" ? "The Ledger" : game.drawer === "evidence" ? "Follow the whisper" : game.drawer === "attitude" ? "The weight of a memory" : game.drawer === "engine" ? "Under the hood" : game.drawer === "settings" ? "Your traveller’s kit" : "Begin again?"} onClose={close} dark={game.drawer === "engine"}>
      {game.drawer === "character" && <CharacterSheet key={npc.id} town={town} npc={npc} eventId={game.eventId} busy={frozen} onSpeak={game.speak} onExplain={() => void game.explain()} onAttitude={() => game.setDrawer("attitude")} />}
      {game.drawer === "ledger" && <LedgerSheet town={town} eventId={game.eventId} onSelect={(id) => { game.setEventId(id); game.setDrawer(undefined); game.tell(`Following ${town.events.find((e) => e.id === id)?.title}. Select a villager to inspect their memory.`); }} />}
      {game.drawer === "evidence" && <><EvidenceSheet npc={npc} why={game.why} eventTitle={deed?.title} />{game.tour === 6 && <div className="space-y-3 mt-6"><h3 className="font-serif text-3xl">Now you have seen how Hollowbrook <em>remembers.</em></h3><Button onClick={() => { game.finishTour(); openAction("good"); }}>Try a good deed</Button><Button variant="secondary" disabled={frozen} onClick={() => { game.finishTour(); game.switchSave(game.slot === "a" ? "b" : "a"); }}>Meet a second traveller</Button><Button variant="ghost" onClick={() => { game.finishTour(); close(); }}>Explore the town</Button></div>}</>}
      {game.drawer === "attitude" && <AttitudeSheet town={town} npc={npc} onSelect={(id) => { game.setEventId(id); game.setDrawer("character"); }} />}
      {game.drawer === "engine" && <div className="space-y-5"><p className="text-sm text-text-secondary">Live FalkorDB tools. Whispers and evidence come from confirmed responses.</p><div className="engine-graph"><GraphPanel nodes={town.graphNodes} edges={town.graphEdges} selectedNpcId={npc.id} activePathEdgeIds={game.why?.edgeIds ?? []} onSelectNode={(id) => game.select(id.replace("NPC:", ""))} /></div><TracePanel traces={town.recentTraces} /><details><summary>Exact attitude scores</summary>{town.npcs.map((n) => <p className="font-mono text-xs" key={n.id}>{n.name}: {n.attitudeScore.toFixed(6)} ({n.attitude})</p>)}</details><Button variant="secondary" onClick={() => { close(); setCompare(true); }}>Compare knowledge boundaries</Button><p className="text-xs text-text-secondary">Template replies may show no vocabulary leak. Comparison reports actual outcomes only.</p></div>}
      {game.drawer === "settings" && <div className="space-y-5"><p>Same town, separate history. Actions in one save do not affect the other. Saves belong to this browser.</p><Button variant="secondary" aria-pressed={game.reduced} onClick={() => game.setReduced(!game.reduced)}>Reduced motion: {game.reduced ? "on" : "off"}</Button><Button variant="secondary" aria-pressed={game.textMode} onClick={() => game.setTextMode(!game.textMode)}>Story as text: {game.textMode ? "on" : "off"}</Button><Button variant="secondary" aria-pressed={game.largeText} onClick={() => game.setLargeText(!game.largeText)}>Larger text: {game.largeText ? "on" : "off"}</Button><p className="paper-caption">Readable Geist is used throughout. Audio is off. World memories survive reload; visible chat history may not return.</p><Button variant="secondary" disabled={frozen} onClick={() => game.setDrawer("replay")}><RotateCcw size={16} /> Replay the sword story</Button><Button variant="destructive" disabled={frozen} onClick={() => game.setDrawer("reset")}>Reset story {game.slot.toUpperCase()}</Button></div>}
      {(game.drawer === "reset" || game.drawer === "replay") && <div className="space-y-5"><h3 className="font-serif text-3xl">Reset story {game.slot.toUpperCase()}?</h3><p>This removes its actions, memories and reputation changes. The other traveller’s history is unaffected.</p><Button variant="destructive" disabled={frozen} onClick={() => void game.reset(game.drawer === "replay")}>{game.busy || `Reset story ${game.slot.toUpperCase()}${game.drawer === "replay" ? " and replay" : ""}`}</Button><Button variant="secondary" disabled={frozen} onClick={close}>Keep my story</Button></div>}
    </PaperDrawer>}
    <ControlVsHearsayModal isOpen={compare} playerId={town.playerId} npcId={npc.id} onClose={() => setCompare(false)} />
  </main>;
}
