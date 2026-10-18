"use client";
import { Trophy, ShieldX } from "lucide-react";
import { Button } from "../ui/button";
import { PaperDrawer } from "./PaperDrawer";
import type { ScenarioId } from "../../lib/scenarios";

export function MissionResultDialog({ won, title, ending, turn, next, nextLocked, busy, onStart, onRetry, onMap, onReview }: {
  won: boolean; title: string; ending: string; turn: number; next?: ScenarioId; nextLocked?: boolean; busy: boolean;
  onStart: (id: ScenarioId) => void; onRetry: () => void; onMap: () => void; onReview: () => void;
}) {
  const Icon = won ? Trophy : ShieldX;
  return <div className="mission-result-overlay" data-outcome={won ? "won" : "lost"}>
    <PaperDrawer title={won ? "Victory · level complete" : "Defeat · attempt ended"} onClose={onMap}>
      <section className="mission-result-content" aria-label={won ? "You won" : "You lost"}>
        <div className="mission-result-medal" aria-hidden="true"><Icon size={42} strokeWidth={1.5} /></div>
        <p className="paper-eyebrow">{title}</p>
        <h2 className="mission-result-title">{won ? "You won." : "You lost."}</h2>
        <p className="mission-result-ending">{ending}</p>
        <p>{won ? next ? "Your choices changed the town. Progress saved — the next chapter is unlocked." : "The final chapter is complete. Your journey through Hollowbrook is recorded." : "This attempt is over. Try a different route with a fresh clock; your unlocked levels are kept."}</p>
        <p className="paper-caption">Ended on turn {turn} · clock stopped · memory graph revealed</p>
        <div className="mission-result-actions">
          {won && next ? <Button disabled={busy || nextLocked} onClick={() => onStart(next)}>Continue · next level</Button> : <Button disabled={busy} onClick={won ? onMap : onRetry}>{won ? "Return to campaign map" : "Try again · fresh start"}</Button>}
          <Button variant="secondary" disabled={busy} onClick={onMap}>{won && !next ? "Explore the level map" : "Home · level map"}</Button>
          <Button variant="ghost" disabled={busy} onClick={onReview}>See what happened · revealed graph</Button>
        </div>
      </section>
    </PaperDrawer>
  </div>;
}
