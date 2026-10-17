"use client";
import { Button } from "../ui/button";
import { scenarioChoices, scenarios } from "../../lib/scenarios";
import type { ScenarioId } from "../../lib/scenarios";
import { scenarioState } from "../../lib/scenario-state";
import type { TownState } from "../../lib/types";

export function ScenarioPicker({ busy, onStart }: { busy: boolean; onStart: (id: ScenarioId) => void }) {
  return <section className="space-y-4" aria-label="Choose a scenario"><h2 className="font-serif text-3xl">Choose your story.</h2><p>A fresh, separate save for each attempt. Walking and reading are free. Each committed choice or wait advances gossip one turn.</p>
    {(Object.entries(scenarios) as [ScenarioId, (typeof scenarios)[ScenarioId]][]).map(([id, spec]) => <article className="memory-paper space-y-3" key={id}><h3 className="font-serif text-2xl">{spec.title}</h3><p>{spec.brief}</p><p className="paper-caption">{spec.deadline} turns · Garrick’s trust at 20 or below means game over.</p><Button disabled={busy} onClick={() => onStart(id)}>Play {spec.title}</Button></article>)}
  </section>;
}
export function ScenarioPanel({ town, busy, onWalk, onVerdict, onGraph, onRestart, onExit }: {
  town: TownState; busy: boolean; onWalk: (id: string) => void; onVerdict: () => void;
  onGraph: () => void; onRestart: (id: ScenarioId) => void; onExit: () => void;
}) {
  const state = scenarioState(town);
  if (!state) return <p>No scenario selected.</p>;
  const playing = state.stage === "playing";
  const stops = [...new Set(scenarioChoices.filter((choice) => choice.scenario === state.id).map((choice) => choice.npc))];
  return <section className="challenge-panel" aria-label="Scenario objective"><p className="paper-eyebrow">{playing ? `${state.remaining} turns remaining` : state.stage === "won" ? "Scenario won" : "Game over"}</p><h2>{state.title}</h2><p>{scenarios[state.id].brief}</p>
    <p className="font-mono tabular-nums">Garrick’s trust: {state.trust === undefined ? "Unavailable" : `${Math.round(state.trust)}/100`}</p><p className="paper-caption">50 is neutral. At 20 or below, you lose immediately. Every choice costs one turn; each favour is available once.</p>
    <ul className="space-y-2">{state.goals.map((goal) => <li key={goal.text}>{goal.complete ? "Met" : "Needed"} · {goal.text}</li>)}</ul><p role="status">{state.reason}</p>
    {playing && <><h3>Where will you go?</h3><div className="flex flex-wrap gap-2">{stops.map((id) => <Button key={id} variant="secondary" disabled={busy} onClick={() => onWalk(id)}>Visit {town.npcs.find((npc) => npc.id === id)?.name ?? id}</Button>)}</div><p className="paper-caption">Walk there, then open the location’s choices. Read the risks before committing.</p><Button variant="secondary" disabled={busy} onClick={onVerdict}>Wait until the verdict ({state.remaining} turns)</Button><p className="paper-caption">This commits the remaining turns. Gossip keeps spreading and unfinished objectives fail.</p></>}
    <Button variant="secondary" disabled={busy} onClick={onGraph}>Inspect the memory graph</Button>
    {!playing && <Button disabled={busy} onClick={() => onRestart(state.id)}>Retry this scenario</Button>}
    <Button variant="ghost" disabled={busy} onClick={onExit}>Return to free play</Button>
  </section>;
}
