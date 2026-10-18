"use client";
import { useEffect, useRef, useState } from "react";
import type { TownState } from "../../lib/types";
import "./gossip-wave.css";

export function GossipWave({ town, reduced }: { town: TownState; reduced: boolean }) {
  const previous = useRef({ player: town.playerId, tick: town.tick });
  const [wave, setWave] = useState<{ id: number; count: number; tick: number }>();
  const [visible, setVisible] = useState(false);
  const story = town.puzzle?.story ?? town.puzzle?.crossing;
  useEffect(() => {
    const old = previous.current;
    previous.current = { player: town.playerId, tick: town.tick };
    if (old.player !== town.playerId) { setVisible(false); setWave(undefined); return; }
    if (town.tick <= old.tick) return;
    setWave((last) => ({ id: (last?.id ?? 0) + 1, tick: town.tick, count: story?.spreadCount ?? town.gossipSteps?.length ?? 0 }));
    setVisible(true);
  }, [town.playerId, town.tick, story?.spreadCount, town.gossipSteps]);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 6500);
    return () => window.clearTimeout(timer);
  }, [visible, wave?.id]);
  if (!wave || !visible) return null;
  const moving = wave.count > 0;
  return <div className={`gossip-wave ${reduced ? "gossip-still" : ""}`} key={wave.id}>
    {moving && <svg viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true" className="gossip-sky">
      {["M80 440 Q350 120 670 370 T1140 220", "M120 240 Q470 500 800 180 T1130 400", "M200 530 Q580 200 1060 490"].map((path, index) => <g key={path}>
        <path d={path} className="gossip-ribbon" />
        {!reduced && [0, 1, 2].map((particle) => <circle key={particle} r={particle === 0 ? 5 : 3} className="gossip-spark"><animateMotion path={path} dur={`${2.8 + index * .4}s`} begin={`${particle * .45}s`} repeatCount="2" /></circle>)}
      </g>)}
    </svg>}
    <div className="gossip-notice" role="status" aria-live="polite"><span className="gossip-icon" aria-hidden="true">{moving ? "✦" : "·"}</span><div><strong>{moving ? "Word is spreading" : "The town is quiet"}</strong><span>Turn {wave.tick} · {moving ? `${wave.count} new ${wave.count === 1 ? "handoff" : "handoffs"}` : "No new handoffs this turn"}</span>{moving && <small>{town.puzzle?.fog ? "Whisper trails show activity. Question villagers to discover the route." : "Follow the named whispers to see who heard."}</small>}</div></div>
  </div>;
}
