"use client";
import { CampaignDemo } from "./CampaignDemo";
import { PaperDrawer } from "./PaperDrawer";
import { Button } from "../ui/button";
import { useCampaign } from "./use-campaign";
import "./campaign.css";

export function CampaignTools({ onHome, onDemo }: { onHome: () => void; onDemo: () => void }) {
  return <nav className="campaign-tools" aria-label="Campaign shortcuts"><Button variant="secondary" onClick={onHome}>Home</Button><Button onClick={onDemo}>Demo</Button></nav>;
}
export function DemoHelp({ open, onClose, onComplete }: { open: boolean; onClose: () => void; onComplete: () => void }) {
  const campaign = useCampaign();
  if (!open) return null;
  return <div className="demo-help-overlay"><PaperDrawer title="How to play · Demo" onClose={onClose}><CampaignDemo onClose={onClose} onComplete={() => { campaign.completeDemo(); onComplete(); }} /></PaperDrawer></div>;
}
