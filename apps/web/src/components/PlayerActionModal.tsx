import { useState } from "react";
import { NPC } from "../lib/types";
import { PLACES } from "../lib/places";
import { useEscapeKey } from "../lib/use-escape-key";
import { X, Zap, HeartHandshake, Skull, Eye, MapPin, Sparkles } from "lucide-react";

interface PlayerActionModalProps {
  isOpen: boolean;
  npcs: NPC[];
  onClose: () => void;
  onSubmitAction: (
    actionTitle: string,
    actionType: "harm" | "help",
    witnessId: string,
    placeName: string
  ) => void;
}

const PRESET_HELPFUL = [
  "Donate 50 gold to the apothecary",
  "Help Garrick forge city gate hinges",
  "Rescue the courier from road bandits",
];

const PRESET_HARMFUL = [
  "Pickpocket the tavern patron's pouch",
  "Poison the Guard armory well",
  "Smuggle contraband through the city gate",
];

// Matches MAX_ACTION_TITLE in mock-engine.ts so nothing is truncated silently.
const MAX_TITLE = 80;

export function PlayerActionModal({
  isOpen,
  npcs,
  onClose,
  onSubmitAction,
}: PlayerActionModalProps) {
  const [actionType, setActionType] = useState<"harm" | "help">("help");
  const [selectedTitle, setSelectedTitle] = useState(PRESET_HELPFUL[0]);
  const [customTitle, setCustomTitle] = useState("");
  const [selectedWitnessId, setSelectedWitnessId] = useState(npcs[0]?.id || "");
  const [selectedPlace, setSelectedPlace] = useState<string>(PLACES[0]);

  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = customTitle.trim() || selectedTitle;
    if (!finalTitle || !selectedWitnessId) return;

    onSubmitAction(finalTitle, actionType, selectedWitnessId, selectedPlace);
    onClose();
  };

  const selectedWitness = npcs.find((n) => n.id === selectedWitnessId) || npcs[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-enter"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Perform an action in Hollowbrook"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-surface-1 border border-border card-elevation overflow-hidden shadow-2xl relative"
      >
        {/* Chrome Accent Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 chrome-ring opacity-90" />

        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-3 text-signal text-xs font-mono border border-signal/30 mb-2">
              <Zap className="h-3 w-3" />
              <span>World Event Simulator</span>
            </div>
            <h2 className="font-serif text-2xl text-text-primary tracking-tight">
              Perform an action in <em className="italic text-signal font-serif">Hollowbrook</em>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Your deed is witnessed by an NPC, generating an event node and starting a new gossip wave.
            </p>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-surface-2 text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors hover:bg-surface-3"
            title="Cancel"
            aria-label="Close action dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Action Type Toggle */}
          <div>
            <label className="font-mono text-text-tertiary uppercase tracking-wider block mb-2 font-semibold">
              1. Choose Intent
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActionType("help");
                  setSelectedTitle(PRESET_HELPFUL[0]);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  actionType === "help"
                    ? "bg-surface-3 border-success text-success shadow-sm"
                    : "bg-surface-2 border-border text-text-secondary hover:bg-surface-2/80"
                }`}
              >
                <HeartHandshake className="h-4 w-4" />
                <span className="font-semibold text-xs">Helpful Deed (+Attitude)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionType("harm");
                  setSelectedTitle(PRESET_HARMFUL[0]);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                  actionType === "harm"
                    ? "bg-surface-3 border-danger text-danger shadow-sm"
                    : "bg-surface-2 border-border text-text-secondary hover:bg-surface-2/80"
                }`}
              >
                <Skull className="h-4 w-4" />
                <span className="font-semibold text-xs">Harmful Act (-Attitude)</span>
              </button>
            </div>
          </div>

          {/* Action Selection / Input */}
          <div>
            <label className="font-mono text-text-tertiary uppercase tracking-wider block mb-2 font-semibold">
              2. Select or Describe the Deed
            </label>
            <div className="space-y-1.5 mb-2.5">
              {(actionType === "help" ? PRESET_HELPFUL : PRESET_HARMFUL).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedTitle(preset);
                    setCustomTitle("");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                    selectedTitle === preset && !customTitle
                      ? "bg-surface-3 border-signal/60 text-text-primary font-medium"
                      : "bg-surface-2 border-border/60 text-text-secondary hover:bg-surface-3/50"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={customTitle}
              maxLength={MAX_TITLE}
              aria-label="Custom action description"
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Or write a custom action..."
              className="w-full h-9 rounded-md bg-surface-2 px-3 text-xs text-text-primary placeholder:text-text-tertiary border border-border focus:outline-none focus:ring-1 focus:ring-signal"
            />
          </div>

          {/* Eyewitness Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-text-tertiary uppercase tracking-wider font-semibold">
                3. Physical Eyewitness (Origin Witness)
              </label>
              <span className="text-gold font-mono flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>100% Provenance</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {npcs.map((npc) => {
                const isSelected = npc.id === selectedWitnessId;

                return (
                  <button
                    key={npc.id}
                    type="button"
                    onClick={() => setSelectedWitnessId(npc.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? "bg-surface-3 border-gold text-text-primary shadow-sm"
                        : "bg-surface-2 border-border text-text-secondary hover:bg-surface-3/60"
                    }`}
                  >
                    <div className="h-7 w-7 rounded-full bg-surface-1 border border-border flex items-center justify-center font-serif text-xs font-semibold shrink-0">
                      {npc.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-semibold truncate text-xs">{npc.name}</span>
                      <span className="block text-text-tertiary truncate text-xs font-mono">{npc.role.split("(")[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-text-tertiary text-xs">
              Only {selectedWitness?.name} will see you do this. Other NPCs will only learn about it as gossip spreads.
            </p>
          </div>

          {/* Location Picker */}
          <div>
            <label className="font-mono text-text-tertiary uppercase tracking-wider block mb-2 font-semibold">
              4. Location in Town
            </label>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-signal shrink-0" />
              <select
                value={selectedPlace}
                aria-label="Location in town"
                onChange={(e) => setSelectedPlace(e.target.value)}
                className="flex-1 h-9 rounded-md bg-surface-2 px-3 text-xs text-text-primary border border-border focus:outline-none focus:ring-1 focus:ring-signal"
              >
                {PLACES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Submit */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-md bg-primary text-on-primary text-xs font-medium hover:bg-primary-hover active:scale-96 transition-all shadow-sm flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Commit Action in Town</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
