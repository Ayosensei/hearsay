"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ToolInput } from "@hearsay/contract";
import { liveTown } from "../../lib/hearsay-client";
import { browserPlayer } from "../../lib/live-town";
import type { TownState, ToolEnvelope, ProvenanceChain } from "../../lib/types";

export interface Beat { id: string; text: string; from?: string; to?: string; eventId?: string; confidence?: number }
export type Drawer = "ledger" | "character" | "evidence" | "attitude" | "engine" | "settings" | "reset" | "replay" | undefined;

export function useLivingTown() {
  const [town, setTown] = useState<TownState>();
  const [slot, setSlot] = useState("a");
  const [selected, setSelected] = useState("brom");
  const [eventId, setEventId] = useState("");
  const [drawer, setDrawer] = useState<Drawer>();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [narration, setNarration] = useState("Nobody here knows your story yet.");
  const [log, setLog] = useState<string[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
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
    const timer = window.setTimeout(() => setBeats((old) => old.slice(1)), reduced ? 650 : 1900);
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
    const next = await run(async () => {
      const result = await liveTown.getTownState(browserPlayer(nextSlot));
      if (result.ok) result.data.dialogueHistory = chats.current.get(nextSlot) ?? {};
      return result;
    }, "Opening your story…");
    if (next) {
      setSlot(nextSlot); localStorage.setItem("hearsay-active-slot", nextSlot); setEventId(next.events[0]?.id ?? ""); setDrawer(undefined); setLog([]);
      if (next.events.length) { setTour(0); tell("Welcome back. Hollowbrook remembers. Choose a deed in the Ledger to follow its story."); }
      else { setTour(localStorage.getItem(`hearsay-tour-${nextSlot}`) === "done" ? 0 : -1); tell("This traveller has a clean history. Nobody here knows your story yet."); }
    }
  }
  useEffect(() => { void load(localStorage.getItem("hearsay-active-slot") === "b" ? "b" : "a"); /* A single initial load; save switches are explicit. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function finishTour() { setTour(0); localStorage.setItem(`hearsay-tour-${slot}`, "done"); }
  function select(id: string) { setSelected(id); setWhy(undefined); setDrawer("character"); }

  async function record(input: ToolInput<"recordEvent">) {
    if (!town) return false;
    const next = await run(() => liveTown.recordEvent(input, town), "Recording your deed…");
    if (!next) return false;
    const event = next.events.find((e) => !town.events.some((old) => old.id === e.id));
    setEventId(event?.id ?? ""); setDrawer(undefined);
    const witness = next.npcs.find((n) => n.id === input.witnesses[0]);
    const text = `${witness?.name ?? "Your witness"} saw you ${input.type === "stole" ? "take" : input.type} ${input.subject ?? "something"}. ${witness?.name ?? "They"} ${witness ? `is ${witness.attitude} toward you` : "remembers"}.`;
    setBeats([{ id: crypto.randomUUID(), text, to: witness?.id, eventId: event?.id, confidence: 1 }]);
    if (tour > 0) {
      if (tour === 1 && input.type === "stole" && input.placeId === "forge" && input.witnesses[0] === "brom") setTour(2);
      else finishTour();
    }
    return true;
  }
  async function advance() {
    if (!town) return;
    const next = await run(() => liveTown.advanceTime(town), "Waiting for the town…");
    if (!next) return;
    const name = (id: string) => next.npcs.find((n) => n.id === id)?.name ?? id;
    const steps = next.gossipSteps ?? [];
    setBeats(steps.length ? steps.map((s) => ({ id: crypto.randomUUID(), from: s.tellerId, to: s.listenerId,
      eventId: s.eventId, confidence: s.credibility,
      text: `${name(s.tellerId)} told ${name(s.listenerId)} about ${next.events.find((e) => e.id === s.eventId)?.title ?? "a deed"}. ${name(s.listenerId)} is ${Math.round(s.credibility * 100)}% sure.` }))
      : [{ id: crypto.randomUUID(), text: "No new rumours spread this turn. The town is quiet." }]);
    if (tour === 3 || tour === 4) {
      if (next.npcs.find((n) => n.id === "garrick")?.rumors.some((r) => r.eventId === eventId)) setTour(5);
      else if (next.npcs.find((n) => n.id === "mira")?.rumors.some((r) => r.eventId === eventId)) setTour(4);
    }
  }
  async function speak(text: string) {
    if (!town) return false;
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
  async function explain(id = selected) {
    if (!town || !eventId || active || locked.current) return;
    locked.current = true; setBusy("Following the whisper…"); setError("");
    try {
      const result = await liveTown.explainProvenance(id, eventId, town);
      if (!result.ok) { setError(result.error.message); return; }
      setSelected(id); setWhy(result.data); setDrawer("evidence");
      setTown({ ...town, recentTraces: [...result.trace].reverse().concat(town.recentTraces) });
      tell(result.data ? `${result.data.hops.map((h) => h.npcName).join(" → ")}. This path comes from the graph.` : `${town.npcs.find((n) => n.id === id)?.name} has not learned about this event yet.`);
      if (tour === 5) setTour(6);
    } catch { setError("We could not load the evidence. Try again."); }
    finally { locked.current = false; setBusy(""); }
  }
  async function reset(replay = false) {
    if (!town) return;
    const next = await run(() => liveTown.resetTown(town), "Resetting this story…");
    if (next) { chats.current.delete(slot); setEventId(""); setDrawer(undefined); setTour(replay ? 1 : 0); setLog([]); tell("Nobody here knows your story yet."); }
  }
  function switchSave(next: string) { if (town) chats.current.set(slot, town.dialogueHistory); void load(next); }
  return { town, slot, selected, eventId, drawer, busy, error, narration, log, beats, why, tour, reduced, textMode, largeText, offline, active,
    setDrawer, setSelected, setEventId, setTour, setReduced, setTextMode, setLargeText, tell, load, select, record, advance, speak, explain, reset, switchSave, finishTour };
}
export type LivingTown = ReturnType<typeof useLivingTown>;
