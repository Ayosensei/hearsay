import { ProvenanceChain } from "../lib/types";
import { Eye, ArrowRight, ShieldCheck, X, Sparkles } from "lucide-react";

interface WhyCardProps {
  provenance: ProvenanceChain;
  targetNpcName: string;
  onClose: () => void;
}

export function WhyCard({ provenance, targetNpcName, onClose }: WhyCardProps) {
  return (
    <div className="rounded-2xl bg-surface-2 p-6 border border-border card-elevation signal-glow relative overflow-hidden transition-all duration-320">
      {/* Top Chrome Ring Border Highlight */}
      <div className="absolute top-0 left-0 right-0 h-1 chrome-ring opacity-90" />

      {/* Header with Title and Close Button */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-3 text-gold text-xs font-mono border border-gold/30 mb-2">
            <Sparkles className="h-3 w-3" />
            <span>FalkorDB Provenance Trace</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl text-text-primary tracking-tight">
            How {targetNpcName} <em className="italic text-signal font-serif">learned</em> about it
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Topic: <span className="text-text-primary font-medium">{provenance.eventTitle}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full bg-surface-3 text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors hover:bg-surface-1"
          title="Dismiss provenance card"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Provenance Chain Flow */}
      <div className="flex flex-wrap items-center gap-3 py-4 px-4 rounded-xl bg-surface-1 border border-border/60">
        {provenance.hops.map((hop, index) => {
          const isWitness = hop.isWitness;
          const isLast = index === provenance.hops.length - 1;

          return (
            <div key={hop.npcId} className="flex items-center gap-3">
              {/* Node Card in Chain */}
              <div
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isWitness
                    ? "bg-surface-3 border-gold/50 shadow-sm"
                    : isLast
                    ? "bg-surface-3 border-signal/50"
                    : "bg-surface-2 border-border"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-serif text-sm font-semibold shrink-0 relative ${
                    isWitness
                      ? "bg-gold text-on-gold"
                      : "bg-surface-1 text-text-primary border border-border"
                  }`}
                >
                  {isWitness && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-on-gold flex items-center justify-center">
                      <Eye className="h-2.5 w-2.5 stroke-[2.5]" />
                    </div>
                  )}
                  {hop.avatarInitials}
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-semibold text-xs text-text-primary">
                      {hop.npcName}
                    </span>
                    {isWitness && (
                      <span className="font-mono text-xs text-gold uppercase tracking-wider font-semibold">
                        [Origin]
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-tertiary block">{hop.role}</span>
                  <div className="mt-1 flex items-center gap-1 font-mono text-xs tabular-nums">
                    <span className="text-text-tertiary">Confidence:</span>
                    <span
                      className={`font-semibold ${
                        isWitness ? "text-gold" : "text-signal"
                      }`}
                    >
                      {(hop.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Hop Arrow with decay indicator */}
              {!isLast && (
                <div className="flex flex-col items-center gap-0.5 px-1">
                  <span className="font-mono text-xs text-text-tertiary tabular-nums">
                    decay
                  </span>
                  <ArrowRight className="h-4 w-4 text-signal translate-x-px" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border/40 text-xs font-mono text-text-tertiary">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-gold">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Eyewitness Provenance Verified</span>
          </span>
          <span>·</span>
          <span className="tabular-nums">Total Hops: {provenance.hopCount}</span>
          <span>·</span>
          <span className="tabular-nums">Decay Loss: {(provenance.totalDecay * 100).toFixed(0)}%</span>
        </div>
        <div className="text-signal font-medium">Graph Path: Q12_explain_provenance</div>
      </div>
    </div>
  );
}
