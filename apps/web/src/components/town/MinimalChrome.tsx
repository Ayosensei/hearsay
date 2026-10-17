"use client";
import { ArrowRight, BookOpen, MoreHorizontal, Network } from "lucide-react";
import { Button } from "../ui/button";

interface Props {
  flow?: React.ReactNode;
  location?: string;
  clock?: { paused: boolean; label: string; onToggle: () => void };
  view?: "town" | "graph"; onView?: (view: "town" | "graph") => void;
  actionLabel?: string; actionDisabled?: boolean;
  secondaryLabel?: string; secondaryDisabled?: boolean;
  tour: number;
  cue?: [string, string, string];
  narration: string;
  busy: boolean;
  onMenu: () => void;
  onLedger: () => void;
  onBegin: () => void;
  onSkip: () => void;
  onNext: () => void;
  onAction: () => void;
  onAdvance: () => void;
}

export function MinimalChrome(props: Props) {
  return <>
    <header className="minimal-header">
      <div><span className="minimal-wordmark">Hearsay</span><span className="minimal-location">Hollowbrook</span></div>
      <nav aria-label="Town navigation">
        {props.onView && <div className="world-view-switch" role="group" aria-label="World view"><Button variant="ghost" aria-pressed={props.view === "town"} onClick={() => props.onView?.("town")}>Town</Button><Button variant="ghost" aria-label="Memory graph" aria-pressed={props.view === "graph"} onClick={() => props.onView?.("graph")}><Network size={16} /><span><span className="view-long">Memory </span>graph</span></Button></div>}
        {props.tour !== -1 && <Button variant="ghost" onClick={props.onLedger} aria-label="Your story"><BookOpen size={16} /><span className="story-label">Your story</span></Button>}
        <Button variant="ghost" onClick={props.onMenu} aria-label="Open menu"><MoreHorizontal size={22} /></Button>
      </nav>
    </header>
    {props.tour !== -1 && <div className="flow-overlay">{props.flow}</div>}
    {props.tour === -1 ? <section className="minimal-welcome" aria-label="Begin your story">
      <h1>A town that <em>remembers.</em></h1>
      <p>Choose a dilemma. Decide who to help, what to risk, and who needs to hear your story.</p>
      <Button disabled={props.busy} onClick={props.onBegin}>Choose a scenario <ArrowRight size={16} /></Button>
      <Button variant="ghost" onClick={props.onSkip}>Explore on your own</Button>
    </section> : <footer className="minimal-footer">
      {props.cue ? <section className="minimal-guide" aria-label="Your next step">
        <p className="minimal-step">{props.tour} / 6</p>
        <h2>{props.cue[0]}</h2><p>{props.cue[1]}</p>
        <div><Button disabled={props.busy} onClick={props.onNext}>{props.cue[2]}</Button><Button variant="ghost" onClick={props.onSkip}>Skip guide</Button></div>
      </section> : <>
        <p className="minimal-narration">{props.narration}</p>
        <div className="minimal-actions" aria-label="Story actions">
          <Button disabled={props.busy || props.actionDisabled} onClick={props.onAction}>{props.actionLabel ?? "Take an action"}</Button>
          <Button variant="ghost" disabled={props.secondaryDisabled || (props.clock ? false : props.busy)} onClick={props.clock?.onToggle ?? props.onAdvance}>{props.secondaryLabel ?? (props.clock ? props.clock.paused ? "Resume town" : "Pause town" : "Let the town talk")}</Button>
        </div>
        <p className="minimal-hint">{props.location ?? "Select a villager to talk or follow a memory."}{props.clock && <> · {props.clock.label}</>}</p>
      </>}
    </footer>}
  </>;
}
