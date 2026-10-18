import type { Metadata } from "next";
import Link from "next/link";
import { GameplayImage } from "../../components/GameplayImage";
import { CodeCard, type CodeLine } from "../../components/CodeCard";
import {
  Sparkles,
  Play,
  ArrowRight,
  ShieldCheck,
  Share2,
  HelpCircle,
  Compass,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hearsay — Persistent NPC memory with provenance",
  description:
    "A FalkorDB-backed memory layer where NPCs only know what they saw or heard, rumors decay along trust edges, and every answer can be traced.",
};

// Illustrative: final names follow the tool contract (docs/shared/04-tool-contract.md).
const INTEGRATION_SNIPPET: CodeLine[] = [
  [["// 1. One isolated graph per player", "cmt"]],
  [["const ", "kw"], ["hearsay = ", "text"], ["await ", "kw"], ["openWorld({ player: ", "text"], ['"042"', "str"], [" });", "text"]],
  [],
  [["// 2. The player does something in front of a witness", "cmt"]],
  [["await ", "kw"], ["hearsay.recordAction({ witness: ", "text"], ['"brom"', "str"], [", kind: ", "text"], ['"help"', "str"], [" });", "text"]],
  [],
  [["// 3. Time passes: rumors travel along TRUSTS edges", "cmt"]],
  [["await ", "kw"], ["hearsay.advanceTime();", "text"]],
  [],
  [["// 4. The NPC answers from what it knows, and can say why", "cmt"]],
  [["const ", "kw"], ["reply = ", "text"], ["await ", "kw"], ["hearsay.talk({ npc: ", "text"], ['"garrick"', "str"], [" });", "text"]],
  [["const ", "kw"], ["why = ", "text"], ["await ", "kw"], ["hearsay.explain(reply.id); ", "text"], ["// Brom → Mira → Garrick (0.63)", "cmt"]],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-signal/20 selection:text-text-primary">
      {/* Top Navigation */}
      <header className="h-16 border-b border-border bg-surface-1/80 backdrop-blur-md px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center p-0.5 relative">
            <div className="absolute inset-0 rounded-full chrome-ring opacity-80" />
            <div className="relative h-full w-full rounded-full bg-surface-1 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-signal" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-xl tracking-tight text-text-primary font-normal">
              Hearsay
            </span>
            <span className="text-xs font-mono text-text-tertiary px-2 py-0.5 rounded bg-surface-2 border border-border hidden sm:inline-block">
              FalkorDB Graph Hacks
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-3 md:gap-4">
          <Link
            href="/styleguide"
            className="text-xs font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <Compass className="h-3.5 w-3.5 text-signal" />
            <span className="hidden sm:inline">Design System</span>
          </Link>

          <Link
            href="/"
            className="h-9 px-4 rounded-md bg-primary text-on-primary text-xs font-medium hover:bg-primary-hover active:scale-96 transition-colors duration-120 flex items-center gap-2 shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Launch Simulation</span>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-28 px-6 md:px-12 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Hackathon Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-2 border border-border mb-8 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-signal animate-pulse" />
          <span className="text-xs font-mono tracking-wider text-text-secondary uppercase">
            Track 02: Agent Memory &amp; Coordination
          </span>
        </div>

        {/* Display Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl leading-tight font-normal text-text-primary max-w-4xl tracking-tight">
          Persistent NPC memory with <span className="italic text-signal">provenance</span>.
        </h1>

        {/* Subline */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed">
          An explainable, graph-native memory layer for game agents. Villagers witness your actions and
          spread rumors through trust networks. FalkorDB records their memories and the paths
          that explain how each story travelled.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="h-11 px-6 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-96 transition-colors duration-120 flex items-center gap-2.5 shadow-md"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Open Hollowbrook Town</span>
          </Link>

          <a
            href="#architecture"
            className="h-11 px-5 rounded-md bg-surface-2 hover:bg-surface-3 text-text-primary text-sm font-medium border border-border active:scale-96 transition-colors duration-120 flex items-center gap-2"
          >
            <span>Explore Architecture</span>
            <ArrowRight className="h-4 w-4 text-signal" />
          </a>
        </div>

        {/* Facts that hold by construction (AGENTS.md hard rules), not benchmarks */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          <div className="p-4 rounded-xl bg-surface-1 border border-border/80 flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-text-primary tabular-nums">13</span>
            <span className="text-xs text-text-tertiary mt-1">NPCs in Hollowbrook</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border/80 flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-signal tabular-nums">0</span>
            <span className="text-xs text-text-tertiary mt-1">Cypher written by the LLM</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border/80 flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-gold tabular-nums">1</span>
            <span className="text-xs text-text-tertiary mt-1">LLM job: dialogue</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border/80 flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-success">Library + MCP</span>
            <span className="text-xs text-text-tertiary mt-1">Same tool contract</span>
          </div>
        </div>

        <div className="mt-16 w-full max-w-5xl text-text-secondary">
          <GameplayImage kind="conversation" priority />
        </div>
      </section>
      <section aria-labelledby="how-to-play" className="px-6 md:px-12 pb-20 max-w-6xl mx-auto">
        <h2 id="how-to-play" className="font-serif text-3xl sm:text-5xl text-center">A town that remembers your choices</h2>
        <p className="mt-4 mb-10 text-center text-text-secondary max-w-2xl mx-auto">Solve a mission before its deadline. Spend two action points per turn, follow villagers' clues, and account for what the town hears about you.</p>
        <div className="grid gap-8 md:grid-cols-2">
          <div><h3 className="font-serif text-2xl mb-3">1. Choose your next chapter</h3><GameplayImage kind="campaign" /></div>
          <div><h3 className="font-serif text-2xl mb-3">2. Talk, investigate, decide</h3><GameplayImage kind="medicine" /></div>
          <div><h3 className="font-serif text-2xl mb-3">3. Let the town talk</h3><GameplayImage kind="gossip" /></div>
          <div><h3 className="font-serif text-2xl mb-3">4. Discover how the story spread</h3><GameplayImage kind="graph" /></div>
        </div>
      </section>

      {/* Section 01: Core Pillars (Numbered 01 / 02 / 03 Explainer Cards) */}
      <section id="architecture" className="py-24 px-6 md:px-12 border-t border-border bg-surface-1">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-xs font-mono tracking-widest text-text-tertiary uppercase mb-3">
              01 · CORE ARCHITECTURE
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-text-primary tracking-tight">
              The three pillars of <span className="italic text-signal">explainable</span> agency.
            </h2>
            <p className="mt-4 text-base text-text-secondary max-w-xl">
              Eliminating the twin pitfalls of game AI: collective amnesia and omniscient telepathy.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 01 */}
            <div className="p-8 rounded-2xl bg-surface-2 border border-border flex flex-col justify-between card-elevation">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs text-text-tertiary">01 / SECURITY</span>
                  <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center text-signal">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-serif text-2xl font-normal text-text-primary mb-3">
                  The Knowledge Firewall
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  The LLM never writes Cypher and never receives raw game world state. Before an NPC speaks,
                  parameterised, read-only graph queries return only the facts inside that NPC&apos;s own knowledge horizon.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-text-tertiary">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span>Zero Context Contamination</span>
              </div>
            </div>

            {/* Card 02 */}
            <div className="p-8 rounded-2xl bg-surface-2 border border-border flex flex-col justify-between card-elevation">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs text-text-tertiary">02 / PROPAGATION</span>
                  <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center text-signal">
                    <Share2 className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-serif text-2xl font-normal text-text-primary mb-3">
                  Social Trust &amp; Gossip Decay
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Information is not instant. When ticks advance, candidate rumors diffuse along <code className="text-signal font-mono text-xs">TRUSTS</code> edges. Each hop decays credibility based on interpersonal trust:
                  <span className="block mt-2 font-mono text-xs text-text-primary bg-surface-3 p-2 rounded">
                    c_hop = c_prev × w_trust
                  </span>
                  Anything that fades below 0.25 stops spreading.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-text-tertiary">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span>Dynamic Attitudinal Drift</span>
              </div>
            </div>

            {/* Card 03 */}
            <div className="p-8 rounded-2xl bg-surface-2 border border-border flex flex-col justify-between card-elevation">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs text-text-tertiary">03 / AUDITABILITY</span>
                  <div className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center text-gold">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-serif text-2xl font-normal text-text-primary mb-3">
                  Provenance (&ldquo;Why?&rdquo;)
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Every statement an NPC makes can be traced in FalkorDB. Players or game masters can click &ldquo;Why?&rdquo; to follow the exact graph path from the original eyewitness to the speaker, with the confidence at each hop.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-gold">
                <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
                <span>Full Graph Explainability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 02: Developer Integration (10-Line Code Card) */}
      <section className="py-24 px-6 md:px-12 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-mono tracking-widest text-text-tertiary uppercase mb-3 block">
              02 · DEVELOPER EXPERIENCE
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-text-primary tracking-tight">
              Drop into your game engine or <span className="italic text-signal">agentic</span> stack.
            </h2>
            <p className="mt-5 text-base text-text-secondary leading-relaxed">
              Hearsay ships as a TypeScript library (<code className="text-signal font-mono text-xs">packages/hearsay</code>) and a Model Context Protocol server (<code className="text-signal font-mono text-xs">packages/mcp</code>) exposing the same tools. Connect it to a game engine or to LLM agent frameworks.
            </p>

            <ul className="mt-8 space-y-3 font-sans text-sm text-text-secondary">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-signal shrink-0 mt-0.5" />
                <span><strong className="text-text-primary">FalkorDB Graph per Player:</strong> Each player gets their own copy of the world template (<code className="font-mono text-xs text-text-tertiary">player:{"{id}"}</code>), so no two worlds share state.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-signal shrink-0 mt-0.5" />
                <span><strong className="text-text-primary">Strict Parameterized Cypher:</strong> Pre-compiled, hardened queries running on official Node FalkorDB client.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-signal shrink-0 mt-0.5" />
                <span><strong className="text-text-primary">Deterministic Tick Engine:</strong> Advance world simulation programmatically on player movements or quest triggers.</span>
              </li>
            </ul>

            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/"
                className="h-10 px-4 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-96 transition-colors duration-120 flex items-center gap-2"
              >
                <span>Launch Demo Town</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* 10-line Integration Code Card */}
          <CodeCard filename="game-server.ts" language="TypeScript · illustrative API" lines={INTEGRATION_SNIPPET} />
        </div>
      </section>

      {/* Section 03: The Argument (Control vs Hearsay) */}
      <section className="py-24 px-6 md:px-12 border-t border-border bg-surface-1">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-xs font-mono tracking-widest text-text-tertiary uppercase mb-3">
              03 · THE CONTRAST
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-text-primary tracking-tight">
              Control vs Hearsay: <span className="italic text-signal">The Argument</span>.
            </h2>
            <p className="mt-4 text-base text-text-secondary max-w-xl">
              Why unstructured LLM memory and vector databases break immersion in interactive game worlds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control Column */}
            <div className="p-8 rounded-2xl bg-surface-2 border border-border flex flex-col justify-between opacity-85">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-danger uppercase tracking-wider font-semibold">
                    Control (Plain LLM / RAG)
                  </span>
                  <span className="text-xs font-mono text-text-tertiary">Naive Approach</span>
                </div>
                <h3 className="font-serif text-xl font-normal text-text-primary mb-3">
                  Omniscient Telepathy &amp; Amnesia
                </h3>
                <ul className="space-y-3 text-xs text-text-secondary leading-relaxed font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-danger">✕</span>
                    <span><strong>Instant Universal Awareness:</strong> When the player commits a crime in a secluded alley, guards across town immediately arrest them.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger">✕</span>
                    <span><strong>No Source Attribution:</strong> NPCs cannot tell you who told them or why they believe it.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger">✕</span>
                    <span><strong>Static Attitude Drift:</strong> Relationships don&apos;t decay or evolve naturally along social hierarchies.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-text-tertiary">
                Unexplainable • High Hallucination Risk
              </div>
            </div>

            {/* Hearsay Column */}
            <div className="p-8 rounded-2xl bg-surface-2 border border-signal/40 signal-glow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-signal uppercase tracking-wider font-semibold">
                    Hearsay (Graph-Native)
                  </span>
                  <span className="text-xs font-mono text-gold font-semibold">FalkorDB Powered</span>
                </div>
                <h3 className="font-serif text-xl font-normal text-text-primary mb-3">
                  Strict Firewall &amp; Grounded Provenance
                </h3>
                <ul className="space-y-3 text-xs text-text-secondary leading-relaxed font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-success">✓</span>
                    <span><strong>Physical Witness Boundaries:</strong> Only NPCs present at the location can witness an event.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">✓</span>
                    <span><strong>Mathematical Gossip Decay:</strong> Credibility attenuates with social distance and interpersonal trust.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-success">✓</span>
                    <span><strong>Verifiable Provenance:</strong> Every claim is backed by an auditable path through the graph.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-gold flex items-center justify-between">
                <span>100% Explainable Provenance</span>
                <span className="text-success">Auditable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 px-6 md:px-12 border-t border-border bg-background">
        <div className="max-w-4xl mx-auto rounded-3xl bg-surface-2 border border-border p-10 md:p-16 text-center card-elevation relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-signal to-transparent opacity-60" />
          
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-text-primary tracking-tight">
            Step into <span className="italic text-signal">Hollowbrook</span>.
          </h2>
          <p className="mt-4 text-base text-text-secondary max-w-xl mx-auto">
            Interact with the live 13-villager town, commit deeds, advance simulation ticks, and audit the Why? provenance card in real-time.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="h-11 px-6 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-96 transition-colors duration-120 flex items-center gap-2.5 shadow-md"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Launch Town Simulation</span>
            </Link>

            <Link
              href="/styleguide"
              className="h-11 px-5 rounded-md bg-surface-3 hover:bg-surface-2 text-text-primary text-sm font-medium border border-border active:scale-96 transition-colors duration-120 flex items-center gap-2"
            >
              <Compass className="h-4 w-4 text-signal" />
              <span>Inspect Styleguide</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-border bg-surface-1 text-xs font-mono text-text-tertiary">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm text-text-primary font-normal">Hearsay</span>
            <span>—</span>
            <span>Built on FalkorDB for Graph Hacks 2026</span>
          </div>

          <div className="flex items-center gap-6 text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">
              Hollowbrook Simulator
            </Link>
            <Link href="/styleguide" className="hover:text-text-primary transition-colors">
              Styleguide
            </Link>
            <span className="text-text-tertiary">Track 02: Agent Memory &amp; Coordination</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
