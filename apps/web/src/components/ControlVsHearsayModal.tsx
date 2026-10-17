"use client";
import { useState } from "react";
import type { ToolOutput } from "@hearsay/contract";
import { liveTown } from "../lib/hearsay-client";
import { useEscapeKey } from "../lib/use-escape-key";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface Props {
  isOpen: boolean; onClose: () => void; playerId?: string; npcId?: string;
}
export function ControlVsHearsayModal({ isOpen, onClose, playerId, npcId }: Props) {
  const [text, setText] = useState("Do you know what I did at the forge?");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [control, setControl] = useState<ToolOutput<"sayNaive">>();
  const [guarded, setGuarded] = useState<ToolOutput<"say">>();
  useEscapeKey(isOpen && !busy, onClose);
  if (!isOpen) return null;
  async function compare() {
    if (!playerId || !npcId || busy) return;
    setBusy(true); setError(""); setControl(undefined); setGuarded(undefined);
    try {
      const args = { playerId, npcId, text };
      const [left, right] = await Promise.all([liveTown.tools.call("sayNaive", args), liveTown.tools.call("say", args)]);
      if (!left.ok || !right.ok) {
        setError(!left.ok ? left.error.message : !right.ok ? right.error.message : "");
      }
      if (left.ok) setControl(left.data);
      if (right.ok) setGuarded(right.data);
    } finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
    <section role="dialog" aria-modal="true" aria-label="Control versus Hearsay comparison" className="w-full max-w-4xl rounded-xl bg-surface-2 p-6 space-y-6 card-elevation">
      <div className="flex justify-between items-center">
        <h2 className="font-serif text-3xl text-balance">Two different <em>memories</em></h2>
        <Button variant="secondary" disabled={busy} onClick={onClose}>Close</Button>
      </div>
      <p className="text-text-secondary text-sm">Ask the same NPC through both backend tools. Control receives the complete event log; Hearsay receives only its known events.</p>
      <form className="flex gap-3" onSubmit={(event) => { event.preventDefault(); void compare(); }}>
        <Input aria-label="Comparison question" value={text} maxLength={400} onChange={(event) => setText(event.target.value)} disabled={busy} />
        <Button disabled={busy || !text.trim() || !playerId}>{busy ? "Comparing…" : "Ask both"}</Button>
      </form>
      {error && <p role="alert" className="text-danger">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="rounded-lg bg-surface-1 p-4 space-y-3">
          <h3 className="text-text-primary">Control · told everything</h3>
          <p className="text-sm text-text-secondary">{control?.reply ?? (busy ? "Waiting for the backend…" : "Ask a question to compare.")}</p>
          {control && <p className="text-xs font-mono text-text-secondary">{control.source === "llm" ? "Gemini" : "Template fallback"} · {control.leaked ? "Unknown-event vocabulary detected" : "No vocabulary leak detected"}</p>}
        </article>
        <article className="rounded-lg bg-surface-1 p-4 space-y-3">
          <h3 className="text-signal">Hearsay · graph-scoped knowledge</h3>
          <p className="text-sm text-text-secondary">{guarded?.reply ?? (busy ? "Waiting for the backend…" : "Ask a question to compare.")}</p>
          {guarded && <p className="text-xs font-mono text-gold">{guarded.source === "llm" ? "Gemini" : "Template fallback"} · {guarded.firewall.passed ? "Firewall passed" : "Firewall blocked; safe fallback"}</p>}
        </article>
      </div>
      <p className="text-xs text-text-tertiary">With generation off, both tools use prepared replies. A generic control fallback may show no leak.</p>
    </section>
  </div>;
}

