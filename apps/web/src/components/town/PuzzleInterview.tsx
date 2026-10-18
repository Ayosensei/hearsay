"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { PuzzleClues } from "./PuzzleNotebook";
import type { NPC, TownState } from "../../lib/types";

export function PuzzleInterview({ town, npc, eventId, busy, onAsk, onSpeak }: {
  town: TownState; npc: NPC; eventId: string; busy: boolean;
  onAsk: () => void; onSpeak: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState("");
  const deed = town.events.find((event) => event.id === eventId) ?? town.events.find((event) => event.id === town.puzzle?.caseEventId);
  const ap = town.puzzle?.ap ?? 0;
  return <section className="space-y-4" aria-label="Question a villager"><p className="paper-eyebrow">{npc.role} · {npc.attitude} body language</p><h3 className="font-serif text-3xl">What does {npc.name} know?</h3><p>Watching a face is free. Asking a question or sending a message costs 1 AP. You cannot inspect this person’s private memories directly.</p>
    <p className="font-mono tabular-nums">{ap}/2 AP remaining</p><p>Ask about: <strong>{deed?.title ?? "No deed recorded yet"}</strong></p>
    <Button disabled={busy || ap === 0 || !deed} onClick={onAsk}>Ask for their source · 1 AP</Button><PuzzleClues town={town} npcId={npc.id} />
    <details><summary>Have a conversation · 1 AP per message</summary><div className="space-y-3" role="log" aria-label={`Conversation with ${npc.name}`}>{(town.dialogueHistory[npc.id] ?? []).map((message) => <article key={message.id}><strong>{message.sender === "player" ? "You" : npc.name}</strong><p>{message.text}</p>{message.source && <small>{message.source === "llm" ? "Live reply" : "Safe template reply"}</small>}</article>)}</div>
      <form className="flex gap-2" onSubmit={async (event) => { event.preventDefault(); if (text.trim() && await onSpeak(text.trim())) setText(""); }}><Input aria-label={`Message to ${npc.name}`} value={text} maxLength={400} onChange={(event) => setText(event.target.value)} disabled={busy || ap === 0} /><Button disabled={busy || ap === 0 || !text.trim()}>Send · 1 AP</Button></form><p>Dialogue uses only this NPC’s known facts. The structured source question works even when Gemini falls back to a template.</p>
    </details>
  </section>;
}
