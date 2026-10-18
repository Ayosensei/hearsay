"use client";
import { Button } from "../ui/button";
import { PuzzleNotebook } from "./PuzzleNotebook";
import { WatchWalkthrough } from "./WatchWalkthrough";
import { missions } from "../../lib/mission-catalog";
import type { TownState } from "../../lib/types";
import type { DetectiveAnswer } from "../../lib/puzzle";

export function MissionBrief({ town, busy, onWalk, onGraph, onRestart, onChoose, onAccuse }: { town: TownState; busy: boolean; onWalk: (id: string) => void; onGraph: () => void; onRestart: () => void; onChoose?: () => void; onAccuse?: (answer: DetectiveAnswer) => void }) {
  const story = town.puzzle?.story; if (!story) return null;
  const spec = missions[story.mission], name = (id: string) => town.npcs.find((n) => n.id === id)?.name ?? id;
  const stops = story.mission === "detective" ? town.npcs.map((n) => n.id) : [...new Set(spec.choices.map((choice) => choice.npc))];
  return <section className="space-y-4"><p className="paper-eyebrow">{story.ending ? town.puzzle?.state.stage === "won" ? "Mission completed" : "The cost of the decision" : `${spec.deadline} bells · ${spec.deadline} real minutes · 2 AP per turn`}</p><h2 className="font-serif text-3xl">{story.ending ?? spec.title}</h2><p>{spec.brief}</p><p className="font-semibold">{story.objective}</p>
    {!story.ending && <><p>The first deadline to arrive ends the attempt: turn {spec.deadline}, or {spec.deadline} elapsed minutes. Two actions advance a turn. Walking is free; chats do not pause time.</p>{story.mission === "watch" ? <WatchWalkthrough flags={story.flags} tick={town.tick} /> : <><p className="paper-caption">{story.mission === "medicine" ? "Level 2 · light guidance. Start with Elin in Vale Lane: ask what Lysa needs, then follow the leads in the replies. You will need to connect the requests yourself." : "Advanced objective · follow the villagers' accounts, compare the evidence, and decide your own route."}</p><div className="flex flex-wrap gap-2">{stops.map((id) => <Button key={id} variant="secondary" disabled={busy} onClick={() => onWalk(id)}>Visit {name(id)}</Button>)}</div></>}</>}
    {story.mission === "detective" && <PuzzleNotebook key={town.playerId} town={town} busy={busy} onAccuse={onAccuse} />}
    <details><summary>Your decisions and the town's replies</summary><div className="story-bubbles">{story.lines.map((line) => <p className={`story-bubble ${line.npc === "player" ? "you" : ""}`} key={line.id}><strong>{line.npc === "player" ? "You" : name(line.npc)} · bell {line.tick}</strong><br />{line.text}</p>)}</div></details>
    {story.claims && <details><summary>Reveal the accounts · FalkorDB</summary><p>Each account keeps its teller, confidence and turn. A derived account does not overwrite the original.</p>{story.claims.map((claim) => <article key={`${claim.id}-${claim.npc}`} className="memory-paper"><strong>{name(claim.npc)}</strong><p>{claim.text}</p><small>{claim.via === "witness" ? "Original account" : `Heard from ${name(claim.via)}`} · {Math.round(claim.confidence * 100)}% · bell {claim.tick}{claim.parent ? ` · derived from ${claim.parent}` : ""}</small></article>)}</details>}
    <Button variant="secondary" onClick={onGraph}>View {story.ending ? "revealed graph and trace" : "public trust network"}</Button>{story.ending && <Button disabled={busy} onClick={onRestart}>Try a different route</Button>}{onChoose && <Button variant="ghost" onClick={onChoose}>{story.ending && town.puzzle?.state.stage === "won" ? "Continue campaign" : "Campaign levels"}</Button>}
  </section>;
}
