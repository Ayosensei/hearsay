"use client";
import { Button } from "../ui/button";
import { crossingBlocked, crossingChoices } from "../../lib/crossing";
import type { TownState } from "../../lib/types";

const opening: Record<string, string> = {
  rowan: "Marta barred the bridge over a debt I already paid. Lysa needs the chapel before dusk. Will you help her?",
  elin: "There are two versions of this debt. Be careful whose side you take.",
  marta: "No toll, no crossing. Rowan's promises don't pay for timber.",
  oren: "We could build another way across. But it won't be ready instantly.",
  silas: "By the fifth bell this river is too rough. Don't bring me a last-minute plan.",
  lysa: "I just need to get to the chapel. Please don't let their argument use up the daylight.",
  garrick: "The bridge toll? You'll need a more specific question than that.",
};
export function CrossingChat({ town, npcId, busy, onChoose }: { town: TownState; npcId: string; busy: boolean; onChoose: (id: string) => void }) {
  const story = town.puzzle?.crossing;
  if (!story) return null;
  const npc = town.npcs.find((n) => n.id === npcId);
  const lines = story.lines.filter((line) => line.npc === npcId || (line.npc === "player" && line.to === npcId)).slice(-4);
  return <section className="story-conversation" aria-label={`Conversation with ${npc?.name ?? npcId}`}>
    <p className="chat-speaker">{npc?.name ?? npcId} <span>{npc?.role}</span></p>
    <div className="story-bubbles" role="log" aria-live="polite">
      {!lines.some((line) => line.npc === npcId) && <p className="story-bubble">{opening[npcId] ?? "The bridge dispute is all anyone talks about. Find Rowan, Marta or Elin."}</p>}
      {lines.map((line) => <p key={line.id} className={`story-bubble ${line.npc === "player" ? "you" : ""}`}>{line.text}</p>)}
    </div>
    {!story.ending && <div className="story-replies" aria-label="Choose your reply">{crossingChoices.filter((choice) => choice.npc === npcId).map((choice) => {
      const blocked = crossingBlocked(story.flags, choice.id.slice(6), town.tick);
      if (blocked === "Already said or done") return null;
      if (["cross-expose", "cross-quiet"].includes(choice.id) && !story.flags.includes("receipt")) return null;
      return <div key={choice.id}><Button variant="secondary" disabled={busy || Boolean(blocked) || town.puzzle?.ap === 0} onClick={() => onChoose(choice.id)}>{choice.label}<span>1 AP</span></Button><small>{blocked ?? choice.hint}</small></div>;
    })}</div>}
    {busy && <p role="status">Listening…</p>}
    <p className="chat-cost">{story.ending ? "Story finished. Open your objective to see the consequences or try another route." : `${town.puzzle?.ap}/2 actions left · Walking is free. The dusk clock keeps running.`}</p>
  </section>;
}
