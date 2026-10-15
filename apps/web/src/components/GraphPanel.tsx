import { GraphNode, GraphEdge, FactionType } from "../lib/types";
import { Share2, Sparkles, Layers } from "lucide-react";

interface GraphPanelProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNpcId: string;
  activePathEdgeIds: string[];
  activeWitnessId?: string;
  onSelectNode: (id: string) => void;
}

export function GraphPanel({
  nodes,
  edges,
  selectedNpcId,
  activePathEdgeIds,
  activeWitnessId,
  onSelectNode,
}: GraphPanelProps) {
  const isHighlightMode = activePathEdgeIds.length > 0;

  return (
    <section className="flex-1 bg-surface-1 flex flex-col relative overflow-hidden">
      {/* Panel Top Bar / Graph Status */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0 bg-surface-1/90 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-signal" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
            Social Trust Network
          </h2>
          <span className="font-mono text-xs text-text-tertiary">
            (FalkorDB Graph)
          </span>
        </div>

        {isHighlightMode && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-2 border border-signal/40 signal-glow text-xs font-mono text-signal animate-pulse">
            <Sparkles className="h-3 w-3" />
            <span>Rumor Propagation Active</span>
          </div>
        )}
      </div>

      {/* Interactive Vector Graph Area */}
      <div className="flex-1 relative flex items-center justify-center p-6 select-none overflow-hidden">
        {/* Subtle grid background pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(143,162,255,0.4) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* SVG Graph Viewport */}
        <svg
          viewBox="0 0 640 440"
          className="w-full h-full max-w-4xl max-h-[560px] relative z-10"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="18"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-signal)" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isPathActive = activePathEdgeIds.includes(edge.id);
            const x1 = sourceNode.x || 0;
            const y1 = sourceNode.y || 0;
            const x2 = targetNode.x || 0;
            const y2 = targetNode.y || 0;
            const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;

            return (
              <g
                key={edge.id}
                className={`transition-opacity duration-320 ${
                  isHighlightMode && !isPathActive ? "opacity-25" : "opacity-100"
                }`}
              >
                {/* Edge Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isPathActive ? "var(--color-signal)" : "var(--color-border-strong)"}
                  strokeWidth={isPathActive ? 3.5 : 1.5}
                  strokeDasharray={edge.type === "WITNESSED" ? "4 4" : undefined}
                  className={isPathActive ? "filter drop-shadow-[0_0_8px_rgba(143,162,255,0.85)]" : undefined}
                />

                {/* Animated Particles flowing along active rumor edges */}
                {isPathActive && (
                  <>
                    <circle
                      r="3.5"
                      fill="var(--color-signal)"
                      className="filter drop-shadow-[0_0_6px_var(--color-signal)]"
                    >
                      <animateMotion
                        dur="1.6s"
                        repeatCount="indefinite"
                        path={pathD}
                      />
                    </circle>
                    <circle
                      r="2.5"
                      fill="var(--color-gold)"
                      className="filter drop-shadow-[0_0_4px_var(--color-gold)]"
                    >
                      <animateMotion
                        dur="1.6s"
                        begin="0.8s"
                        repeatCount="indefinite"
                        path={pathD}
                      />
                    </circle>
                  </>
                )}

                {/* Weight / Type label on edge center */}
                {edge.weight && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 6}
                    fill={isPathActive ? "var(--color-signal)" : "var(--color-text-tertiary)"}
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {edge.type === "WITNESSED" ? "saw" : `${(edge.weight * 100).toFixed(0)}% trust`}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const isSelected = node.id === selectedNpcId;
            const isWitness = node.id === activeWitnessId;
            const x = node.x || 0;
            const y = node.y || 0;
            const isEvent = node.type === "event";

            // If highlight mode is active, dim nodes that are not in the path
            const isInActivePath =
              isSelected ||
              isWitness ||
              edges.some(
                (e) =>
                  activePathEdgeIds.includes(e.id) &&
                  (e.source === node.id || e.target === node.id)
              );

            const nodeOpacity = isHighlightMode && !isInActivePath ? "opacity-30" : "opacity-100";

            if (isEvent) {
              const isHelp = node.eventType === "help";
              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => onSelectNode(node.id)}
                  className={`cursor-pointer group transition-opacity duration-320 ${nodeOpacity}`}
                >
                  {/* Diamond shape for Event */}
                  <rect
                    x="-18"
                    y="-18"
                    width="36"
                    height="36"
                    rx="6"
                    transform="rotate(45)"
                    fill="var(--color-surface-2)"
                    stroke={isHelp ? "var(--color-success)" : "var(--color-danger)"}
                    strokeWidth="2"
                    className="transition-transform group-hover:scale-110"
                  />
                  <text
                    y="32"
                    fill="var(--color-text-primary)"
                    fontSize="11"
                    fontFamily="sans-serif"
                    fontWeight="500"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {node.label}
                  </text>
                  <text
                    y="44"
                    fill={isHelp ? "var(--color-success)" : "var(--color-danger)"}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    [{isHelp ? "HELP" : "HARM"}]
                  </text>
                </g>
              );
            }

            // NPC Node
            const factionVar = getFactionVar(node.faction);

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSelectNode(node.id)}
                className={`cursor-pointer group transition-opacity duration-320 ${nodeOpacity}`}
              >
                {/* Selected glow ring */}
                {isSelected && (
                  <circle
                    r="28"
                    fill="none"
                    stroke="var(--color-signal)"
                    strokeWidth="2"
                    className="animate-pulse"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Eyewitness Gold Indicator */}
                {isWitness && (
                  <circle
                    r="25"
                    fill="none"
                    stroke="var(--color-gold)"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ animationDuration: "12s" }}
                  />
                )}

                {/* Node Circle */}
                <circle
                  r="20"
                  fill="var(--color-surface-1)"
                  stroke={isWitness ? "var(--color-gold)" : factionVar}
                  strokeWidth="2.5"
                  className="transition-transform group-hover:scale-110"
                />

                {/* Node Label inside */}
                <text
                  y="4"
                  fill="var(--color-text-primary)"
                  fontSize="10"
                  fontFamily="serif"
                  fontWeight="600"
                  textAnchor="middle"
                  className="select-none pointer-events-none"
                >
                  {node.label.slice(0, 3).toUpperCase()}
                </text>

                {/* Name beneath */}
                <text
                  y="34"
                  fill={isSelected ? "var(--color-signal)" : "var(--color-text-primary)"}
                  fontSize="12"
                  fontFamily="sans-serif"
                  fontWeight={isSelected ? "600" : "400"}
                  textAnchor="middle"
                  className="select-none pointer-events-none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Graph Legend */}
        <div className="absolute bottom-4 right-4 bg-surface-2/95 border border-border p-3 rounded-xl card-elevation backdrop-blur text-xs font-mono space-y-1.5 z-10">
          <div className="flex items-center gap-1.5 text-text-tertiary mb-1 font-semibold uppercase text-xs">
            <Layers className="h-3 w-3 text-signal" />
            <span>Legend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-faction-townsfolk" />
            <span className="text-text-secondary">Townsfolk</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-faction-guard" />
            <span className="text-text-secondary">City Guard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-faction-merchants" />
            <span className="text-text-secondary">Merchants Guild</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border/40">
            <span className="h-2 w-2 rotate-45 rounded-sm bg-danger" />
            <span className="text-text-secondary">Harm Event</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rotate-45 rounded-sm bg-success" />
            <span className="text-text-secondary">Help Event</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-gold font-semibold">Eyewitness (Origin)</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function getFactionVar(faction?: FactionType): string {
  switch (faction) {
    case "townsfolk":
      return "var(--color-faction-townsfolk)";
    case "guard":
      return "var(--color-faction-guard)";
    case "merchants":
      return "var(--color-faction-merchants)";
    default:
      return "var(--color-text-tertiary)";
  }
}
