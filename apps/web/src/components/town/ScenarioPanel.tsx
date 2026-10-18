"use client";
import { useState } from "react";
import { nextCampaignLevel } from "../../lib/campaign";
import { useCampaign } from "./use-campaign";
import { CampaignDemo } from "./CampaignDemo";
import { CampaignMap } from "./CampaignMap";
import { CampaignAdvance } from "./CampaignAdvance";
import { MissionBrief } from "./MissionBrief";
import { missions } from "../../lib/mission-catalog";
import { isMissionId } from "../../lib/missions";
import { CrossingBrief } from "./CrossingBrief";
import { Button } from "../ui/button";
import { scenarioChoices, scenarios } from "../../lib/scenarios";
import type { ScenarioId } from "../../lib/scenarios";
import { scenarioState } from "../../lib/scenario-state";
import type { TownState } from "../../lib/types";
import { PuzzleNotebook } from "./PuzzleNotebook";
import type { DetectiveAnswer } from "../../lib/puzzle";

export function ScenarioPicker({ busy, onStart }: { busy: boolean; onStart: (id: ScenarioId) => void }) {
  const campaign = useCampaign(), [demo, setDemo] = useState(false);
  if (demo) return <CampaignDemo onClose={() => setDemo(false)} onComplete={() => { campaign.completeDemo(); setDemo(false); }} />;
  const next = nextCampaignLevel(campaign.progress);
  return <section className="space-y-4" aria-label="Campaign levels"><h2 className="font-serif text-3xl">A town that remembers.</h2><p>Learn the rules, then play the stories in order. Complete each mission to unlock the next. You can replay completed levels; a loss keeps your current level open.</p>
    <p className="paper-caption">{campaign.progress.demo && !next ? "Campaign complete. Every story is available to replay." : "Follow the path. Your next available stop is marked Ready."}</p>
    <CampaignMap progress={campaign.progress} busy={busy || !campaign.ready} onDemo={() => setDemo(true)} onStart={onStart} />
  </section>;
}
export function ScenarioPanel({ town, busy, onWalk, onVerdict, onGraph, onRestart, onExit, onChoose, onAccuse }: {
  town: TownState; busy: boolean; onWalk: (id: string) => void; onVerdict: () => void;
  onGraph: () => void; onRestart: (id: ScenarioId) => void; onExit: () => void;
  onChoose?: () => void;
  onAccuse?: (answer: DetectiveAnswer) => void;
}) {
  if (town.puzzle?.story) return <><CampaignAdvance town={town} busy={busy} onStart={onRestart} /><MissionBrief town={town} busy={busy} onWalk={onWalk} onGraph={onGraph} onRestart={() => onRestart(town.puzzle?.story?.mission ?? "medicine")} onChoose={onChoose} onAccuse={onAccuse} /></>;
  if (town.puzzle?.crossing) return <><CampaignAdvance town={town} busy={busy} onStart={onRestart} /><CrossingBrief town={town} busy={busy} onWalk={onWalk} onGraph={onGraph} onRestart={() => onRestart("crossing")} onChoose={onChoose} /></>;
  const state = scenarioState(town);
  if (!state) return <p>No scenario selected.</p>;
  const playing = state.stage === "playing";
  const stops = state.id === "detective" || state.id === "alliance" || state.id === "coverup" ? town.npcs.map((npc) => npc.id) : [...new Set([...scenarioChoices.filter((choice) => choice.scenario === state.id).map((choice) => choice.npc), "garrick"])];
  return <section className="challenge-panel" aria-label="Scenario objective"><p className="paper-eyebrow">{playing ? `${state.remaining} turns remaining` : state.stage === "won" ? "Scenario won" : "Game over"}</p><h2>{state.title}</h2><p>{scenarios[state.id].brief}</p>
    {town.puzzle && playing && <p className="font-mono tabular-nums">{town.puzzle.ap}/2 AP · turn {town.tick}/{scenarios[state.id].deadline}</p>}
    <p className="font-mono tabular-nums">Garrick’s trust: {state.trust === undefined ? "hidden" : `${Math.round(state.trust)}/100`}</p><p className="paper-caption">{town.puzzle ? "Questions and deeds cost 1 AP. At 0 AP the turn ends; gossip spreads and the budget resets. Refused requests also cost AP. Exact knowledge and scores unlock at the verdict." : "50 is neutral. At 20 or below, you lose immediately. Every choice costs one turn; each favour is available once."}</p>
    <ul className="space-y-2">{state.goals.map((goal) => <li key={goal.text}>{goal.complete === undefined ? "Unconfirmed" : goal.complete ? "Met" : "Needed"} · {goal.text}</li>)}</ul><p role="status">{state.reason}</p>
    {town.puzzle && <PuzzleNotebook key={town.playerId} town={town} busy={busy} onAccuse={onAccuse} />}
    {playing && <><h3>Where will you go?</h3><div className="flex flex-wrap gap-2">{stops.map((id) => <Button key={id} variant="secondary" disabled={busy} onClick={() => onWalk(id)}>Visit {town.npcs.find((npc) => npc.id === id)?.name ?? id}</Button>)}</div><p className="paper-caption">Walk there, then open the location’s choices. Read the risks before committing.</p><Button variant="secondary" disabled={busy} onClick={onVerdict}>Wait until the verdict ({state.remaining} turns)</Button><p className="paper-caption">This commits the remaining turns. Gossip keeps spreading and unfinished objectives fail.</p></>}
    <Button variant="secondary" disabled={busy} onClick={onGraph}>{town.puzzle?.fog ? "View public trust network" : "Reveal the memory graph"}</Button>
    {!playing && <Button disabled={busy} onClick={() => onRestart(state.id)}>Retry this scenario</Button>}
    {onChoose && <Button variant="secondary" disabled={busy} onClick={onChoose}>Campaign levels</Button>}
    <Button variant="ghost" disabled={busy} onClick={onExit}>Return to free play</Button>
  </section>;
}
