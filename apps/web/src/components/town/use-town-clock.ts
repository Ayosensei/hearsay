"use client";
import { useEffect, useRef, useState } from "react";

export const TOWN_TURN_SECONDS = 12;
export function useTownClock(enabled: boolean, playerId: string | undefined, tick: number, advance: () => Promise<void>) {
  const [remaining, setRemaining] = useState(TOWN_TURN_SECONDS);
  const [visible, setVisible] = useState(true);
  const latest = useRef(advance);
  useEffect(() => { latest.current = advance; }, [advance]);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update(); document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  useEffect(() => {
    setRemaining(TOWN_TURN_SECONDS);
    if (!enabled || !visible || !playerId) return;
    let deadline = Date.now() + TOWN_TURN_SECONDS * 1000;
    let pending = false;
    let cancelled = false;
    async function next() {
      // Visible windows share a rate limit, so two tabs cannot double the clock.
      const run = async () => {
        if (cancelled) return;
        const key = `hearsay-clock-${playerId}`;
        const previous = Number(localStorage.getItem(key) ?? 0);
        if (Date.now() - previous < TOWN_TURN_SECONDS * 1000) return;
        localStorage.setItem(key, String(Date.now()));
        await latest.current();
      };
      if (navigator.locks) await navigator.locks.request(`hearsay-clock-${playerId}`, run);
      else await run();
    }
    const timer = window.setInterval(() => {
      if (pending) return;
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds > 0) return;
      pending = true;
      void next().finally(() => { pending = false; deadline = Date.now() + TOWN_TURN_SECONDS * 1000; });
    }, 250);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [enabled, visible, playerId, tick]);
  return { remaining, running: enabled && visible };
}
