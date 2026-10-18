"use client";
import { watchGuidance } from "../../lib/watch-guidance";

export function WatchWalkthrough({ flags, tick }: { flags: string[]; tick: number }) {
  const steps = watchGuidance(flags, tick), next = steps.find((step) => !step.done);
  return <section aria-label="Night Watch step-by-step hints" className="space-y-4">
    <div><p className="paper-eyebrow">Level 1 · guided objective</p><h3 className="font-serif text-2xl">What to do, step by step</h3><p>Find each person in the named district and approach them in the town, then choose the quoted reply in their chat. Walking is free; each reply spends 1 AP. These hints update after your decisions.</p></div>
    <ol className="space-y-4 list-decimal pl-6">{steps.map((step) => <li key={step.key} aria-current={step === next ? "step" : undefined} className={step.done ? "opacity-60" : ""}>
      <p><strong>{step.done ? "Done · " : step === next ? "Next · " : ""}</strong>{step.text}</p>
      {step.reply && <p className="mt-1 text-sm">Choose: <strong>{step.reply}</strong></p>}
    </li>)}</ol>
    <p className="paper-caption">The repair route is a guided suggestion. Diverting the flood or evacuating creates a different ending, and the checklist changes with your choice. Later levels give fewer instructions: use conversations and your decision log to connect the clues.</p>
  </section>;
}
