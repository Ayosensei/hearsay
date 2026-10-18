"use client";
import { Button } from "../ui/button";
import { campaignOrder, canPlayLevel } from "../../lib/campaign";
import { missions } from "../../lib/mission-catalog";
import { isMissionId } from "../../lib/missions";
import { scenarios } from "../../lib/scenarios";
import type { ScenarioId } from "../../lib/scenarios";
import type { TownState } from "../../lib/types";
import { useCampaign } from "./use-campaign";

export function CampaignAdvance({ town, busy, onStart }: { town: TownState; busy: boolean; onStart: (id: ScenarioId) => void }) {
  const { progress } = useCampaign(), result = town.puzzle?.state;
  if (result?.stage !== "won") return null;
  const index = campaignOrder.findIndex((id) => id === result.id);
  if (index < 0) return null;
  const next = campaignOrder[index + 1];
  if (!next) return <p role="status" className="memory-paper">Campaign complete. You can replay any completed level from Campaign levels.</p>;
  const title = isMissionId(next) ? missions[next].title : scenarios[next].title;
  return <div className="memory-paper space-y-3"><p>Level {index + 1} complete. Your next story is ready.</p><Button disabled={busy || !canPlayLevel(progress, next)} onClick={() => onStart(next)}>Next level · {title}</Button></div>;
}
