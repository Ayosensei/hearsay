"use client";
import { Button } from "../ui/button";
import type { ChallengeStage } from "../../lib/challenge";

export const goalTitles: Record<ChallengeStage, string> = {
  briefing: "Take the sword. Beat the rumor.", race: "Earn Garrick’s trust", won: "Trust earned", lost: "The rumor arrived first", unavailable: "Challenge data unavailable",
};
export function ChallengePanel({ stage, attitude, busy, onStart, onSword, onWalk, onGraph, onExit }: {
  stage?: ChallengeStage; attitude?: string; busy: boolean; onStart: () => void;
  onSword: () => void; onWalk: () => void; onGraph: () => void; onExit: () => void;
}) {
  return <section className="challenge-panel" aria-label="Trust race objective">
    <p className="paper-eyebrow">A race against word of mouth</p><h2>{stage ? goalTitles[stage] : "Earn the guard’s trust."}</h2>
    {!stage && <><p>Steal the sword, then make Garrick friendly before the theft reaches him. What people see, hear and believe decides the outcome.</p><p className="paper-caption">Starts a separate challenge save. Your free-play histories stay intact.</p><Button disabled={busy} onClick={onStart}>Start challenge</Button></>}
    {stage === "briefing" && <><ol><li>Take the sword at Brom’s forge.</li><li>Go to Garrick and do something helpful nearby.</li><li>Become friendly before he learns the theft.</li></ol><Button disabled={busy} onClick={onSword}>Take the sword</Button></>}
    {stage === "race" && <><p>Garrick is <strong>{attitude}</strong>. He has not heard the theft yet. Reach him and record a helpful deed while the news travels.</p><Button disabled={busy} onClick={onWalk}>Walk to Garrick</Button></>}
    {stage === "won" && <p>Garrick is {attitude} and has not learned the theft. You earned his trust first. The challenge clock has stopped.</p>}
    {stage === "lost" && <p>Garrick learned the theft before you earned his trust. Follow the graph to see who told him. The challenge clock has stopped.</p>}
    {stage === "unavailable" && <p>The target memory or guard is missing. No result has been awarded; start a fresh challenge.</p>}
    {stage && <><Button variant="secondary" disabled={busy} onClick={onGraph}>See the memory graph</Button>{["won", "lost", "unavailable"].includes(stage) && <Button disabled={busy} onClick={onStart}>Try a fresh challenge</Button>}<Button variant="ghost" disabled={busy} onClick={onExit}>Return to free play</Button></>}
    <p className="paper-caption">Success uses Garrick’s actual graph-backed attitude and memories. It is a first challenge, not a score or inventory system.</p>
  </section>;
}
