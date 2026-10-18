"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolInput } from "@hearsay/contract";
import { liveTown } from "../../lib/hearsay-client";
import { browserPlayer } from "../../lib/live-town";
import type { TownState, ToolEnvelope, ProvenanceChain } from "../../lib/types";
import { readChallenge, saveChallenge } from "../../lib/challenge";
import type { ChallengeSave } from "../../lib/challenge";
import { runScenario } from "../../lib/scenario-client";
import { scenarioFromPlayer } from "../../lib/scenarios";
import type { ScenarioId } from "../../lib/scenarios";
import type { TownPosition } from "../../lib/town-space";
import { scenarioState } from "../../lib/scenario-state";
import { isMissionId } from "../../lib/missions";
import { missions } from "../../lib/mission-catalog";
import { canPlayLevel, readCampaign } from "../../lib/campaign";
import { useCampaign } from "./use-campaign";
import { isPuzzle } from "../../lib/puzzle";
import type { PuzzleCommand } from "../../server/puzzle-director";

export interface Beat { id: string; text: string; from?: string; to?: string; eventId?: string; confidence?: number }
export type Drawer = "scenarios" | "objective" | "residents" | "ledger" | "character" | "evidence" | "attitude" | "engine" | "settings" | "reset" | "replay" | undefined;

