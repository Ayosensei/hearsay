"use client";

import { useState, useEffect, useRef } from "react";
import type { TownState, ToolEnvelope, ProvenanceChain } from "../lib/types";
import type { ToolInput } from "@hearsay/contract";
import { hearsayClient, liveTown } from "../lib/hearsay-client";
import { browserPlayer } from "../lib/live-town";
import { isLive } from "../lib/engine-mode";
import { edgeIdsForPath } from "../lib/gossip";
import { TopNav } from "../components/TopNav";
import { NpcListPanel } from "../components/NpcListPanel";
import { GraphPanel } from "../components/GraphPanel";
import { DialoguePanel } from "../components/DialoguePanel";
import { TracePanel } from "../components/TracePanel";
import { WhyCard } from "../components/WhyCard";
import { EventForm } from "../components/hearsay/EventForm";
import { ControlVsHearsayModal } from "../components/ControlVsHearsayModal";
import { Button } from "../components/ui/button";

export default function TownApp() {
  const [town, setTown] = useState<TownState>();
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [slot, setSlot] = useState("a");
  const [actionOpen, setActionOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const inFlight = useRef(false);
  const savedChats = useRef(new Map<string, TownState["dialogueHistory"]>());

  async function run(work: () => Promise<ToolEnvelope<TownState>>, label: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(label);
    setNotice("");
    try {
      const result = await work();
      if (!result.ok) { setNotice(result.error.code + ": " + result.error.message); return; }
      setTown((previous) => ({ ...result.data,
        selectedNpcId: previous && previous.playerId === result.data.playerId ? previous.selectedNpcId : result.data.selectedNpcId }));
    } catch { setNotice("Could not reach the town. Retry the request."); }
    finally { inFlight.current = false; setBusy(""); }
  }

  async function load(player = slot) {
    await run(async () => {
      const result = isLive ? await liveTown.getTownState(browserPlayer(player)) : await hearsayClient.getTownState();
      if (result.ok) result.data.dialogueHistory = savedChats.current.get(player) ?? {};
      return result;
    }, "Loading town");
  }

  useEffect(() => {
    void load("a");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; switches load explicitly
  }, []);

  if (!town) return <main className="h-screen bg-background flex flex-col items-center justify-center gap-4 text-text-secondary" aria-busy={Boolean(busy)}>
    <h1 className="font-serif text-3xl text-text-primary">A town that <em>remembers</em></h1>
    <p role={notice ? "alert" : "status"}>{notice || "Loading your town…"}</p>
    {notice && <Button onClick={() => void load()}>Retry</Button>}
  </main>;

  const selected = town.npcs.find((npc) => npc.id === town.selectedNpcId) ?? town.npcs[0];
  if (!selected) return <main role="alert">The world contains no NPCs.</main>;
  const select = (id: string) => {
    if (!town.npcs.some((npc) => npc.id === id)) return;
    setTown((previous) => previous && ({ ...previous, selectedNpcId: id, activeProvenance: undefined, activePathEdgeIds: [] }));
  };
  const inspect = (why: ProvenanceChain) => setTown((previous) => previous && ({ ...previous,
    activeProvenance: why, activePathEdgeIds: why.edgeIds ?? edgeIdsForPath(why.hops.map((hop) => hop.npcId), previous.graphEdges) }));
  const explain = () => run(async () => {
    const eventId = selected.primaryRumor?.eventId ?? town.events[0]?.id;
    if (!eventId) return { ok: true, data: town, trace: [] };
    const result = await hearsayClient.explainProvenance(selected.id, eventId, town);
    if (!result.ok) return result;
    if (!result.data) setNotice("No path exists. " + selected.name + " has heard nothing about this.");
    return { ok: true, data: { ...town, activeProvenance: result.data, activePathEdgeIds: result.data?.edgeIds ?? [],
      recentTraces: [...result.trace].reverse().concat(town.recentTraces) }, trace: result.trace };
  }, "Explaining");

  async function submit(input: ToolInput<"recordEvent">) {
    if (!town) return;
    await run(() => liveTown.recordEvent(input, town), "Recording event");
    setActionOpen(false);
  }

  return <div className="h-screen w-screen flex flex-col bg-background text-text-primary overflow-hidden">
    <TopNav tick={town.tick} isAdvancing={busy === "Advancing"} isBusy={Boolean(busy)}
      onAdvanceTime={() => void run(() => hearsayClient.advanceTime(town), "Advancing")}
      onResetWorld={() => {
        if (window.confirm("Reset this player? This erases everything this player did."))
          void run(() => isLive ? liveTown.resetTown(town) : hearsayClient.getTownState(), "Resetting");
      }}
      onOpenComparison={() => setCompareOpen(true)} onOpenActionModal={() => setActionOpen(true)} />
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface-1 text-xs font-mono">
      <span>Player</span>
      {["a", "b"].map((player) => <Button key={player} variant={slot === player ? "default" : "secondary"} disabled={Boolean(busy)}
        onClick={() => { savedChats.current.set(slot, town.dialogueHistory); setSlot(player); void load(player); }}>Player {player.toUpperCase()}</Button>)}
      <span className="text-text-tertiary truncate">{town.playerId ?? "Mock session"}</span>
      <Button variant="secondary" disabled={Boolean(busy) || !town.events.length} onClick={() => void explain()}>Why does {selected.name} know?</Button>
      <span role="status" className="text-signal">{busy}</span>
    </div>
    {notice && <div role="status" className="px-4 py-3 border-b border-border bg-surface-2 text-xs text-text-secondary">{notice}</div>}
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <NpcListPanel npcs={town.npcs} selectedNpcId={selected.id} onSelectNpc={select} />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <GraphPanel nodes={town.graphNodes} edges={town.graphEdges} selectedNpcId={selected.id}
          activePathEdgeIds={town.activePathEdgeIds} activeWitnessId={town.activeProvenance?.witnessId} onSelectNode={select} />
        {town.activeProvenance && <div className="absolute bottom-4 left-4 z-20 max-w-lg shadow-2xl">
          <WhyCard provenance={town.activeProvenance} targetNpcName={town.activeProvenance.hops.at(-1)?.npcName ?? selected.name}
            onClose={() => setTown({ ...town, activeProvenance: undefined, activePathEdgeIds: [] })} onSelectNpc={select} />
        </div>}
      </div>
      <DialoguePanel selectedNpc={selected} messages={town.dialogueHistory[selected.id] ?? []} isSending={busy === "Speaking"}
        isBusy={Boolean(busy)} onInspectProvenance={inspect}
        onSendMessage={(text) => void run(async () => {
          const result = await hearsayClient.sendMessage(selected.id, text, town);
          return result.ok ? { ok: true, data: result.data.updatedState, trace: result.trace } : result;
        }, "Speaking")} />
    </div>
    <TracePanel traces={town.recentTraces} />
    {actionOpen && <EventForm npcs={town.npcs} places={town.places ?? []} playerId={town.playerId ?? ""}
      busy={Boolean(busy)} onClose={() => setActionOpen(false)} onSubmit={(input) => void submit(input)} />}
    <ControlVsHearsayModal isOpen={compareOpen} playerId={town.playerId} npcId={selected.id} onClose={() => setCompareOpen(false)} />
  </div>;
}

