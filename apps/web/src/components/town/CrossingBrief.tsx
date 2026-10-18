"use client";
import { Button } from "../ui/button";
import type { TownState } from "../../lib/types";

export function CrossingBrief({ town, busy, onWalk, onGraph, onRestart, onChoose }: { town: TownState; busy: boolean; onWalk: (id: string) => void; onGraph: () => void; onRestart: () => void; onChoose?: () => void }) {
  const story = town.puzzle?.crossing;
  if (!story) return null;
  const name = (id: string) => town.npcs.find((npc) => npc.id === id)?.name ?? id;
  return <section className="space-y-4"><p className="paper-eyebrow">A daughter. A debt. Six bells.</p><h2 className="font-serif text-3xl">{story.ending ?? "Get Lysa across."}</h2>
    <p>{story.ending ? town.puzzle?.state.stage === "won" ? "Lysa reached the chapel. Your choices decided what it cost." : "Lysa did not reach the chapel before dusk." : "Marta has barred the bridge. Rowan says he paid. His daughter needs the chapel before dusk. You can buy passage, build another crossing, or find the missing toll."}</p>
    {!story.ending && <><p>Two AP per turn. Six turns or six real minutes—whichever comes first. Chats do not stop the clock. Taking a public side can close a deal.</p><div className="flex flex-wrap gap-2">{["rowan", "marta", "elin", "garrick", "oren", "silas", "lysa"].map((id) => <Button variant="secondary" disabled={busy} key={id} onClick={() => onWalk(id)}>Visit {name(id)}</Button>)}</div></>}
    <details><summary>What has happened</summary><div className="story-bubbles">{story.lines.map((line) => <p key={line.id} className="story-bubble"><strong>{line.npc === "player" ? "You" : name(line.npc)} · bell {line.tick}</strong><br />{line.text}</p>)}</div></details>
    {story.claims && <details><summary>What the town really heard · FalkorDB</summary><p>Original accounts and distortions remain separate. Each row is a stored knowledge edge; its teller explains the route.</p>{story.claims.map((claim) => <article className="memory-paper" key={`${claim.id}-${claim.npc}`}><strong>{name(claim.npc)}</strong><p>{claim.text}</p><small>{claim.via === "witness" ? "Original account" : `Heard from ${name(claim.via)}`} · {Math.round(claim.confidence * 100)}% · bell {claim.tick}{claim.parent ? ` · derived from ${claim.parent}` : ""}</small></article>)}</details>}
    <Button variant="secondary" onClick={onGraph}>View {story.ending ? "revealed memory graph" : "public trust network"}</Button>
    {story.ending && <Button onClick={onRestart} disabled={busy}>Try a different choice</Button>}
    {onChoose && <Button variant="ghost" onClick={onChoose}>Campaign levels</Button>}
  </section>;
}
