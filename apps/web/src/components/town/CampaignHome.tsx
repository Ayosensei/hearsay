"use client";
import { useState } from "react";
import { MissionResultDialog } from "./MissionResultDialog";
import { Button } from "../ui/button";
import { ScenarioPicker } from "./ScenarioPanel";
import type { ScenarioId } from "../../lib/scenarios";
import type { TownState } from "../../lib/types";
import { campaignOrder, canPlayLevel } from "../../lib/campaign";
import { useCampaign } from "./use-campaign";
import { scenarioState } from "../../lib/scenario-state";

export function CampaignHome({ town, busy, error, onStart, onReturn }: { town: TownState; busy: boolean; error: string; onStart: (id: ScenarioId) => void; onReturn: () => void }) {
  const { progress } = useCampaign();
  const result = scenarioState(town);
  const ended = result?.stage === "won" || result?.stage === "lost";
  const index = campaignOrder.findIndex((id) => id === result?.id);
  const next = index >= 0 ? campaignOrder[index + 1] : undefined;
  const [dismissed, setDismissed] = useState("");
  const resultKey = `${town.playerId}:${result?.stage}`;
  const showResult = ended && dismissed !== resultKey;
  const dismiss = () => setDismissed(resultKey);
  const start = (id: ScenarioId) => { dismiss(); onStart(id); };
  return <><main className="campaign-home" inert={showResult}><div className="campaign-home-inner">
    <header className="campaign-home-header"><span className="font-serif text-3xl">Hearsay</span><span className="paper-eyebrow">Hollowbrook · Campaign home</span></header>
    {ended && <section className="campaign-result" role="status"><div><p className="paper-eyebrow">{result.stage === "won" ? "Level complete · progress saved" : "Attempt ended · try another route"}</p><h2 className="font-serif text-2xl">{town.puzzle?.story?.ending ?? town.puzzle?.crossing?.ending ?? result.reason}</h2><p>{result.stage === "won" ? "Continue to the next level, or replay this one." : "Retry this level with a fresh clock and a different plan."}</p><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => onStart(result.id)}>Retry level</Button>{result.stage === "won" && next && <Button disabled={busy || !canPlayLevel(progress, next)} onClick={() => onStart(next)}>Next level</Button>}{result.stage === "won" && !next && <p>Campaign complete. All finished levels can be replayed below.</p>}<Button variant="secondary" disabled={busy} onClick={onReturn}>View ending and revealed graph</Button></div></div></section>}
    {error && <p className="paper-error" role="alert">{error}</p>}
    <ScenarioPicker busy={busy} onStart={onStart} />
    {result?.stage === "playing" && <Button variant="secondary" disabled={busy} onClick={onReturn}>Resume current mission · deadline still running</Button>}
    <footer className="paper-caption">Progress is saved in this browser. Complete a level to unlock the next; finished stories can be replayed.</footer>
  </div></main>{showResult && <MissionResultDialog won={result.stage === "won"} title={result.title} ending={town.puzzle?.story?.ending ?? town.puzzle?.crossing?.ending ?? result.reason} turn={town.tick} next={result.stage === "won" ? next : undefined} nextLocked={Boolean(next && !canPlayLevel(progress, next))} busy={busy} onStart={start} onRetry={() => start(result.id)} onMap={dismiss} onReview={() => { dismiss(); onReturn(); }} />}</>;
}
