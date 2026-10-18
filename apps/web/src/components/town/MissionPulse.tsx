"use client";
import { useEffect, useRef, useState } from "react";
import type { TownState } from "../../lib/types";
import { CROSSING_TURN_MS } from "../../lib/crossing";
import "./story.css";

export function MissionPulse({ town, busy, onHeartbeat }: { town: TownState; busy: boolean; onHeartbeat: () => Promise<void> }) {
  const story = town.puzzle?.story ?? town.puzzle?.crossing, puzzle = town.puzzle;
  const maxTurns = town.puzzle?.story?.maxTurns ?? 6;
  const [now, setNow] = useState(0);
  const latest = useRef(onHeartbeat), pending = useRef(false);
  const [offset, setOffset] = useState(0);
  useEffect(() => { latest.current = onHeartbeat; }, [onHeartbeat]);
  useEffect(() => { if (story) setOffset(story.serverNow - Date.now()); }, [story?.serverNow]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!story || story.ending || busy || pending.current || !navigator.onLine) return;
    const due = Math.min(maxTurns, Math.floor((now + offset - (story.deadlineAt - CROSSING_TURN_MS * maxTurns)) / CROSSING_TURN_MS));
    if (due <= town.tick) return;
    pending.current = true;
    void latest.current().finally(() => { pending.current = false; });
  }, [now, offset, story, town.tick, busy, maxTurns]);
  if (!puzzle) return null;
  const seconds = story ? Math.max(0, Math.ceil((story.deadlineAt - (now ? now + offset : story.serverNow)) / 1000)) : undefined;
  const last = story?.lines.filter((line) => line.npc !== "player").at(-1);
  return <section className={`mission-pulse ${seconds !== undefined && seconds <= 60 ? "urgent" : ""}`} aria-label="Mission clock and action points">
    <div className="mission-meter"><div><span className="meter-label">{story?.ending ? "Story finished" : "Your actions"}</span><strong>{puzzle.state.stage === "playing" ? `${puzzle.ap} / 2 AP` : puzzle.state.stage === "won" ? "You made it" : "Dusk"}</strong><span className="ap-lights" aria-hidden="true"><i className={puzzle.ap > 0 ? "lit" : ""} /><i className={puzzle.ap > 1 ? "lit" : ""} /></span></div>
      <div><span className="meter-label">{town.puzzle?.story ? "Until deadline" : story ? "Until dusk" : "Turns left"}</span><strong role="timer" aria-label={story?.ending ? "Story finished" : seconds === undefined ? `${puzzle.state.remaining} turns left` : `${Math.floor(seconds / 60)} minutes ${seconds % 60} seconds until the deadline`}>{story?.ending ? "Closed" : seconds === undefined ? puzzle.state.remaining : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}</strong><small>Turn {town.tick} / {story ? maxTurns : town.tick + puzzle.state.remaining}</small></div></div>
    {last && <p className="town-interruption" key={last.id}><strong>{town.npcs.find((npc) => npc.id === last.npc)?.name ?? last.npc}</strong> {last.text}</p>}
  </section>;
}
