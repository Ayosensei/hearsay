"use client";
import { useState } from "react";
import { Eye, Ear, CircleHelp, Heart } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { memoryText } from "./TownStage";
import type { NPC, TownState } from "../../lib/types";

export function CharacterSheet({ town, npc, eventId, busy, onSpeak, onExplain, onAttitude }: {
  town: TownState; npc: NPC; eventId: string; busy: boolean;
  onSpeak: (text: string) => Promise<boolean | void>; onExplain: () => void; onAttitude: () => void;
}) {
  const [text, setText] = useState("");
  const deed = town.events.find((e) => e.id === eventId);
  const memory = npc.rumors.find((r) => r.eventId === eventId);
  const messages = town.dialogueHistory[npc.id] ?? [];
  return <div className={`character-sheet attitude-${npc.attitude}`}>
    <p className="paper-eyebrow">{npc.role} · Hollowbrook</p>
    <section className={`memory-paper ${memory && memory.confidence < .7 ? "smudged-note" : ""}`}>
      <h3>{memory?.hops === 0 ? <Eye size={18} /> : <Ear size={18} />} What does {npc.name} know?</h3>
      <strong>{deed?.title ?? "No deeds recorded yet"}</strong>
      <p>{deed ? memoryText(npc, eventId) : "Your story has not started."}</p>
      <Button variant="link" disabled={!deed || busy} onClick={onExplain}>How did they find out?</Button>
    </section>
    <section className="attitude-section">
      <h3><Heart size={18} /> How do they feel about you?</h3>
      <p className="attitude-word"><span aria-hidden="true">{npc.attitude === "hostile" ? "⌢" : npc.attitude === "wary" ? "−" : npc.attitude === "neutral" ? "·" : "⌣"}</span> {npc.attitude}</p>
      <p>{npc.contributions?.length ? "Their opinion reflects the deeds they know, their confidence, and their own traits." : "They have no memories of your deeds influencing their opinion."}</p>
      <Button variant="link" disabled={busy} onClick={onAttitude}>Why do they feel this way?</Button>
    </section>
    <section className="chat-section">
      <h3>Talk to {npc.name}</h3>
      <div className="paper-chat" role="log" aria-label={`Conversation with ${npc.name}`}>
        {!messages.length && <p className="paper-caption">Ask {npc.name} what they have heard about you.</p>}
        {messages.map((message) => <article key={message.id} className={message.sender === "player" ? "player-message" : "npc-message"}>
          <small>{message.sender === "player" ? "You" : npc.name}</small><p>{message.text}</p>
          {message.source && <small className="reply-source" title={message.source === "llm" ? "Generated from this character’s known facts." : "A safe prepared reply; it does not narrate specific events."}>{message.source === "llm" ? "Live reply" : "Template reply"}{message.firewall && ` · Knowledge check ${message.firewall.passed ? "passed" : "used safe fallback"}`}</small>}
        </article>)}
      </div>
      <Button variant="secondary" className="suggested-question" disabled={busy} onClick={() => void onSpeak("Have you heard anything about me?")}><CircleHelp size={16} /> Have you heard anything about me?</Button>
      <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (text.trim() && await onSpeak(text.trim())) setText(""); }}>
        <Input aria-label={`Message to ${npc.name}`} value={text} maxLength={400} onChange={(e) => setText(e.target.value)} placeholder={`Ask ${npc.name}…`} disabled={busy} />
        <Button disabled={busy || !text.trim()}>Send</Button>
      </form>
      <p className="paper-caption">Conversation does not create a deed. Use “Take an action” to change your story.</p>
    </section>
  </div>;
}
