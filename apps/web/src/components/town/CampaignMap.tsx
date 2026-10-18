"use client";
import { campaignDifficulty, campaignOrder, canPlayLevel } from "../../lib/campaign";
import type { CampaignProgress } from "../../lib/campaign";
import type { ScenarioId } from "../../lib/scenarios";
import { scenarios } from "../../lib/scenarios";
import { missions } from "../../lib/mission-catalog";
import { isMissionId } from "../../lib/missions";
import "./campaign.css";

const marks = ["✦", "≈", "✚", "⌁", "◇", "☼", "⚑", "⌕"];
export function CampaignMap({ progress, busy, onDemo, onStart }: { progress: CampaignProgress; busy: boolean; onDemo: () => void; onStart: (id: ScenarioId) => void }) {
  const levels = [undefined, ...campaignOrder];
  return <div className="campaign-map" aria-label="Campaign level map">
    <svg className="campaign-trail" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true"><path d="M125 110 H875 Q980 110 980 220 Q980 330 875 330 H125" /></svg>
    <ol className="campaign-stops">{levels.map((id, index) => {
      const completed = id ? progress.completed.includes(id) : progress.demo;
      const available = id ? canPlayLevel(progress, id) : true;
      const spec = id ? isMissionId(id) ? missions[id] : scenarios[id] : undefined;
      const title = spec?.title ?? "Your first rumour";
      const hint = completed ? "Replay level" : available ? id ? "Begin mission" : "Learn how to play" : index === 1 ? "Finish the demo" : `Complete level ${index - 1}`;
      return <li key={id ?? "demo"} className="campaign-stop" style={{ gridColumn: index < 4 ? index + 1 : 8 - index, gridRow: index < 4 ? 1 : 2 }}>
        <button className="map-level" data-state={completed ? "completed" : available ? "next" : "locked"} disabled={busy || !available} onClick={() => id ? onStart(id) : onDemo()} aria-label={`${completed ? "Replay" : available ? "Begin" : "Locked"} ${index === 0 ? "demo" : `level ${index}`} · ${title}`}>
          <span className="map-medallion" aria-hidden="true">{completed ? "✓" : marks[index]}</span><span className="map-level-number">{index === 0 ? "Prologue" : `Level ${index}`} · {completed ? "Completed" : available ? "Ready" : "Locked"}</span><strong>{title}</strong><span className="map-level-hint">{id ? campaignDifficulty[id] : "Learn the rules"}</span><span className="map-level-hint">{hint}</span>
        </button>
      </li>;
    })}</ol>
  </div>;
}
