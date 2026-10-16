import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Shield,
  Eye,
  Ear,
  Activity,
  ArrowRight,
  User,
  HeartHandshake,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Terminal,
} from "lucide-react";

export default function StyleguidePage() {
  const attitudes = [
    { label: "Hostile", color: "text-attitude-hostile", bg: "bg-attitude-hostile/15", score: "-0.85", icon: Flame },
    { label: "Wary", color: "text-attitude-wary", bg: "bg-attitude-wary/15", score: "-0.32", icon: AlertTriangle },
    { label: "Neutral", color: "text-attitude-neutral", bg: "bg-attitude-neutral/15", score: "0.00", icon: Clock },
    { label: "Friendly", color: "text-attitude-friendly", bg: "bg-attitude-friendly/15", score: "+0.55", icon: HeartHandshake },
    { label: "Devoted", color: "text-attitude-devoted", bg: "bg-attitude-devoted/15", score: "+0.95", icon: CheckCircle2 },
  ];

  const factions = [
    { name: "Townsfolk", color: "text-faction-townsfolk", border: "border-faction-townsfolk" },
    { name: "City Guard", color: "text-faction-guard", border: "border-faction-guard" },
    { name: "Merchants Guild", color: "text-faction-merchants", border: "border-faction-merchants" },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 md:p-12 max-w-6xl mx-auto space-y-16">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-text-tertiary hover:text-signal transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Hollowbrook</span>
          </Link>
          <h1 className="font-serif text-4xl text-text-primary">
            Hearsay <em className="italic text-signal font-serif">Styleguide</em>
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Visual reference for tokens, typography, and atomic components per DESIGN.md.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/landing"
            className="text-xs font-mono text-text-tertiary hover:text-signal transition-colors border border-border px-3 py-1.5 rounded-md bg-surface-1"
          >
            Product Landing →
          </Link>
          <div className="font-mono text-xs text-text-tertiary border border-border px-3 py-1.5 rounded-md bg-surface-1">
            v0.1.0 · Tailwind v4
          </div>
        </div>
      </header>

      {/* 01. Color Palette */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary tracking-wider uppercase">
          <span className="text-signal font-semibold">01</span>
          <span>Color & Surface Hierarchy</span>
        </div>

        {/* Surfaces */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-secondary">Surfaces & Layers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-surface-1 p-4 border border-border">
              <span className="font-mono text-xs text-text-tertiary block mb-1">surface-1</span>
              <span className="text-sm font-medium">Panels & Canvas</span>
            </div>
            <div className="rounded-lg bg-surface-2 p-4 border border-border card-elevation">
              <span className="font-mono text-xs text-text-tertiary block mb-1">surface-2</span>
              <span className="text-sm font-medium">Cards & Inputs</span>
            </div>
            <div className="rounded-lg bg-surface-3 p-4 border border-border raised-elevation">
              <span className="font-mono text-xs text-text-tertiary block mb-1">surface-3</span>
              <span className="text-sm font-medium">Raised & Active</span>
            </div>
            <div className="rounded-lg bg-surface-2 p-4 border border-signal/40 signal-glow">
              <span className="font-mono text-xs text-signal block mb-1">signal-glow</span>
              <span className="text-sm font-medium text-signal">Rumor Path Active</span>
            </div>
          </div>
        </div>

        {/* Signals & Accents */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-text-secondary">Chromatic Accents (Meaning & Provenance)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg bg-surface-2 p-4 border border-border">
              <div className="h-3 w-3 rounded-full bg-primary mb-2" />
              <span className="font-mono text-xs text-text-tertiary block">primary fill</span>
              <span className="text-sm font-medium font-mono text-xs">token(primary)</span>
            </div>
            <div className="rounded-lg bg-surface-2 p-4 border border-border">
              <div className="h-3 w-3 rounded-full bg-signal mb-2" />
              <span className="font-mono text-xs text-signal block">signal text / path</span>
              <span className="text-sm font-medium text-signal font-mono text-xs">token(signal)</span>
            </div>
            <div className="rounded-lg bg-surface-2 p-4 border border-border">
              <div className="h-3 w-3 rounded-full bg-gold mb-2" />
              <span className="font-mono text-xs text-gold block">gold (provenance)</span>
              <span className="text-sm font-medium text-gold font-mono text-xs">token(gold)</span>
            </div>
            <div className="rounded-lg bg-surface-2 p-4 border border-border">
              <div className="h-3 w-3 rounded-full bg-danger mb-2" />
              <span className="font-mono text-xs text-danger block">danger / harm</span>
              <span className="text-sm font-medium text-danger font-mono text-xs">token(danger)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 02. Typography */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary tracking-wider uppercase">
          <span className="text-signal font-semibold">02</span>
          <span>Typography & Numbers</span>
        </div>

        <div className="rounded-xl bg-surface-2 p-6 border border-border space-y-6 card-elevation">
          <div>
            <span className="font-mono text-xs text-text-tertiary block mb-1">Instrument Serif (Display)</span>
            <div className="font-serif text-3xl md:text-4xl text-text-primary">
              How Garrick <em className="italic text-signal font-serif">learned</em> about the stolen relic.
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <span className="font-mono text-xs text-text-tertiary block mb-1">Geist Sans (UI & Dialogue)</span>
            <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
              &quot;I didn&apos;t see anything myself, but Martha told me the player was spotted outside the tavern at midnight.&quot;
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <span className="font-mono text-xs text-text-tertiary block mb-1">Geist Mono (Tabular Numeral & Query Traces)</span>
            <div className="flex flex-wrap gap-6 font-mono text-xs text-text-secondary">
              <span className="tabular-nums">tick: 0042</span>
              <span className="tabular-nums">decay: 0.90 → 0.63</span>
              <span className="tabular-nums">latency: 4.8ms</span>
              <span className="text-signal">Q40_gossip_candidates</span>
            </div>
          </div>
        </div>
      </section>

      {/* 03. Domain Components */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary tracking-wider uppercase">
          <span className="text-signal font-semibold">03</span>
          <span>Core Domain Components</span>
        </div>

        {/* Attitude Badges */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary">Attitude Badges (Pills)</h2>
          <div className="flex flex-wrap gap-3">
            {attitudes.map((att) => {
              const Icon = att.icon;
              return (
                <div
                  key={att.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${att.bg} ${att.color}`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{att.label}</span>
                  <span className="font-mono tabular-nums opacity-75">{att.score}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Knows Chips */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary">Knowledge Chips</h2>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-3 text-xs text-text-tertiary">
              <User className="h-3 w-3" />
              <span>Knows nothing</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-3 text-xs text-signal border border-signal/30">
              <Ear className="h-3 w-3" />
              <span>Heard via Martha (0.63)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-3 text-xs text-gold border border-gold/30">
              <Eye className="h-3 w-3" />
              <span>Eyewitness (1.00)</span>
            </span>
          </div>
        </div>

        {/* Buttons in all states */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary">Button States</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <button className="h-10 px-4 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-96 transition-all duration-120 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Primary (Advance Time)</span>
            </button>
            <button className="h-10 px-4 rounded-md bg-surface-3 text-text-primary text-sm font-medium hover:bg-surface-2 active:scale-96 transition-all duration-120 border border-border">
              <span>Secondary (Inspect)</span>
            </button>
            <button className="h-10 px-4 rounded-md text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
              <span>Ghost Action</span>
            </button>
            <button disabled className="h-10 px-4 rounded-md bg-primary opacity-40 text-on-primary text-sm font-medium cursor-not-allowed">
              <span>Disabled State</span>
            </button>
          </div>
        </div>

        {/* NPC Card Preview */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary">NPC Card with Faction Ring & Attitude</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {factions.map((f, i) => (
              <div
                key={f.name}
                className="rounded-xl bg-surface-2 p-4 border border-border card-elevation flex flex-col justify-between space-y-4 hover:border-signal/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-full bg-surface-3 border-2 ${f.border} flex items-center justify-center font-serif text-lg text-text-primary relative`}>
                    {i === 0 ? "G" : i === 1 ? "M" : "B"}
                    {i === 0 && (
                      <div className="absolute -inset-[2px] rounded-full chrome-ring opacity-90 -z-10" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-sans font-semibold text-text-primary text-sm">
                      {i === 0 ? "Garrick Vance" : i === 1 ? "Martha Finch" : "Bartholomew"}
                    </h3>
                    <span className="text-xs text-text-tertiary">{f.name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="text-xs font-mono text-signal flex items-center gap-1">
                    <Ear className="h-3 w-3" />
                    <span>0.72 trust</span>
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-attitude-wary/15 text-attitude-wary font-medium">
                    Wary
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trace Row Component */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary">Query Trace Row (Zero Cypher, Latency & Rows)</h2>
          <div className="rounded-xl bg-surface-1 border border-border p-4 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between p-2 rounded-md bg-surface-2 text-text-secondary border border-border/40">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-agent-gossip" />
                <span className="text-text-primary font-medium">Q40_gossip_candidates</span>
                <span className="text-text-tertiary">[npc_id: &quot;garrick&quot;]</span>
              </div>
              <div className="flex items-center gap-4 tabular-nums">
                <span className="text-text-tertiary">14 rows</span>
                <span className="text-signal">3.2 ms</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-md bg-surface-2 text-text-secondary border border-border/40">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-agent-scribe" />
                <span className="text-text-primary font-medium">Q12_explain_provenance</span>
                <span className="text-text-tertiary">[event: &quot;theft_relic&quot;]</span>
              </div>
              <div className="flex items-center gap-4 tabular-nums">
                <span className="text-text-tertiary">3 hops</span>
                <span className="text-gold">1.8 ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 04. Signature Moment: The Why? Card */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary tracking-wider uppercase">
          <span className="text-signal font-semibold">04</span>
          <span>Signature Moment #1: The &quot;Why?&quot; Card</span>
        </div>

        <div className="rounded-2xl bg-surface-2 p-6 border border-border card-elevation signal-glow relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 chrome-ring opacity-90" />
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-3 text-gold text-xs font-mono border border-gold/30 mb-2">
                <Sparkles className="h-3 w-3" />
                <span>FalkorDB Provenance Trace</span>
              </div>
              <h2 className="font-serif text-3xl text-text-primary tracking-tight">
                How Garrick Vance <em className="italic text-signal font-serif">learned</em> about it
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Topic: <span className="text-text-primary font-medium">Theft of the Sun-Stone Relic</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 py-4 px-4 rounded-xl bg-surface-1 border border-border/60">
            {/* Step 1: Witness Origin */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-3 border border-gold/50 shadow-sm">
              <div className="h-10 w-10 rounded-full bg-gold text-on-gold flex items-center justify-center font-serif text-sm font-semibold shrink-0 relative">
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gold text-on-gold flex items-center justify-center">
                  <Eye className="h-2.5 w-2.5 stroke-[2.5]" />
                </div>
                MF
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-semibold text-xs text-text-primary">Martha Finch</span>
                  <span className="font-mono text-xs text-gold uppercase tracking-wider font-semibold">[Origin]</span>
                </div>
                <span className="text-xs text-text-tertiary block">Tavernkeeper</span>
                <span className="text-xs font-mono text-gold font-semibold">100% confidence</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5 px-1">
              <span className="font-mono text-xs text-text-tertiary tabular-nums">decay</span>
              <ArrowRight className="h-4 w-4 text-signal translate-x-px" />
            </div>

            {/* Step 2: Listener */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-3 border border-signal/50">
              <div className="h-10 w-10 rounded-full bg-surface-1 text-text-primary border border-border flex items-center justify-center font-serif text-sm font-semibold shrink-0">
                GV
              </div>
              <div>
                <span className="font-sans font-semibold text-xs text-text-primary block">Garrick Vance</span>
                <span className="text-xs text-text-tertiary block">Blacksmith</span>
                <span className="text-xs font-mono text-signal font-semibold">85% confidence</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border/40 text-xs font-mono text-text-tertiary">
            <span className="flex items-center gap-1 text-gold">
              <Shield className="h-3.5 w-3.5" />
              <span>Eyewitness Provenance Verified</span>
            </span>
            <span className="text-signal">Graph Path: Q12_explain_provenance</span>
          </div>
        </div>
      </section>

      {/* 05. Dialogue Bubbles */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary tracking-wider uppercase">
          <span className="text-signal font-semibold">05</span>
          <span>Interactive Dialogue Components</span>
        </div>

        <div className="rounded-xl bg-surface-1 p-6 border border-border space-y-4 max-w-xl">
          {/* Player message */}
          <div className="flex flex-col items-end">
            <div className="max-w-[85%] rounded-xl rounded-br-xs p-3 text-xs bg-surface-3 text-text-primary">
              What do you know about the stolen relic?
            </div>
            <span className="mt-1 px-1 text-xs font-mono text-text-tertiary">Player · 10:14 PM</span>
          </div>

          {/* NPC message with Why trigger */}
          <div className="flex flex-col items-start">
            <div className="max-w-[85%] rounded-xl rounded-bl-xs p-3 text-xs bg-surface-2 text-text-primary border-l-2 border-l-faction-townsfolk card-elevation">
              <p>Martha told me someone was spotted fleeing the vault with the relic. Keep your hands off my forge.</p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-3 text-xs font-mono text-gold border border-gold/40">
                <Eye className="h-3 w-3 text-gold" />
                <span>Why do you know this?</span>
                <Sparkles className="h-2.5 w-2.5 text-signal" />
              </div>
            </div>
            <span className="mt-1 px-1 text-xs font-mono text-text-tertiary">Garrick Vance · Graph-grounded</span>
          </div>
        </div>
      </section>

      {/* 06. Code Card Specimen (DESIGN.md §7) */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs text-text-tertiary tracking-wider uppercase">
          <span className="text-signal font-semibold">06</span>
          <span>Developer Code Card (Obsidian &amp; Signal)</span>
        </div>

        <div className="rounded-2xl bg-surface-1 border border-border p-2 card-elevation max-w-xl">
          <div className="h-10 px-4 bg-surface-2 rounded-t-xl border-b border-border flex items-center justify-between text-xs font-mono text-text-tertiary">
            <div className="flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-signal" />
              <span className="text-text-secondary font-medium">hearsay-specimen.ts</span>
            </div>
            <span className="text-xs">TypeScript</span>
          </div>
          <div className="p-4 font-mono text-xs leading-relaxed text-text-primary">
            <div className="text-text-tertiary">// Query Q12: Explain Provenance Chain</div>
            <div>
              <span className="text-signal">const</span> provenance = <span className="text-signal">await</span> hearsay.<span className="text-text-primary">explain</span>(<span className="text-gold">&quot;evt_well_poisoned&quot;</span>);
            </div>
            <div className="text-text-tertiary mt-2">// Evaluates trust decay: c = 0.90 × 0.85</div>
            <div>
              console.log(provenance.confidence); <span className="text-text-tertiary">// 0.765</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
