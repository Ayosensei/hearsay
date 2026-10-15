"use client";

import { useState, useEffect } from "react";
import { TownState, ProvenanceChain } from "../lib/types";
import { hearsayClient } from "../lib/hearsay-client";
import { TopNav } from "../components/TopNav";
import { NpcListPanel } from "../components/NpcListPanel";
import { GraphPanel } from "../components/GraphPanel";
import { DialoguePanel } from "../components/DialoguePanel";
import { TracePanel } from "../components/TracePanel";
import { WhyCard } from "../components/WhyCard";

export default function TownApp() {
  const [townState, setTownState] = useState<TownState | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Initialize Town State on Mount
  useEffect(() => {
    hearsayClient.getTownState().then((res) => {
      if (res.ok) {
        setTownState(res.data);
      }
    });
  }, []);

  if (!townState) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center font-mono text-xs text-text-tertiary">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal animate-ping" />
          <span>Loading Hollowbrook Graph...</span>
        </div>
      </div>
    );
  }

  const selectedNpc =
    townState.npcs.find((n) => n.id === townState.selectedNpcId) || townState.npcs[0];

  // Advance Time Action
  const handleAdvanceTime = async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      const res = await hearsayClient.advanceTime(townState);
      if (res.ok) {
        setTownState(res.data);
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  // Reset World Action
  const handleResetWorld = async () => {
    const res = await hearsayClient.getTownState();
    if (res.ok) {
      setTownState(res.data);
    }
  };

  // Select NPC
  const handleSelectNpc = (npcId: string) => {
    const npc = townState.npcs.find((n) => n.id === npcId);
    let pathEdgeIds: string[] = [];

    if (npc?.primaryRumor?.eventId === "event_relic_theft") {
      if (npc.id === "garrick") pathEdgeIds = ["e1"];
      else if (npc.id === "captain_vane") pathEdgeIds = ["e1", "e2"];
      else if (npc.id === "lyra") pathEdgeIds = ["e3"];
    }

    setTownState({
      ...townState,
      selectedNpcId: npcId,
      activePathEdgeIds: pathEdgeIds,
    });
  };

  // Send Dialogue
  const handleSendMessage = async (text: string) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const res = await hearsayClient.sendMessage(townState.selectedNpcId, text, townState);
      if (res.ok) {
        setTownState(res.data.updatedState);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Inspect Provenance (Opens Why? Card & Highlights Path)
  const handleInspectProvenance = (provenance: ProvenanceChain) => {
    let pathEdgeIds: string[] = [];
    if (provenance.hops.length >= 2) {
      if (provenance.hops.some((h) => h.npcId === "captain_vane")) {
        pathEdgeIds = ["e1", "e2"];
      } else if (provenance.hops.some((h) => h.npcId === "garrick")) {
        pathEdgeIds = ["e1"];
      }
    }

    setTownState({
      ...townState,
      activeProvenance: provenance,
      activePathEdgeIds: pathEdgeIds,
    });
  };

  // Close Why? Card
  const handleCloseWhyCard = () => {
    setTownState({
      ...townState,
      activeProvenance: undefined,
      activePathEdgeIds: [],
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-text-primary overflow-hidden">
      {/* Top Bar */}
      <TopNav
        tick={townState.tick}
        isAdvancing={isAdvancing}
        onAdvanceTime={handleAdvanceTime}
        onResetWorld={handleResetWorld}
      />

      {/* Main 3-Panel Workplace */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left: NPC Directory */}
        <NpcListPanel
          npcs={townState.npcs}
          selectedNpcId={townState.selectedNpcId}
          onSelectNpc={handleSelectNpc}
        />

        {/* Center: Interactive Social Graph + Optional Overlay Why? Card */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Graph Viewport */}
          <GraphPanel
            nodes={townState.graphNodes}
            edges={townState.graphEdges}
            selectedNpcId={townState.selectedNpcId}
            activePathEdgeIds={townState.activePathEdgeIds}
            activeWitnessId={townState.activeProvenance?.witnessId}
            onSelectNode={handleSelectNpc}
          />

          {/* Floating Hero Why? Card when active */}
          {townState.activeProvenance && (
            <div className="absolute top-16 left-6 right-6 z-20 max-w-2xl mx-auto shadow-2xl">
              <WhyCard
                provenance={townState.activeProvenance}
                targetNpcName={selectedNpc.name}
                onClose={handleCloseWhyCard}
              />
            </div>
          )}
        </div>

        {/* Right: Dialogue Interface */}
        <DialoguePanel
          selectedNpc={selectedNpc}
          messages={townState.dialogueHistory[selectedNpc.id] || []}
          isSending={isSending}
          onSendMessage={handleSendMessage}
          onInspectProvenance={handleInspectProvenance}
        />
      </div>

      {/* Bottom: Query Trace Inspector Drawer */}
      <TracePanel traces={townState.recentTraces} />
    </div>
  );
}
