import { Terminal } from "lucide-react";

/** Token kinds map to DESIGN.md §7 code-card colours: text, signal, gold (strings), tertiary (comments). */
export type CodeKind = "text" | "kw" | "str" | "cmt";
export type CodeLine = Array<[string, CodeKind]>;

const KIND_CLASS: Record<CodeKind, string> = {
  text: "text-text-primary",
  kw: "text-signal",
  str: "text-gold",
  cmt: "text-text-tertiary",
};

interface CodeCardProps {
  filename: string;
  language: string;
  lines: CodeLine[];
}

export function CodeCard({ filename, language, lines }: CodeCardProps) {
  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-2 card-elevation overflow-hidden">
      <div className="h-10 px-4 bg-surface-2 rounded-t-xl border-b border-border flex items-center justify-between text-xs font-mono text-text-tertiary">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-signal" />
          <span className="text-text-secondary font-medium">{filename}</span>
        </div>
        <span>{language}</span>
      </div>
      <pre className="p-5 font-mono text-xs leading-relaxed overflow-x-auto">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="min-h-5 whitespace-pre">
              {line.map(([text, kind], j) => (
                <span key={j} className={KIND_CLASS[kind]}>
                  {text}
                </span>
              ))}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
