"use client";
import { Button } from "../ui/button";
import { PaperDrawer } from "./PaperDrawer";
import { WatchWalkthrough } from "./WatchWalkthrough";
import { missions } from "../../lib/mission-catalog";
import { isMissionId } from "../../lib/missions";
import { scenarios, type ScenarioId } from "../../lib/scenarios";

export function MissionLaunchBrief({ id, busy, error, onBegin, onClose }: { id: ScenarioId; busy: boolean; error: string; onBegin: () => void; onClose: () => void }) {
  const spec = isMissionId(id) ? missions[id] : scenarios[id];
  return <div className="demo-help-overlay"><PaperDrawer title="Before you begin · Your objective" onClose={onClose}>
    <section className="space-y-4">
      <p className="paper-eyebrow">Mission briefing · clock has not started</p>
      <h2 className="font-serif text-3xl">{spec.title}</h2>
      <p>{spec.brief}</p>
      {isMissionId(id) && <p className="font-semibold">{missions[id].objective}</p>}
      <p>{spec.deadline} turns or {spec.deadline} real minutes · 2 AP per turn. The first deadline ends the attempt. Read at your own pace here; this mission starts only when you press Begin mission.</p>
      {id === "watch" ? <WatchWalkthrough flags={[]} tick={0} /> : <p className="paper-caption">{id === "medicine" ? "Start with Elin in Vale Lane to document Lysa's condition. Follow the villagers' leads and settle the medicine dispute after treatment." : "Follow the villagers' accounts, compare their clues, and choose your route. Later chapters provide less guidance."}</p>}
      <p>You can reopen these objectives from the Objective panel in the town at any time. During play, reading and chatting do not pause the deadline.</p>
      <div className="sticky bottom-0 bg-paperCream py-3 flex flex-wrap gap-2"><Button disabled={busy} onClick={onBegin}>{busy ? "Starting mission…" : "Begin mission · start clock"}</Button><Button variant="secondary" disabled={busy} onClick={onClose}>Back to levels</Button></div>
      {error && <p role="alert" className="paper-error">{error}</p>}
    </section>
  </PaperDrawer></div>;
}
