import { X, ShieldAlert, ShieldCheck, Sparkles, Database, Bot } from "lucide-react";
import { useEscapeKey } from "../lib/use-escape-key";

interface ControlVsHearsayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ControlVsHearsayModal({ isOpen, onClose }: ControlVsHearsayModalProps) {
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-enter"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Control versus Hearsay comparison"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl bg-surface-1 border border-border card-elevation overflow-hidden shadow-2xl relative"
      >
        {/* Chrome metallic accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 chrome-ring opacity-90" />

        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-3 text-signal text-xs font-mono border border-signal/30 mb-2">
              <Sparkles className="h-3 w-3" />
              <span>Same question, two memories</span>
            </div>
            <h2 className="font-serif text-3xl text-text-primary tracking-tight">
              Control <span className="font-sans text-text-tertiary text-xl font-normal">vs</span>{" "}
              <em className="italic text-signal font-serif">Hearsay</em>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Comparing standard naive LLM game memory against FalkorDB graph-grounded provenance.
            </p>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-surface-2 text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors hover:bg-surface-3"
            title="Close comparison"
            aria-label="Close comparison"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Column 1: Control (Standard Game AI) */}
          <div className="p-6 bg-surface-1/50 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-text-tertiary" />
                  <span className="font-sans font-semibold text-sm text-text-primary">
                    Control: Standard Game AI
                  </span>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-3 text-text-tertiary">
                  No Graph
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-2 border border-border/60 text-xs text-text-secondary space-y-2">
                <span className="text-text-tertiary font-mono block">Player Question:</span>
                <p className="italic text-text-primary font-medium">
                  &quot;What happened to the ancient Sun-Stone relic at the chapel?&quot;
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-danger font-mono font-semibold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Omniscient / Hallucinated NPC Response:</span>
                </div>
                <p className="text-text-primary leading-relaxed">
                  &quot;You stole it! Everyone across the town knows you entered the vault at twilight and took the stone! The guards are coming!&quot;
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs font-mono text-text-tertiary">
                <div className="flex items-center justify-between">
                  <span>Provenance:</span>
                  <span className="text-text-tertiary font-semibold">None (Blackbox LLM)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Knowledge Firewall:</span>
                  <span className="text-danger font-semibold">Bypassed (Psychic Guard)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Explainable Graph Path:</span>
                  <span className="text-text-tertiary">None</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-2/60 border border-border/40 text-xs text-text-tertiary">
              Problem: Breaks player immersion. NPCs psychic knowledge without origin or proof.
            </div>
          </div>

          {/* Column 2: Hearsay (FalkorDB Graph) */}
          <div className="p-6 bg-surface-2/30 flex flex-col justify-between space-y-6 signal-glow">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-signal" />
                  <span className="font-sans font-semibold text-sm text-signal">
                    Hearsay: Graph Memory Layer
                  </span>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-3 text-gold font-semibold border border-gold/30">
                  FalkorDB Grounded
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-2 border border-border/60 text-xs text-text-secondary space-y-2">
                <span className="text-text-tertiary font-mono block">Player Question:</span>
                <p className="italic text-text-primary font-medium">
                  &quot;What happened to the ancient Sun-Stone relic at the chapel?&quot;
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-signal/40 space-y-2 text-xs card-elevation">
                <div className="flex items-center gap-1.5 text-gold font-mono font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Graph-Grounded NPC Response:</span>
                </div>
                <p className="text-text-primary leading-relaxed">
                  &quot;Martha Finch witnessed someone near the vault, then told Garrick at the forge. Word reached me with 64% confidence. I wasn&apos;t there myself.&quot;
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs font-mono text-text-tertiary">
                <div className="flex items-center justify-between">
                  <span>Provenance:</span>
                  <span className="text-gold font-semibold">Martha Finch [Eyewitness 100%]</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Knowledge Firewall:</span>
                  <span className="text-success font-semibold">Enforced (Prompt restricted)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Social Path:</span>
                  <span className="text-signal">Martha → Garrick → Capt. Vane</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Explain-path query:</span>
                  <span className="text-text-primary">Q12_explain_provenance</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-3 border border-signal/30 text-xs text-signal font-medium">
              Advantage: 100% explainable, zero psychic NPCs, realistic trust decay per hop.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
