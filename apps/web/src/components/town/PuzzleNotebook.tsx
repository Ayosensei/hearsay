"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import type { TownState } from "../../lib/types";
import type { DetectiveAnswer } from "../../lib/puzzle";

export function PuzzleClues({ town, npcId }: { town: TownState; npcId?: string }) {
  const clues = town.puzzle?.clues.filter((clue) => !npcId || clue.npcId === npcId) ?? [];
  const name = (id: string) => town.npcs.find((npc) => npc.id === id)?.name ?? id;
  return <div className="space-y-3">{!clues.length && <p>No notes yet. A question costs 1 AP. Notes describe what was known when you asked.</p>}{clues.map((clue, index) => <article className="memory-paper space-y-2" key={`${clue.npcId}-${clue.eventId}-${clue.tick}-${index}`}><strong>{name(clue.npcId)} · turn {clue.tick}</strong><p>{clue.title}</p><p>{clue.source === "?" ? "Had not heard about this deed." : clue.source === "witness" ? "Saw it firsthand · 100% sure." : `Heard from ${name(clue.source)} · ${Math.round(clue.confidence * 100)}% sure.`}</p><small>This is a dated clue, not a live knowledge feed.</small></article>)}</div>;
}
export function PuzzleNotebook({ town, busy, onAccuse }: { town: TownState; busy: boolean; onAccuse?: (answer: DetectiveAnswer) => void }) {
  const [witnessId, setWitness] = useState("");
  const [route, setRoute] = useState<string[]>([]);
  const [account, setAccount] = useState<DetectiveAnswer["account"]>("secondhand");
  const puzzle = town.puzzle;
  if (!puzzle) return null;
  const name = (id: string) => town.npcs.find((npc) => npc.id === id)?.name ?? id;
  return <section className="space-y-4" aria-label="Puzzle notebook"><h3 className="font-serif text-2xl">Your notebook</h3><p>{puzzle.fog ? "The full graph opens after the verdict. Read faces, ask for sources, and plan from the public trust network." : "The case is closed. The graph and trace now reveal the recorded information flow."}</p>
    {puzzle.feedback && <p role="status">{puzzle.feedback}</p>}
    <details open={puzzle.state.id === "detective"}><summary>Dated clues ({puzzle.clues.length})</summary><PuzzleClues town={town} /></details>
    {puzzle.detective && puzzle.fog && <form className="space-y-4" aria-label="Detective reconstruction" onSubmit={(event) => { event.preventDefault(); if (witnessId) onAccuse?.({ witnessId, route, account }); }}>
      <h3 className="font-serif text-2xl">Who started this story?</h3><p>One submission ends the case. Each correct field earns one point. Gossip may change Garrick’s account between turns.</p>
      <label className="paper-field">Eyewitness<select aria-label="Your eyewitness reconstruction" value={witnessId} onChange={(event) => setWitness(event.target.value)} disabled={busy}><option value="">Choose a villager…</option>{town.npcs.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}</select></label>
      <label className="paper-field">Garrick’s account<select aria-label="Garrick account classification" value={account} onChange={(event) => setAccount(event.target.value as DetectiveAnswer["account"])} disabled={busy}><option value="eyewitness">Eyewitness</option><option value="secondhand">Secondhand</option><option value="unaware">Has not heard</option></select></label>
      <p>Build the exact route, eyewitness first and Garrick last. If he has not heard, leave it empty. Secondhand does not mean lying.</p>
      <ol>{route.map((id, index) => <li key={`${id}-${index}`}>{index + 1}. {name(id)} <Button type="button" variant="ghost" disabled={busy} onClick={() => setRoute(route.filter((_, i) => i !== index))}>Remove {name(id)}</Button></li>)}</ol>
      <label className="paper-field">Add a person to the route<select aria-label="Add person to reconstructed route" value="" disabled={busy || route.length >= 13} onChange={(event) => setRoute([...route, event.target.value])}><option value="">Choose next person…</option>{town.npcs.filter((npc) => !route.includes(npc.id)).map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}</select></label>
      <Button disabled={busy || !witnessId || puzzle.ap === 0 || !onAccuse}>Submit reconstruction · 1 AP</Button>
    </form>}
    {puzzle.detective && !puzzle.fog && <div className="memory-paper space-y-3"><h3 className="font-serif text-2xl">Reconstruction: {puzzle.detective.score === undefined ? "not submitted" : `${puzzle.detective.score}/3`}</h3>{puzzle.detective.truth && <><p>Eyewitness: {name(puzzle.detective.truth.witnessId)}</p><p>Route: {puzzle.detective.truth.route.map(name).join(" → ") || "No route to Garrick"}</p><p>His account: {puzzle.detective.truth.account}</p></>}<p>This answer comes from the graph’s explain tool, not an LLM verdict.</p></div>}
  </section>;
}
