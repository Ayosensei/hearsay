import Link from "next/link";
import { Sparkles, Play, RotateCcw, Compass, Database, BookOpen } from "lucide-react";
import { ENGINE_MODE } from "../lib/engine-mode";

interface TopNavProps {
  tick: number;
  isAdvancing: boolean;
  /** True while any tool call (advance, talk, act) is in flight. */
  isBusy: boolean;
  onAdvanceTime: () => void;
  onResetWorld: () => void;
  onOpenComparison: () => void;
  onOpenActionModal: () => void;
}

export function TopNav({
  tick,
  isAdvancing,
  isBusy,
  onAdvanceTime,
  onResetWorld,
  onOpenComparison,
  onOpenActionModal,
}: TopNavProps) {
  return (
    <header className="h-14 border-b border-border bg-surface-1 px-4 flex items-center justify-between shrink-0">
      {/* Brand & World Info */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center p-0.5 relative">
          <div className="absolute inset-0 rounded-full chrome-ring opacity-80" />
          <div className="relative h-full w-full rounded-full bg-surface-1 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-signal" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg tracking-tight text-text-primary">Hearsay</span>
            <span className="font-mono text-xs text-text-tertiary">/ Hollowbrook</span>
          </div>
        </div>
      </div>

      {/* Center Controls: Tick Counter & Advance Time (Primary Action) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1.5 border border-border">
          <span className="text-xs text-text-tertiary font-sans">Tick</span>
          <span className="font-mono text-sm font-semibold text-text-primary tabular-nums">
            {String(tick).padStart(4, "0")}
          </span>
        </div>

        <button
          onClick={onAdvanceTime}
          disabled={isBusy}
          className="h-10 px-4 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-96 transition-all duration-120 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          title="Simulate 1 world tick (propagate gossip along trust network)"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{isAdvancing ? "Propagating..." : "Advance Time"}</span>
        </button>

        <button
          onClick={onOpenActionModal}
          disabled={isBusy}
          className="h-10 px-3.5 rounded-md bg-surface-2 hover:bg-surface-3 text-text-primary text-sm font-medium border border-border hover:border-signal/40 active:scale-96 transition-all duration-120 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Perform a helpful or harmful action in town"
        >
          <Sparkles className="h-3.5 w-3.5 text-signal" />
          <span>Act in Town</span>
        </button>
      </div>

      {/* Right Actions: Mode, Comparison, Reset & Styleguide */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenComparison}
          className="h-9 px-3 rounded-md bg-surface-2 text-signal hover:text-text-primary text-xs font-mono font-medium border border-signal/40 flex items-center gap-1.5 hover:bg-surface-3 transition-colors"
          title="Open Control vs Hearsay comparison"
        >
          <Sparkles className="h-3 w-3" />
          <span>Control vs Hearsay</span>
        </button>

        <div className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-mono text-text-secondary border border-border">
          <span className="h-2 w-2 rounded-full bg-success" />
          <Database className="h-3 w-3 text-text-tertiary" />
          <span>{ENGINE_MODE === "live" ? "falkordb" : "mock-engine"}</span>
        </div>

        <button
          onClick={onResetWorld}
          disabled={isBusy}
          className="h-9 px-3 rounded-md bg-surface-2 text-text-secondary hover:text-text-primary text-xs font-medium border border-border flex items-center gap-1.5 hover:bg-surface-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reset town simulation to initial state"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>

        <Link
          href="/landing"
          className="h-9 px-3 rounded-md bg-surface-2 text-text-secondary hover:text-text-primary text-xs font-medium border border-border flex items-center gap-1.5 hover:bg-surface-3 transition-colors"
          title="Product story and developer architecture"
        >
          <BookOpen className="h-3.5 w-3.5 text-signal" />
          <span>Product Overview</span>
        </Link>

        <Link
          href="/styleguide"
          className="h-9 px-3 rounded-md bg-surface-2 text-text-secondary hover:text-text-primary text-xs font-medium border border-border flex items-center gap-1.5 hover:bg-surface-3 transition-colors"
          title="View design tokens and components"
        >
          <Compass className="h-3.5 w-3.5 text-signal" />
          <span>Styleguide</span>
        </Link>
      </div>
    </header>
  );
}
