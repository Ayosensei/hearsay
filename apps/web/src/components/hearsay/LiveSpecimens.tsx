"use client";
import { useState } from "react";
import { getInitialTownState } from "../../lib/mock-data";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { EventForm } from "./EventForm";
import { DialoguePanel } from "../DialoguePanel";
import { GraphPanel } from "../GraphPanel";
import { ControlVsHearsayModal } from "../ControlVsHearsayModal";
import { PLACES } from "../../lib/places";

export function LiveSpecimens() {
  const state = getInitialTownState();
  const npc = state.npcs[0];
  const [form, setForm] = useState(false);
  const [compare, setCompare] = useState(false);
  const [disabled, setDisabled] = useState(false);
  if (!npc) return null;
  return <section className="space-y-6">
    <h2 className="font-serif text-3xl text-balance">Live integration <em>states</em></h2>
    <p className="text-sm text-text-secondary">Synthetic specimens; the town page reads the actual graph.</p>
    <div className="flex flex-wrap gap-3">
      <Button onClick={() => setForm(true)}>Open event form</Button>
      <Button variant="secondary" onClick={() => setCompare(true)}>Open comparison</Button>
      <Button variant="secondary" onClick={() => setDisabled(!disabled)}>Toggle form loading</Button>
      <Button disabled>Recording…</Button><Button variant="ghost">Player B</Button>
    </div>
    <Input aria-label="Input specimen" placeholder="Item or detail" />
    <p role="status" className="rounded-lg bg-surface-2 p-4 text-text-secondary">No path exists. Garrick has heard nothing about this.</p>
    <p role="alert" className="rounded-lg bg-surface-2 p-4 text-danger">DB_UNAVAILABLE: Start FalkorDB and retry.</p>
    {[[], state.activePathEdgeIds].map((highlight, index) => <div key={index} className="h-96 flex">
      <GraphPanel nodes={state.graphNodes} edges={state.graphEdges} selectedNpcId="garrick" activePathEdgeIds={highlight} activeWitnessId="brom" onSelectNode={() => {}} />
    </div>)}
    <div className="flex overflow-auto h-96">
      <DialoguePanel selectedNpc={npc} messages={[]} isSending={false} isBusy={false} onSendMessage={() => {}} onInspectProvenance={() => {}} />
      <DialoguePanel selectedNpc={npc} messages={[]} isSending isBusy onSendMessage={() => {}} onInspectProvenance={() => {}} />
      <DialoguePanel selectedNpc={npc} messages={[
        { id: "llm", sender: "npc", text: "I know only what I have heard.", timestamp: "Now", groundedInKnowledge: true, source: "llm", firewall: { passed: true, violations: [] } },
        { id: "fallback", sender: "npc", text: "Nobody has told me.", timestamp: "Now", groundedInKnowledge: true, source: "template_fallback", firewall: { passed: false, violations: ["Unknown-event wording rejected"] } },
      ]} isSending={false} isBusy={false} onSendMessage={() => {}} onInspectProvenance={() => {}} />
    </div>
    {form && <EventForm npcs={state.npcs} places={PLACES.map((name, index) => ({ id: String(index), name }))} playerId="styleguide" busy={disabled} onClose={() => setForm(false)} onSubmit={() => setForm(false)} />}
    <ControlVsHearsayModal isOpen={compare} onClose={() => setCompare(false)} />
  </section>;
}
