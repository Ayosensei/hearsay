"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TownState, ProvenanceChain } from "../lib/types";
import { hearsayClient } from "../lib/hearsay-client";
import { buildProvenance, edgeIdsForPath } from "../lib/gossip";
import { TopNav } from "../components/TopNav";
import { NpcListPanel } from "../components/NpcListPanel";
import { GraphPanel } from "../components/GraphPanel";
import { DialoguePanel } from "../components/DialoguePanel";
import { TracePanel } from "../components/TracePanel";
import { WhyCard } from "../components/WhyCard";
import { ControlVsHearsayModal } from "../components/ControlVsHearsayModal";
import { PlayerActionModal } from "../components/PlayerActionModal";

type Notice = { text: string; tone: "info" | "error" };

export default function TownApp() {
  const [townState, setTownState] = useState<TownState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendingNpcId, setSendingNpcId] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((next: Notice, ms = 7000) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice(next);
    noticeTimer.current = setTimeout(() => setNotice(null), ms);
  }, []);

  const loadWorld = useCallback(async () => {
    try {
      const res = await hearsayClient.getTownState();
      if (res.ok) {
        setTownState(res.data);
        setLoadError(null);
      } else {
        setLoadError(`${res.error.code}: ${res.error.message}`);
      }
    } catch {
      setLoadError("Could not reach the Hearsay engine.");
    }
  }, []);

  // Initialize Town State on Mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial async load of the world
    void loadWorld();
  }, [loadWorld]);

  if (!townState) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center font-mono text-xs text-text-tertiary">
        {loadError ? (
          <div className="flex flex-col items-center gap-3 text-center" role="alert">
            <span className="text-danger">{loadError}</span>
            <button
              onClick={() => void loadWorld()}
              className="h-10 px-4 rounded-md bg-surface-2 hover:bg-surface-3 text-text-primary border border-border active:scale-96 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signal animate-ping" />
            <span>Loading Hollowbrook Graph...</span>
          </div>
        )}
      </div>
    );
  }

  const selectedNpc =
    townState.npcs.find((n) => n.id === townState.selectedNpcId) || townState.npcs[0];
  const isBusy = isAdvancing || isSending || isActing;

  /**
   * Apply an async result without clobbering what the user clicked while it ran.
   * Results are built from a snapshot, so a newer selection must win.
   */
  const applyResult = (next: TownState) =>
    setTownState((prev) => {
      if (!prev || prev.selectedNpcId === next.selectedNpcId) return next;
      return {
        ...next,
        selectedNpcId: prev.selectedNpcId,
        activeProvenance: prev.activeProvenance,
        activePathEdgeIds: prev.activePathEdgeIds,
      };
    });

  // Advance Time Action
  const handleAdvanceTime = async () => {
    if (isBusy) return;
    setIsAdvancing(true);
    try {
      const res = await hearsayClient.advanceTime(townState);
      if (!res.ok) {
        showNotice({ text: `${res.error.code}: ${res.error.message}`, tone: "error" });
        return;
      }
      applyResult(res.data);
      const spread = res.trace.find((t) => t.agent === "gossip")?.rows ?? 0;
      showNotice(
        {
          text:
            spread > 0
              ? `${spread} rumor${spread === 1 ? "" : "s"} spread this tick. Select a listener and ask about it.`
              : "No rumors spread: everyone who can hear the news has, or it is too faded to repeat.",
          tone: "info",
        },
        5000
      );
    } catch {
      showNotice({ text: "Advance Time failed. Try again.", tone: "error" });
    } finally {
      setIsAdvancing(false);
    }
  };

  // Reset World Action
  const handleResetWorld = async () => {
    if (isBusy) return;
    setNotice(null);
    await loadWorld();
  };

  // Select NPC (event nodes are not selectable: chat needs a real NPC id).
  // An open Why? card follows the selection so its title and chain always agree.
  const handleSelectNpc = (npcId: string) => {
    setTownState((prev) => {
      if (!prev) return prev;
      const npc = prev.npcs.find((n) => n.id === npcId);
      if (!npc) return prev;
      const rumor = npc.primaryRumor;
      return {
        ...prev,
        selectedNpcId: npc.id,
        activeProvenance:
          prev.activeProvenance && rumor
            ? buildProvenance(rumor, prev.npcs, prev.graphEdges)
            : undefined,
        activePathEdgeIds: rumor ? edgeIdsForPath(rumor.path, prev.graphEdges) : [],
      };
    });
  };

  // Send Dialogue
  const handleSendMessage = async (text: string) => {
    if (isBusy) return;
    const askedNpcId = townState.selectedNpcId;
    setIsSending(true);
    setSendingNpcId(askedNpcId);
    try {
      const res = await hearsayClient.sendMessage(askedNpcId, text, townState);
      if (res.ok) {
        applyResult(res.data.updatedState);
      } else {
        showNotice({ text: `${res.error.code}: ${res.error.message}`, tone: "error" });
      }
    } catch {
      showNotice({ text: "The message could not be delivered. Try again.", tone: "error" });
    } finally {
      setIsSending(false);
      setSendingNpcId(null);
    }
  };

  // Inspect Provenance (Opens Why? Card & Highlights Path)
  const handleInspectProvenance = (provenance: ProvenanceChain) => {
    setTownState((prev) =>
      prev
        ? {
            ...prev,
            activeProvenance: provenance,
            activePathEdgeIds: edgeIdsForPath(
              provenance.hops.map((h) => h.npcId),
              prev.graphEdges
            ),
          }
        : prev
    );
  };

  // Close Why? Card
  const handleCloseWhyCard = () => {
    setTownState((prev) =>
      prev ? { ...prev, activeProvenance: undefined, activePathEdgeIds: [] } : prev
    );
  };

  // Commit Dynamic World Action
  const handleCommitAction = async (
    actionTitle: string,
    actionType: "harm" | "help",
    witnessId: string,
    placeName: string
  ) => {
    if (isBusy) return;
    setIsActing(true);
    try {
      const res = await hearsayClient.recordAction(
        actionTitle,
        actionType,
        witnessId,
        placeName,
        townState
      );
      if (!res.ok) {
        showNotice({ text: `${res.error.code}: ${res.error.message}`, tone: "error" });
        return;
      }
      const witness = res.data.npcs.find((n) => n.id === witnessId);
      // Deliberate override: jump to the witness so the new event is in view.
      setTownState({
        ...res.data,
        selectedNpcId: witnessId,
        activePathEdgeIds: [],
        activeProvenance: undefined,
      });
      showNotice({
        text: `${witness?.name} witnessed "${res.data.events[0]?.title}" at ${placeName}. Press Advance Time to watch the rumor travel.`,
        tone: "info",
      });
    } catch {
      showNotice({ text: "The action could not be recorded. Try again.", tone: "error" });
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-text-primary overflow-hidden">
      {/* Top Bar */}
      <TopNav
        tick={townState.tick}
        isAdvancing={isAdvancing}
        isBusy={isBusy}
        onAdvanceTime={handleAdvanceTime}
        onResetWorld={handleResetWorld}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenActionModal={() => setIsActionModalOpen(true)}
      />

      {/* Control vs Hearsay Comparison Modal */}
      <ControlVsHearsayModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />

      {/* Player Dynamic Action Modal */}
      <PlayerActionModal
        isOpen={isActionModalOpen}
        npcs={townState.npcs}
        onClose={() => setIsActionModalOpen(false)}
        onSubmitAction={handleCommitAction}
      />

      {/* Notice banner: action results and engine errors */}
      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`h-8 px-4 bg-surface-2 border-b flex items-center justify-between text-xs font-mono shrink-0 animate-enter ${
            notice.tone === "error" ? "border-danger/50 text-danger" : "border-signal/40 text-signal signal-glow"
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className={`h-2 w-2 rounded-full ${notice.tone === "error" ? "bg-danger" : "bg-signal"}`} />
            <span className="truncate">{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            aria-label="Dismiss notice"
            className="text-text-tertiary hover:text-text-primary text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

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
            activeWitnessId={townState.activeProvenance?.witnessId || (townState.activePathEdgeIds.length > 0 ? selectedNpc?.primaryRumor?.eyewitnessId : undefined)}
            onSelectNode={handleSelectNpc}
          />

          {/* Floating Hero Why? Card when active - docked at bottom-left so the graph flow is fully visible */}
          {townState.activeProvenance && (
            <div className="absolute bottom-4 left-4 z-20 max-w-lg shadow-2xl">
              <WhyCard
                provenance={townState.activeProvenance}
                targetNpcName={selectedNpc.name}
                onClose={handleCloseWhyCard}
                onSelectNpc={handleSelectNpc}
              />
            </div>
          )}
        </div>

        {/* Right: Dialogue Interface */}
        <DialoguePanel
          selectedNpc={selectedNpc}
          messages={townState.dialogueHistory[selectedNpc.id] || []}
          isSending={isSending && sendingNpcId === selectedNpc.id}
          isBusy={isBusy}
          onSendMessage={handleSendMessage}
          onInspectProvenance={handleInspectProvenance}
        />
      </div>

      {/* Bottom: Query Trace Inspector Drawer */}
      <TracePanel traces={townState.recentTraces} />
    </div>
  );
}
