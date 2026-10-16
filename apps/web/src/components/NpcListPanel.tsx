import { NPC, FactionType, AttitudeType } from "../lib/types";
import {
  Users,
  Eye,
  Ear,
  Minus,
  HeartHandshake,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface NpcListPanelProps {
  npcs: NPC[];
  selectedNpcId: string;
  onSelectNpc: (id: string) => void;
}

export function NpcListPanel({
  npcs,
  selectedNpcId,
  onSelectNpc,
}: NpcListPanelProps) {
  return (
    <aside className="w-80 border-r border-border bg-surface-1 flex flex-col shrink-0 overflow-hidden">
      {/* Panel Header */}
      <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-signal" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary font-mono">
            Inhabitants
          </h2>
        </div>
        <span className="font-mono text-xs text-text-tertiary tabular-nums">
          {npcs.length} NPCs
        </span>
      </div>

      {/* NPC List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {npcs.map((npc) => {
          const isSelected = npc.id === selectedNpcId;
          const factionBorder = getFactionBorder(npc.faction);
          const attitudeData = getAttitudeConfig(npc.attitude);
          const AttitudeIcon = attitudeData.icon;

          return (
            <button
              key={npc.id}
              onClick={() => onSelectNpc(npc.id)}
              aria-pressed={isSelected}
              className={`w-full text-left rounded-xl p-3 border transition-colors duration-120 flex flex-col gap-2.5 relative ${
                isSelected
                  ? "bg-surface-3 border-signal/50 shadow-md"
                  : "bg-surface-2 border-border hover:border-border-strong hover:bg-surface-2/80"
              }`}
            >
              {/* NPC Header row */}
              <div className="flex items-start gap-3">
                {/* Avatar with faction ring & selected chrome ring */}
                <div className="relative shrink-0">
                  {isSelected && (
                    <div className="absolute -inset-0.5 rounded-full chrome-ring opacity-90" />
                  )}
                  <div
                    className={`relative h-10 w-10 rounded-full bg-surface-1 border-2 ${factionBorder} flex items-center justify-center font-serif text-sm font-medium text-text-primary`}
                  >
                    {npc.avatarInitials}
                  </div>
                </div>

                {/* Name & Role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans font-semibold text-sm text-text-primary truncate">
                      {npc.name}
                    </h3>
                  </div>
                  <p className="text-xs text-text-tertiary truncate">{npc.role}</p>
                </div>
              </div>

              {/* Badges row: Attitude + Knowledge */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40 gap-1.5">
                {/* Attitude Pill */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${attitudeData.bg} ${attitudeData.color}`}
                >
                  <AttitudeIcon className="h-3 w-3 shrink-0" />
                  <span>{attitudeData.label}</span>
                  <span className="font-mono tabular-nums opacity-75 text-xs">
                    {npc.attitudeScore > 0 ? `+${npc.attitudeScore.toFixed(2)}` : npc.attitudeScore.toFixed(2)}
                  </span>
                </span>

                {/* Knowledge Chip */}
                {npc.knowledgeState === "eyewitness" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-gold text-xs border border-gold/30">
                    <Eye className="h-3 w-3" />
                    <span>Witness</span>
                  </span>
                )}
                {npc.knowledgeState === "heard" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-signal text-xs border border-signal/30">
                    <Ear className="h-3 w-3" />
                    <span className="font-mono tabular-nums">
                      {npc.primaryRumor ? (npc.primaryRumor.confidence * 100).toFixed(0) + "%" : "Heard"}
                    </span>
                  </span>
                )}
                {npc.knowledgeState === "none" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-text-tertiary text-xs">
                    <Minus className="h-3 w-3" />
                    <span>Unaware</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function getFactionBorder(faction: FactionType): string {
  switch (faction) {
    case "townsfolk":
      return "border-faction-townsfolk";
    case "guard":
      return "border-faction-guard";
    case "merchants":
      return "border-faction-merchants";
    default:
      return "border-border";
  }
}

function getAttitudeConfig(attitude: AttitudeType) {
  switch (attitude) {
    case "hostile":
      return { label: "Hostile", color: "text-attitude-hostile", bg: "bg-attitude-hostile/15", icon: Flame };
    case "wary":
      return { label: "Wary", color: "text-attitude-wary", bg: "bg-attitude-wary/15", icon: AlertTriangle };
    case "neutral":
      return { label: "Neutral", color: "text-attitude-neutral", bg: "bg-attitude-neutral/15", icon: Clock };
    case "friendly":
      return { label: "Friendly", color: "text-attitude-friendly", bg: "bg-attitude-friendly/15", icon: HeartHandshake };
    case "devoted":
      return { label: "Devoted", color: "text-attitude-devoted", bg: "bg-attitude-devoted/15", icon: CheckCircle2 };
  }
}