export function useLivingTown() {
  const campaign = useCampaign();
  const [town, setTown] = useState<TownState>();
  const [slot, setSlot] = useState("a");
  const [challenge, setChallenge] = useState<ChallengeSave>();
  const [selected, setSelected] = useState("brom");
  const [eventId, setEventId] = useState("");
  const [drawer, setDrawer] = useState<Drawer>();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [narration, setNarration] = useState("Nobody here knows your story yet.");
  const [log, setLog] = useState<string[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [lastBeats, setLastBeats] = useState<Beat[]>([]);
  const [why, setWhy] = useState<ProvenanceChain>();
  const [tour, setTour] = useState<number>(-1);
  const [reduced, setReduced] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [offline, setOffline] = useState(false);
  const locked = useRef(false);
  const chats = useRef(new Map<string, TownState["dialogueHistory"]>());
  const active = Boolean(busy || beats.length);
  const tell = useCallback((text: string) => { setNarration(text); setLog((old) => [...old, text].slice(-100)); }, []);
  useEffect(() => {
    if (!town || !campaign.ready) return;
    const result = scenarioState(town);
    if (result?.stage === "won" && !campaign.progress.completed.includes(result.id)) campaign.completeLevel(result.id);
  }, [town, campaign.ready, campaign.progress.completed]);
  useEffect(() => { setWhy(undefined); }, [eventId, slot]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settings = localStorage.getItem("hearsay-accessibility");
    if (settings) {
      try { const s = JSON.parse(settings); setReduced(media.matches || s.reduced === true); setTextMode(s.textMode === true); setLargeText(s.largeText === true); } catch { setReduced(media.matches); }
    } else setReduced(media.matches);
    const update = () => setOffline(!navigator.onLine);
    const motion = () => setReduced(media.matches);
    update(); window.addEventListener("online", update); window.addEventListener("offline", update); media.addEventListener("change", motion);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); media.removeEventListener("change", motion); };
  }, []);
  useEffect(() => {
    localStorage.setItem("hearsay-accessibility", JSON.stringify({ reduced, textMode, largeText }));
  }, [reduced, textMode, largeText]);

  useEffect(() => {
    if (!beats.length) return;
    tell(beats[0].text);
    const timer = window.setTimeout(() => setBeats((old) => old.slice(1)), reduced ? 1100 : 2600);
    return () => window.clearTimeout(timer);
  }, [beats, reduced, tell]);

  async function run(work: () => Promise<ToolEnvelope<TownState>>, label: string) {
    if (locked.current || beats.length) return undefined;
    locked.current = true; setBusy(label); setError("");
    try {
      const result = await work();
      if (!result.ok) { setError(`${result.error.message} No automatic retry was made.`); return undefined; }
      setTown(result.data); setWhy(undefined);
      return result.data;
    } catch { setError("We could not confirm the request. Your last confirmed story is still here. No automatic retry was made."); return undefined; }
    finally { locked.current = false; setBusy(""); }
  }

  async function load(nextSlot = slot) {
    const saved = nextSlot === "challenge" ? readChallenge() : undefined;
    const nextSave = nextSlot === "challenge" && !saved ? "a" : nextSlot;
    const next = await run(async () => {
      const questId = nextSlot === "scenario" ? localStorage.getItem("hearsay-scenario") : undefined;
      const result = questId && scenarioFromPlayer(questId) ? await runScenario({ playerId: questId, action: "inspect" }) : await liveTown.getTownState(saved?.playerId ?? browserPlayer(nextSave === "scenario" ? "a" : nextSave));
      if (result.ok) result.data.dialogueHistory = chats.current.get(nextSlot) ?? {};
      return result;
    }, "Opening your story…");
    if (next) {
      setSlot(nextSave); setChallenge(saved); localStorage.setItem("hearsay-active-slot", nextSave); setEventId(saved?.targetEventId ?? next.puzzle?.caseEventId ?? next.events.find((event) => !event.subject?.startsWith("Scenario verdict:"))?.id ?? ""); setDrawer(undefined); setLog([]); setLastBeats([]);
      if (scenarioFromPlayer(next.playerId)) { setTour(0); tell(scenarioState(next)?.reason ?? "Scenario restored from the town’s graph. Choose your next location."); }
      else if (saved || next.events.length) { setTour(0); tell(saved ? "Earn Garrick’s trust before the theft reaches him." : "Hollowbrook remembers. Take an action, or speak to a villager."); }
      else { setTour(localStorage.getItem(`hearsay-tour-expanded-${nextSlot}`) === "done" ? 0 : -1); tell(`${next.npcs.length} villagers. A fresh story. Choose a deed, then follow who hears about it.`); }
      if (!readCampaign().demo && !scenarioFromPlayer(next.playerId)) { setTour(0); setDrawer("scenarios"); }
    }
  }
  useEffect(() => { const saved = localStorage.getItem("hearsay-active-slot"); void load(saved === "scenario" || saved === "challenge" || saved === "b" ? saved : "a"); /* A single initial load; save switches are explicit. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function finishTour() { setTour(0); localStorage.setItem(`hearsay-tour-expanded-${slot}`, "done"); }
  function select(id: string) { setSelected(id); setWhy(undefined); setDrawer("character"); }
  function focus(id: string) { setSelected(id); setWhy(undefined); }
  async function startScenario(id: ScenarioId) {
    if (!canPlayLevel(readCampaign(), id) && scenarioFromPlayer(town?.playerId) !== id) { setError("Complete the demo and the preceding campaign levels first."); setDrawer("scenarios"); return false; }
    const playerId = `${isMissionId(id) ? "story" : "puzzle"}_${id}_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const next = await run(() => runScenario({ playerId, action: "inspect" }), "Opening a new scenario…");
    if (!next) return false;
    setSlot("scenario"); setChallenge(undefined); setTour(0); setDrawer(undefined); setSelected(isMissionId(id) ? missions[id].start : "rowan"); setEventId(next.puzzle?.caseEventId ?? ""); setLog([]); setLastBeats([]);
    localStorage.setItem("hearsay-scenario", playerId); localStorage.setItem("hearsay-active-slot", "scenario");
    tell(next.puzzle?.story ? `${next.puzzle.story.objective} Your ${next.puzzle.story.maxTurns}-minute clock has started.` : next.puzzle?.crossing ? "Get Lysa across before dusk. Your six-minute clock has started. Talk to Rowan, or choose another route." : "Two action points per turn. Question villagers, choose your moves, then let the town talk.");
    return true;
  }
  async function scenarioCommand(action: PuzzleCommand["action"], choiceId?: string, position?: TownPosition, details: Pick<PuzzleCommand, "npcId" | "eventId" | "text" | "conversationId" | "answer"> = {}) {
    if (!town?.playerId) return false;
    const next = await run(() => runScenario({ playerId: town.playerId ?? "", action, choiceId, position, ...details }), action === "inspect" ? "Checking the saved story…" : "Resolving your move…");
    if (!next) return false;
    next.dialogueHistory = { ...town.dialogueHistory, ...Object.fromEntries(Object.entries(next.dialogueHistory).map(([id, messages]) => [id, [...(town.dialogueHistory[id] ?? []), ...messages]])) };
    if (!next.puzzle?.crossing && !next.puzzle?.story) setDrawer(undefined); setLastBeats([]);
    const event = next.events.find((event) => !town.events.some((old) => old.id === event.id) && !event.subject?.startsWith("Scenario verdict:"));
    if (event) setEventId(event.id);
    const steps = next.gossipSteps ?? [];
    setBeats(steps.map((step) => ({ id: crypto.randomUUID(), eventId: step.eventId, from: step.tellerId, to: step.listenerId, confidence: step.credibility,
      text: `${next.npcs.find((npc) => npc.id === step.tellerId)?.name} told ${next.npcs.find((npc) => npc.id === step.listenerId)?.name}. ${Math.round(step.credibility * 100)}% sure.` })));
    const resolved = scenarioState(next);
    tell(resolved && resolved.stage !== "playing" ? resolved.reason : (next.puzzle?.story || next.puzzle?.crossing) ? (next.puzzle.story ?? next.puzzle.crossing)?.lines.filter((line) => line.npc !== "player").at(-1)?.text ?? "The town is talking." : next.puzzle ? `${action === "ask" ? "Notebook updated." : action === "speak" ? "Conversation recorded." : "Move resolved."} ${next.puzzle.ap}/2 AP · Turn ${next.tick}. End a turn to spread the news.` : action === "inspect" ? "Saved story checked. No choice was repeated." : `Turn ${next.tick}. ${event?.title ?? "The town exchanged news."}`);
    return true;
  }
  async function heartbeat() {
    if ((!town?.puzzle?.crossing && !town?.puzzle?.story) || locked.current) return;
    await run(() => runScenario({ playerId: town.playerId ?? "", action: "inspect" }), "");
  }
  async function startChallenge() {
    const playerId = `challenge_${crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
    const next = await run(() => liveTown.getTownState(playerId), "Opening a fresh challenge…");
    if (!next) return;
    const saved = { playerId };
    saveChallenge(saved); setChallenge(saved); setSlot("challenge"); localStorage.setItem("hearsay-active-slot", "challenge");
    setEventId(""); setSelected("brom"); setTour(0); setDrawer(undefined); setLastBeats([]); setLog([]);
    tell("First, take the sword at Brom’s forge. Then earn Garrick’s trust before he hears the theft.");
  }

  async function record(input: ToolInput<"recordEvent">) {
    if (!town) return false;
    if (scenarioFromPlayer(town.playerId)) { setError("Use the choices available at your location in this scenario."); return false; }
    const next = await run(() => liveTown.recordEvent(input, town), "Recording your deed…");
    if (!next) return false;
    const event = next.events.find((e) => !town.events.some((old) => old.id === e.id));
    if (challenge && !challenge.targetEventId && event && input.type === "stole" && input.placeId === "forge") {
      const saved = { ...challenge, targetEventId: event.id }; saveChallenge(saved); setChallenge(saved);
    }
    setEventId(event?.id ?? ""); setDrawer(undefined); setLastBeats([]);
    setBeats(input.witnesses.map((id) => {
      const witness = next.npcs.find((n) => n.id === id);
      return { id: crypto.randomUUID(), text: `${witness?.name ?? "Your witness"} witnessed your deed and is ${witness?.attitude ?? "remembering it"}.`, to: id, eventId: event?.id, confidence: 1 };
    }));
    if (tour > 0) {
      if (tour === 1 && input.type === "stole" && input.placeId === "forge" && input.witnesses.length === 1 && input.witnesses[0] === "brom") setTour(2);
      else finishTour();
    }
    return true;
  }
  async function advance() {
    if (!town) return;
    if (scenarioFromPlayer(town.playerId)) { await scenarioCommand("wait"); return; }
    const next = await run(() => liveTown.advanceTime(town), "Waiting for the town…");
    if (!next) return;
    const name = (id: string) => next.npcs.find((n) => n.id === id)?.name ?? id;
    const steps = next.gossipSteps ?? [];
    const confirmed = steps.map((s) => ({ id: crypto.randomUUID(), from: s.tellerId, to: s.listenerId,
      eventId: s.eventId, confidence: s.credibility,
      text: `${name(s.tellerId)} told ${name(s.listenerId)} about ${next.events.find((e) => e.id === s.eventId)?.title ?? "a deed"}. ${name(s.listenerId)} is ${Math.round(s.credibility * 100)}% sure.` }));
    setLastBeats(confirmed);
    setBeats(confirmed.length ? confirmed
      : [{ id: crypto.randomUUID(), text: "No new rumours spread this turn. The town is quiet." }]);
    if (tour === 3 || tour === 4) {
      if (next.npcs.find((n) => n.id === "garrick")?.rumors.some((r) => r.eventId === eventId)) setTour(5);
      else if (next.npcs.find((n) => n.id === "mira")?.rumors.some((r) => r.eventId === eventId)) setTour(4);
    }
  }
  function replayWhispers() {
    // Replays confirmed presentation data only; it never advances time or calls a tool.
    if (!active && !offline) setBeats(lastBeats.map((beat) => ({ ...beat, id: crypto.randomUUID() })));
  }
  async function speak(text: string, position?: TownPosition) {
    if (!town) return false;
    if (isPuzzle(town.playerId)) return scenarioCommand("speak", undefined, position, { npcId: selected, text, conversationId: town.dialogueHistory[selected]?.findLast((message) => message.conversationId)?.conversationId });
    const next = await run(async () => {
      const result = await liveTown.sendMessage(selected, text, town);
      return result.ok ? { ok: true, data: result.data.updatedState, trace: result.trace } : result;
    }, `${town.npcs.find((n) => n.id === selected)?.name ?? "The villager"} is responding…`);
    if (next) {
      const person = next.npcs.find((n) => n.id === selected);
      const knows = person?.rumors.some((r) => r.eventId === eventId);
      tell(knows ? `${person?.name} replies from their own memories.` : `${person?.name} has not learned about this event. Conversation does not create a deed.`);
      if (tour === 2 && selected === "garrick") setTour(3);
      return true;
    }
    return false;
  }
  async function explain(id = selected, showDrawer = true) {
    if (town?.puzzle?.fog) { setError("The full memory path unlocks after the verdict. Collect dated clues by questioning villagers."); return; }
    if (!town || !eventId || active || locked.current) return;
    locked.current = true; setBusy("Following the whisper…"); setError("");
    try {
      const result = await liveTown.explainProvenance(id, eventId, town);
      if (!result.ok) { setError(result.error.message); return; }
      setSelected(id); setWhy(result.data); if (showDrawer) setDrawer("evidence");
      setTown({ ...town, recentTraces: [...result.trace].reverse().concat(town.recentTraces) });
      tell(result.data ? `${result.data.hops.map((h) => h.npcName).join(" → ")}. This path comes from the graph.` : `${town.npcs.find((n) => n.id === id)?.name} has not learned about this event yet.`);
      if (tour === 5) setTour(6);
    } catch { setError("We could not load the evidence. Try again."); }
    finally { locked.current = false; setBusy(""); }
  }
  async function reset(replay = false) {
    if (!town) return;
    const puzzleId = isPuzzle(town.playerId) && scenarioFromPlayer(town.playerId);
    if (puzzleId) { await startScenario(puzzleId); return; }
    const next = await run(() => liveTown.resetTown(town), "Resetting this story…");
    if (next) { if (challenge) { const saved = { playerId: challenge.playerId }; setChallenge(saved); saveChallenge(saved); } chats.current.delete(slot); setEventId(""); setDrawer(undefined); setTour(replay && !challenge ? 1 : 0); setLog([]); setLastBeats([]); tell("Nobody here knows your story yet."); }
  }
  function switchSave(next: string) { if (town) chats.current.set(slot, town.dialogueHistory); void load(next); }
  return { town, slot, selected, eventId, drawer, busy, error, narration, log, beats, lastBeats, why, tour, reduced, textMode, largeText, offline, active, replayWhispers, challenge, startChallenge, startScenario, scenarioCommand, focus,
    heartbeat,
    clearError: () => setError(""),
    setDrawer, setSelected, setEventId, setTour, setReduced, setTextMode, setLargeText, tell, load, select, record, advance, speak, explain, reset, switchSave, finishTour };
}
export type LivingTown = ReturnType<typeof useLivingTown>;
