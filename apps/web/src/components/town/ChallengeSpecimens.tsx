"use client";
import { ChallengePanel } from "./ChallengePanel";
import type { ChallengeStage } from "../../lib/challenge";

export function ChallengeSpecimens() {
  return <section className="space-y-4"><h2 className="font-serif text-4xl">A playable objective</h2><p>Synthetic challenge states; outcomes in the live game use actual memories and attitude.</p>
    <div className="grid gap-4 md:grid-cols-2">{([undefined, "briefing", "race", "won", "lost", "unavailable"] as (ChallengeStage | undefined)[]).map((stage) => <div key={stage ?? "new"} className="memory-paper"><ChallengePanel stage={stage} attitude={stage === "won" ? "friendly" : "neutral"} busy={stage === "unavailable"} onStart={() => {}} onSword={() => {}} onWalk={() => {}} onGraph={() => {}} onExit={() => {}} /></div>)}</div>
  </section>;
}
