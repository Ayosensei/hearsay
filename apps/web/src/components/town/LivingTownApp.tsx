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
import { challengeStage } from "../../lib/challenge";
import { ChallengePanel, goalTitles } from "./ChallengePanel";
import { MemoryWorld } from "./MemoryWorld";
import { GraphPeek } from "./GraphPeek";
import { ScenarioPanel, ScenarioPicker } from "./ScenarioPanel";
import { LocationChoices } from "./LocationChoices";
import { scenarioState } from "../../lib/scenario-state";
import { scenarioFromPlayer, scenarios, guardTrust } from "../../lib/scenarios";
import type { ScenarioId } from "../../lib/scenarios";
import { PuzzleInterview } from "./PuzzleInterview";
import "./town.css";
import "./paper.css";
import "./minimal.css";
import "./cinematic.css";

export function LivingTownApp() {
  const game = useLivingTown();
  const [action, setAction] = useState<"sword" | "free" | "good" | "location">();
  const [lens, setLens] = useState<"none" | "bonds" | "whispers">("none");
  const [compare, setCompare] = useState(false);
  const [position, setPosition] = useState(() => approach("brom"));
  const [clockPaused, setClockPaused] = useState(false);
  const [view, setView] = useState<"town" | "graph">("town");
  const { town } = game;
  const scenario = town ? scenarioState(town) : undefined;
  const goal = town && game.challenge ? challengeStage(town, game.challenge.targetEventId) : undefined;
  const trustCollapsed = town && !town.puzzle ? (guardTrust(town) ?? 100) <= 20 : false;
  const finished = Boolean((scenario && scenario.stage !== "playing") || trustCollapsed || goal === "won" || goal === "lost" || goal === "unavailable");
  const clockEnabled = Boolean(!scenario && !finished && town?.events.length && !clockPaused && !game.active && !game.offline && !game.error && !game.drawer && !action && !compare && [0, 3, 4].includes(game.tour));
  const clock = useTownClock(clockEnabled, town?.playerId, town?.tick ?? 0, game.advance);
  useEffect(() => { const id = scenarioFromPlayer(town?.playerId); setPosition(approach(id ? scenarios[id].start : "brom")); }, [town?.playerId]);
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
    if (finished) return;
    if (scenario) { game.setDrawer(undefined); setAction("location"); return; }
    if (kind !== "free") setPosition(approach(kind === "sword" ? "brom" : "garrick"));
    game.setDrawer(undefined); setAction(kind);
  }
  function selectResident(id: string) { setPosition(approach(id)); game.select(id); }
  async function startQuest() { await game.startChallenge(); setView("town"); setClockPaused(false); }
  async function startScenario(id: ScenarioId) { await game.startScenario(id); setView("town"); setAction(undefined); }
  function showGraph() { if (game.tour === -1) game.finishTour(); setView("graph"); game.setDrawer(undefined); }
  function goalGraph() { if (game.challenge?.targetEventId) game.setEventId(game.challenge.targetEventId); game.focus("garrick"); showGraph(); }
  const guard = town.npcs.find((person) => person.id === "garrick");
  const fog = Boolean(town.puzzle?.fog);
  const walk = (id: string) => { setPosition(approach(id)); game.focus(id); game.setDrawer(undefined); setView("town"); };
  const objective = scenario ? <ScenarioPanel onAccuse={(answer) => void game.scenarioCommand("accuse", undefined, undefined, { answer })} onChoose={() => game.setDrawer("scenarios")} town={town} busy={frozen} onWalk={walk} onVerdict={() => void game.scenarioCommand("verdict")} onGraph={showGraph} onRestart={(id) => void startScenario(id)} onExit={() => { void game.load("a"); setView("town"); }} /> : <div className="space-y-6">{trustCollapsed && <p role="status" className="paper-error">Game over. Garrick’s trust reached 20 or below. Start a scenario or reset this traveller from Menu.</p>}<ScenarioPicker busy={frozen} onStart={(id) => void startScenario(id)} /><details><summary>The original sword challenge</summary><ChallengePanel stage={goal} attitude={guard?.attitude} busy={frozen} onStart={() => void startQuest()} onSword={() => openAction("sword")} onWalk={() => walk("garrick")} onGraph={goalGraph} onExit={() => { void game.load("a"); setView("town"); }} /></details></div>;
  const nearby = observeAt(position, town);
  const location = `At ${nearby.place?.name ?? "the road"} · Nearby: ${nearby.witnesses.map((n) => n.name).join(", ") || "nobody"}`;
  const clockLabel = finished ? "Story finished · reveal unlocked" : town.puzzle ? `${town.puzzle.ap}/2 AP · Turn ${town.tick}/${scenarios[town.puzzle.state.id].deadline} · End turn to spread gossip` : scenario ? `${scenario.remaining} turns left · choices spread gossip` : clockPaused || game.error || game.offline ? "Town paused" : !town.events.length ? "Town is quiet" : game.active ? "Following the story" : clock.running ? `Next whispers in ${clock.remaining}s` : "Time pauses while you read";
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
  return <main className={`living-town minimal-town has-objective ${game.tour === -1 ? "tour-arrival" : ""} ${game.reduced ? "reduce-motion" : ""} ${game.largeText ? "large-text" : ""}`}>
    <div inert={Boolean(game.drawer || action || compare)}>
      {view === "town" && !game.textMode && <TownStage town={town} eventId={game.beats[0]?.eventId ?? game.eventId} selected={game.selected} beat={game.beats[0]} why={game.why}
        position={position} onPosition={setPosition} quiet showSword={game.tour === 1} lens={fog && lens === "whispers" ? "none" : lens} reduced={game.reduced} paused={Boolean(game.busy)} onFocus={game.setSelected} onSelect={selectResident} onSword={() => !frozen && openAction("sword")} />}
      <MinimalChrome tour={game.tour} cue={cue} narration={game.busy || (scenario && finished ? scenario.reason : trustCollapsed ? "Game over. Garrick’s trust collapsed. Open the objective to start again." : game.narration)} busy={frozen}
        view={view} onView={(next) => next === "graph" ? showGraph() : setView("town")} actionLabel={finished ? "Story finished" : goal === "briefing" ? "Take the sword" : `Explore ${nearby.place?.name ?? "this location"}`} actionDisabled={finished}
        secondaryLabel={town.puzzle ? "End turn · let town talk" : scenario ? "Wait one turn" : undefined} secondaryDisabled={finished}
        location={scenario ? `${location} · ${clockLabel}` : location} clock={scenario ? undefined : { paused: clockPaused || Boolean(game.error), label: clockLabel, onToggle: () => { if (game.error) { game.clearError(); setClockPaused(false); } else setClockPaused(!clockPaused); } }}
        flow={!fog && view === "town" && !game.textMode && <WhisperFlow beat={game.beats[0]} remaining={game.beats.length} lastBeats={game.lastBeats} npcs={town.npcs} tick={town.tick} busy={frozen} onReplay={game.replayWhispers} />}
        onMenu={() => game.setDrawer("settings")} onLedger={() => game.setDrawer("ledger")}
        onBegin={() => { game.finishTour(); game.setDrawer("scenarios"); }} onSkip={game.finishTour} onNext={() => void nextBeat()}
        onAction={() => { if (goal === "briefing") openAction("sword"); else { game.setDrawer(undefined); setAction("location"); } }} onAdvance={() => void game.advance()} />
      {view === "town" && game.tour !== -1 && <><Button variant="ghost" className="objective-badge" onClick={() => game.setDrawer("objective")}><span>{scenario?.stage === "lost" || trustCollapsed ? "Game over" : scenario?.stage === "won" ? "You won" : "Objective"}</span><strong>{scenario?.title ?? (trustCollapsed ? "Trust collapsed" : goal ? goalTitles[goal] : "Choose your scenario")}</strong><small>{town.puzzle ? fog ? `${town.puzzle.ap}/2 AP · ${scenario?.remaining} turns · Knowledge hidden` : "Case closed · Reveal unlocked" : scenario ? `${scenario.remaining} turns · Garrick’s trust ${Math.round(scenario.trust ?? 0)}/100` : goal === "race" ? `Garrick: ${guard?.attitude} · Theft not yet heard` : "Open objectives and choices"}</small></Button>{!game.textMode && !fog && <GraphPeek town={town} eventId={game.eventId} onOpen={showGraph} />}</>}
      {view === "graph" && <MemoryWorld town={town} eventId={game.eventId} selected={game.selected} why={game.why} activeEdges={game.beats[0]?.from ? town.graphEdges.filter((edge) => edge.type === "TOLD" && edge.source === `NPC:${game.beats[0].from}` && edge.target === `NPC:${game.beats[0].to}` && edge.id.endsWith(`:${game.beats[0].eventId}`)).map((edge) => edge.id) : []} busy={frozen} objective={objective} onEvent={game.setEventId} onSelect={game.focus} onExplain={() => void game.explain(game.selected, false)} onTalk={() => selectResident(game.selected)} textOnly={game.textMode} />}
      {game.textMode && view === "town" && <section className="text-story" aria-label="Story as text"><h2 className="font-serif text-3xl">Your story, as text</h2><label>Walk near a villager<select aria-label="Walk to a villager" onChange={(e) => setPosition(approach(e.target.value))} value=""><option value="" disabled>Choose someone to approach…</option>{town.npcs.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><p>{location}. Nearby villagers witness recorded actions.</p>{deed && <p>Selected deed: <strong>{deed.title}</strong></p>}{town.npcs.map((person) => <article key={person.id}><h3>{person.name} · {person.role}</h3><p>Attitude: {person.attitude}. {deed ? memoryText(person, deed.id) : "No deeds yet."}</p><Button onClick={() => selectResident(person.id)}>Talk to {person.name}</Button></article>)}<ol>{game.log.map((line, i) => <li key={i}>{line}</li>)}</ol></section>}
    </div>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{game.busy || game.narration}</p>
    {game.offline && <p className="status-banner" role="alert">You are offline. Your last confirmed story is still here.</p>}
    {game.error && !action && <p className="status-banner" role="alert">{game.error}</p>}
    {action === "location" && <PaperDrawer title="What will you do here?" onClose={close}><LocationChoices town={town} position={position} busy={frozen} error={game.error} onChoose={(id) => { void game.scenarioCommand("choose", id, position).then((ok) => { if (ok) setAction(undefined); }); }} onFreeAction={(input) => { void game.record(input).then((ok) => { if (ok) setAction(undefined); }); }} onCustom={() => setAction("free")} onInspect={() => { void game.scenarioCommand("inspect").then((ok) => { if (ok) setAction(undefined); }); }} /></PaperDrawer>}
    {action && action !== "location" && <DeedForm town={town} prepared={action === "sword"} locked={Boolean(game.challenge) && goal === "briefing"} goodDeed={action === "good"} position={position} busy={Boolean(game.busy)} error={game.error} onClose={close} onSubmit={async (input) => { const observation = observeAt(position, town); const ok = await game.record({ ...input, placeId: observation.place?.id ?? "", witnesses: observation.witnesses.map((n) => n.id) }); if (ok) setAction(undefined); return ok; }} />}
    {game.drawer && <PaperDrawer title={game.drawer === "scenarios" ? "Choose a scenario" : game.drawer === "objective" ? "Your objective" : game.drawer === "residents" ? "Meet the villagers" : game.drawer === "character" ? npc.name : game.drawer === "ledger" ? "The Ledger" : game.drawer === "evidence" ? "Follow the whisper" : game.drawer === "attitude" ? "The weight of a memory" : game.drawer === "engine" ? "Under the hood" : game.drawer === "settings" ? "Menu" : "Begin again?"} onClose={close} dark={game.drawer === "engine"}>
      {game.drawer === "scenarios" && <ScenarioPicker busy={frozen} onStart={(id) => void startScenario(id)} />}{game.drawer === "objective" && objective}
      {game.drawer === "residents" && <ResidentsSheet npcs={town.npcs} onSelect={selectResident} />}
      {game.drawer === "character" && (fog ? <PuzzleInterview key={`${town.playerId}-${npc.id}`} town={town} npc={npc} eventId={game.eventId} busy={frozen} onAsk={() => void game.scenarioCommand("ask", undefined, position, { npcId: npc.id, eventId: game.eventId || town.puzzle?.caseEventId })} onSpeak={(text) => game.speak(text, position)} /> : <CharacterSheet key={npc.id} town={town} npc={npc} eventId={game.eventId} busy={frozen || Boolean(town.puzzle)} onSpeak={(text) => game.speak(text, position)} onExplain={() => void game.explain()} onAttitude={() => game.setDrawer("attitude")} />)}
      {game.drawer === "ledger" && <LedgerSheet town={town} eventId={game.eventId} onSelect={(id) => { game.setEventId(id); game.setDrawer(undefined); game.tell(`Following ${town.events.find((e) => e.id === id)?.title}. Select a villager to inspect their memory.`); }} />}
      {game.drawer === "evidence" && <><EvidenceSheet npc={npc} why={game.why} eventTitle={deed?.title} />{game.tour === 6 && <div className="space-y-3 mt-6"><h3 className="font-serif text-3xl">Now you have seen how Hollowbrook <em>remembers.</em></h3><Button onClick={() => { game.finishTour(); openAction("good"); }}>Try a good deed</Button><Button variant="secondary" disabled={frozen} onClick={() => { game.finishTour(); game.switchSave(game.slot === "a" ? "b" : "a"); }}>Meet a second traveller</Button><Button variant="ghost" onClick={() => { game.finishTour(); close(); }}>Explore the town</Button></div>}</>}
      {game.drawer === "attitude" && <AttitudeSheet town={town} npc={npc} onSelect={(id) => { game.setEventId(id); game.setDrawer("character"); }} />}
      {game.drawer === "engine" && (fog ? <p>The full trace and private graph unlock at the verdict. Use questions to collect dated clues.</p> : <EngineSheet town={town} selected={npc.id} why={game.why} onSelect={selectResident} onCompare={() => { close(); setCompare(true); }} />)}
      {game.drawer === "settings" && <TownMenu game={game} lens={lens} onLens={(value) => { setLens(value); game.setDrawer(undefined); }} />}
      {(game.drawer === "reset" || game.drawer === "replay") && <div className="space-y-5"><h3 className="font-serif text-3xl">Reset story {game.slot.toUpperCase()}?</h3><p>This removes its actions, memories and reputation changes. The other traveller’s history is unaffected.</p><Button variant="destructive" disabled={frozen} onClick={() => void game.reset(game.drawer === "replay")}>{game.busy || `Reset story ${game.slot.toUpperCase()}${game.drawer === "replay" ? " and replay" : ""}`}</Button><Button variant="secondary" disabled={frozen} onClick={close}>Keep my story</Button></div>}
    </PaperDrawer>}
    <ControlVsHearsayModal isOpen={compare && !fog} playerId={town.playerId} npcId={npc.id} onClose={() => setCompare(false)} />
  </main>;
}
