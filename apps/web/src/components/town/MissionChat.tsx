"use client";
import { useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { missions } from "../../lib/mission-catalog";
import { missionBlocked } from "../../lib/missions";
import type { TownState } from "../../lib/types";

export function MissionChat({ town, npcId, busy, onChoose, onAsk }: { town: TownState; npcId: string; busy: boolean; onChoose: (id: string) => void; onAsk: () => void }) {
  const story = town.puzzle?.story;
  const log = useRef<HTMLDivElement>(null);
  const latestReply = story?.lines.filter((line) => line.npc === npcId).at(-1)?.id;
  useEffect(() => { log.current?.lastElementChild?.scrollIntoView({ block: "nearest", behavior: "instant" }); }, [npcId, latestReply]);
  if (!story) return null;
  const mission = missions[story.mission], npc = town.npcs.find((n) => n.id === npcId);
  const lines = story.lines.filter((line) => line.npc === npcId || (line.npc === "player" && line.to === npcId)).slice(-5);
  const choices = mission.choices.filter((choice) => choice.npc === npcId && !choice.showAfter?.some((flag) => !story.flags.includes(flag)))
    .sort((a, b) => Number(Boolean(missionBlocked(a, story.flags, town.tick))) - Number(Boolean(missionBlocked(b, story.flags, town.tick))));
  return <section className="story-conversation" aria-label={`Conversation with ${npc?.name ?? npcId}`}><p className="chat-speaker">{npc?.name}<span>{npc?.role} · {npc?.attitude} body language</span></p>
    <div ref={log} className="story-bubbles" role="log" aria-live="polite">{!lines.some((line) => line.npc === npcId) && <p className="story-bubble">{story.mission === "detective" ? "Ask for my source. Compare what I say with the other accounts." : choices.length ? "We're short on time. Tell me what you need." : "I don't hold this decision. Your objective lists the people who do."}</p>}{lines.map((line) => <p key={line.id} className={`story-bubble ${line.npc === "player" ? "you" : ""}`}>{line.text}</p>)}</div>
    {!story.ending && <div className="story-replies">{choices.map((choice) => {
      const blocked = missionBlocked(choice, story.flags, town.tick);
      if (blocked === "Already resolved") return null;
      return <div key={choice.id}><Button variant="secondary" disabled={busy || Boolean(blocked) || town.puzzle?.ap === 0} onClick={() => onChoose(choice.id)}>{choice.label}<span>1 AP</span></Button>{(blocked || choice.hint) && <small>{blocked ?? choice.hint}</small>}</div>;
    })}{story.mission === "detective" && <div><Button variant="secondary" disabled={busy || town.puzzle?.ap === 0} onClick={onAsk}>“Tell me your source for the seal accusation.”<span>1 AP</span></Button><small>A dated statement. A false eyewitness may sound certain.</small></div>}</div>}
    {busy && <p role="status">Listening…</p>}<p className="chat-cost">{story.ending ? "Story finished. Open your objective to reveal the consequences." : `${town.puzzle?.ap}/2 actions left. The deadline continues during conversations.`}</p>
  </section>;
}
