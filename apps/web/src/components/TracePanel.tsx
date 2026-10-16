import { useState } from "react";
import { TraceStep, AgentType } from "../lib/types";
import { Terminal, ChevronDown, ChevronRight, Activity, Clock } from "lucide-react";

interface TracePanelProps {
  traces: TraceStep[];
}

export function TracePanel({ traces }: TracePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const totalMs = traces.reduce((acc, t) => acc + t.ms, 0);

  return (
    <div className="border-t border-border bg-surface-1 shrink-0 transition-all duration-200">
      {/* Drawer Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-6 flex items-center justify-between text-xs font-mono text-text-tertiary hover:bg-surface-2/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-signal" />
          <span className="font-semibold text-text-secondary">FalkorDB Query Traces</span>
          <span className="tabular-nums bg-surface-3 px-1.5 py-0.5 rounded text-text-secondary">
            {traces.length} steps
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 tabular-nums text-text-tertiary">
            <Clock className="h-3 w-3 text-gold" />
            <span>Cumulative:</span>
            <span className="text-gold font-medium">{totalMs.toFixed(1)} ms</span>
          </div>
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </div>
      </button>

      {/* Expandable Trace Rows */}
      {isOpen && (
        <div className="p-3 px-6 border-t border-border/60 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
          {traces.length === 0 ? (
            <p className="text-text-tertiary text-center py-2">No queries executed yet in this session.</p>
          ) : (
            traces.map((trace, idx) => {
              const isExpanded = expandedRow === idx;
              const agentDot = getAgentDot(trace.agent);

              return (
                <div key={idx} className="flex flex-col">
                  <div
                    onClick={() => setExpandedRow(isExpanded ? null : idx)}
                    className="flex items-center justify-between p-2 rounded-md bg-surface-2 hover:bg-surface-3 border border-border/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${agentDot}`} />
                      <span className="text-text-primary font-medium truncate">
                        {trace.queryId}
                      </span>
                      <span className="text-text-tertiary truncate">
                        tool:{trace.tool}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 tabular-nums shrink-0">
                      <span className="text-text-tertiary">{trace.rows} rows</span>
                      <span className="text-signal font-medium">{trace.ms.toFixed(1)} ms</span>
                    </div>
                  </div>

                  {/* Expanded Args JSON preview */}
                  {isExpanded && (
                    <div className="mt-1 p-2.5 rounded-md bg-surface-3 border border-border/60 text-xs text-text-secondary">
                      <div className="text-text-tertiary mb-1 uppercase tracking-wider text-xs font-semibold">
                        Query Arguments ($params):
                      </div>
                      <pre className="text-text-primary whitespace-pre-wrap">
                        {JSON.stringify(trace.args, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function getAgentDot(agent: AgentType): string {
  switch (agent) {
    case "scribe":
      return "bg-agent-scribe";
    case "gossip":
      return "bg-agent-gossip";
    case "npc":
      return "bg-agent-npc";
    case "system":
      return "bg-agent-system";
  }
}
