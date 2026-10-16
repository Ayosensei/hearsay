import { useEffect, useRef, useState } from "react";
import { NPC, DialogueMessage, ProvenanceChain } from "../lib/types";
import { MessageSquare, Send, Eye, Sparkles, ShieldAlert } from "lucide-react";

interface DialoguePanelProps {
  selectedNpc: NPC;
  messages: DialogueMessage[];
  /** A reply from *this* NPC is pending (drives the typing indicator). */
  isSending: boolean;
  /** Any tool call is in flight, so sending would be ignored. */
  isBusy: boolean;
  onSendMessage: (text: string) => void;
  onInspectProvenance: (provenance: ProvenanceChain) => void;
}

const MAX_MESSAGE = 280;

export function DialoguePanel({
  selectedNpc,
  messages,
  isSending,
  isBusy,
  onSendMessage,
  onInspectProvenance,
}: DialoguePanelProps) {
  const [inputText, setInputText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasSending = useRef(false);

  // Keep the newest message (or typing indicator) in view.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isSending, selectedNpc.id]);

  // A disabled input loses focus; hand it back when the reply lands.
  useEffect(() => {
    if (wasSending.current && !isSending) inputRef.current?.focus();
    wasSending.current = isSending;
  }, [isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isBusy) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const factionBorderClass =
    selectedNpc.faction === "townsfolk"
      ? "border-l-faction-townsfolk"
      : selectedNpc.faction === "guard"
      ? "border-l-faction-guard"
      : "border-l-faction-merchants";

  return (
    <aside className="w-96 border-l border-border bg-surface-1 flex flex-col shrink-0 overflow-hidden">
      {/* Panel Header */}
      <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0 bg-surface-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-full bg-surface-2 border border-border flex items-center justify-center font-serif text-xs font-semibold text-text-primary shrink-0">
            {selectedNpc.avatarInitials}
          </div>
          <div className="min-w-0">
            <h3 className="font-sans font-semibold text-sm text-text-primary truncate">
              {selectedNpc.name}
            </h3>
            <p className="text-xs text-text-tertiary truncate">{selectedNpc.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-xs text-text-tertiary">Firewall:</span>
          <span className="flex items-center gap-1 text-xs font-mono text-signal">
            <ShieldAlert className="h-3 w-3" />
            <span>Active</span>
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div role="log" aria-live="polite" className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-tertiary">
            <MessageSquare className="h-8 w-8 stroke-1 text-text-tertiary/60 mb-2" />
            <p className="text-xs max-w-56">
              Speak to {selectedNpc.name}. They will only answer with what they know.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isPlayer = msg.sender === "player";

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPlayer ? "items-end" : "items-start"}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-xs rounded-xl p-3 text-xs leading-relaxed ${
                    isPlayer
                      ? "bg-surface-3 text-text-primary rounded-br-xs"
                      : `bg-surface-2 text-text-primary border-l-2 ${factionBorderClass} rounded-bl-xs card-elevation`
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Why? Provenance Action button under NPC message */}
                  {!isPlayer && msg.provenance && (
                    <button
                      onClick={() => msg.provenance && onInspectProvenance(msg.provenance)}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-3 hover:bg-surface-1 text-xs font-mono text-gold border border-gold/40 transition-colors active:scale-96"
                      title="Inspect graph provenance trail"
                    >
                      <Eye className="h-3 w-3 text-gold" />
                      <span>Why do you know this?</span>
                      <Sparkles className="h-2.5 w-2.5 text-signal" />
                    </button>
                  )}
                </div>

                {/* Metadata timestamp */}
                <div className="mt-1 px-1 flex items-center gap-2 text-xs font-mono text-text-tertiary">
                  <span>{msg.timestamp}</span>
                  {!isPlayer && msg.groundedInKnowledge && (
                    <>
                      <span>·</span>
                      <span className="text-signal">Graph-grounded</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Dynamic Typing Indicator */}
        {isSending && (
          <div className="flex items-center gap-2 p-3 rounded-xl rounded-bl-xs bg-surface-2 text-text-tertiary text-xs max-w-48 card-elevation border-l-2 border-signal">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse delay-150" />
              <span className="h-1.5 w-1.5 rounded-full bg-signal animate-pulse delay-300" />
            </div>
            <span className="font-mono text-xs text-text-secondary">
              {selectedNpc.name.split(" ")[0]} replying...
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Box Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border bg-surface-1 shrink-0"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            maxLength={MAX_MESSAGE}
            aria-label={`Message ${selectedNpc.name}`}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask ${selectedNpc.name.split(" ")[0]} something...`}
            disabled={isBusy}
            className="flex-1 h-10 rounded-md bg-surface-2 px-3 text-xs text-text-primary placeholder:text-text-tertiary border border-border focus:outline-none focus:ring-1 focus:ring-signal transition-colors"
          />
          <button
            type="submit"
            disabled={isBusy || !inputText.trim()}
            className="h-10 w-10 rounded-md bg-primary text-on-primary flex items-center justify-center hover:bg-primary-hover active:scale-96 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Send dialogue"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </aside>
  );
}
