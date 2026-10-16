import Link from "next/link";
import {
  Sparkles,
  Play,
  ArrowRight,
  ShieldCheck,
  Share2,
  HelpCircle,
  Cpu,
  Terminal,
  Database,
  ExternalLink,
  Layers,
  Compass,
  CheckCircle2,
} from "lucide-react";

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
            className="h-9 px-4 rounded-md bg-primary text-on-primary text-xs font-medium hover:bg-primary-hover active:scale-96 transition-all duration-120 flex items-center gap-2 shadow-sm"
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
          An explainable, graph-native memory layer for game agents. NPCs witness events,
          propagate rumors across social trust networks with credibility decay, and ground
          every dialogue reply in verifiable FalkorDB Cypher paths.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="h-11 px-6 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-96 transition-all duration-120 flex items-center gap-2.5 shadow-md"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Open Hollowbrook Town</span>
          </Link>

          <a
            href="#architecture"
            className="h-11 px-5 rounded-md bg-surface-2 hover:bg-surface-3 text-text-primary text-sm font-medium border border-border active:scale-96 transition-all duration-120 flex items-center gap-2"
          >
            <span>Explore Architecture</span>
            <ArrowRight className="h-4 w-4 text-signal" />
          </a>
        </div>

        {/* Real-time Graph Metrics */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          <div className="p-4 rounded-xl bg-surface-1 border border-border/80 flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-text-primary tabular-nums">1.4ms</span>
            <span className="text-xs text-text-tertiary mt-1">Average Cypher Query</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border/80 flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-signal tabular-nums">100%</span>
            <span className="text-xs text-text-tertiary mt-1">Graph-Grounded Dialogue</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border/80 flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-gold tabular-nums">0%</span>
            <span className="text-xs text-text-tertiary mt-1">Knowledge Leakage</span>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border/80 flex flex-col items-center">
            <span className="font-mono text-2xl font-bold text-success tabular-nums">MCP Ready</span>
            <span className="text-xs text-text-tertiary mt-1">Standard Protocol</span>
          </div>
        </div>

        {/* Framed Product Preview Hero */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl p-2 bg-surface-2 border border-border signal-glow relative overflow-hidden text-left">
          {/* Header Bar of Preview */}
          <div className="h-10 px-4 bg-surface-1 rounded-t-xl border-b border-border flex items-center justify-between text-xs font-mono text-text-tertiary">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-gold/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
              <span className="ml-3 text-text-secondary">hearsay-inspector • Hollowbrook (5 NPCs)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-signal">FalkorDB Active</span>
              <span className="text-text-primary bg-surface-3 px-2 py-0.5 rounded tabular-nums">
                Tick: 0004
              </span>
            </div>
          </div>

          {/* Inner Simulated Viewport */}
          <div className="p-6 bg-surface-1/90 rounded-b-xl grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Column: NPC Trust Directory */}
            <div className="p-4 rounded-lg bg-surface-2 border border-border/60 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-mono text-text-tertiary">
                <span>NPC DIRECTORY</span>
                <span className="text-signal">5 Active</span>
              </div>
              <div className="p-2.5 rounded-md bg-surface-3 border border-signal/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-surface-2 flex items-center justify-center font-mono text-xs font-bold text-signal">
                    MV
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Martha Vane</div>
                    <div className="text-xs text-text-tertiary">Innkeeper</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-gold px-1.5 py-0.5 rounded bg-surface-2">
                  Eye-Witness
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-surface-2 border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-surface-3 flex items-center justify-center font-mono text-xs font-bold text-text-secondary">
                    GT
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Garrick Thorne</div>
                    <div className="text-xs text-text-tertiary">Blacksmith</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-signal px-1.5 py-0.5 rounded bg-surface-3">
                  Heard (1 hop)
                </span>
              </div>
              <div className="p-2.5 rounded-md bg-surface-2 border border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-surface-3 flex items-center justify-center font-mono text-xs font-bold text-text-secondary">
                    CV
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Captain Vane</div>
                    <div className="text-xs text-text-tertiary">Town Guard</div>
                  </div>
                </div>
                <span className="text-xs font-mono text-text-tertiary px-1.5 py-0.5 rounded bg-surface-3">
                  Heard (2 hops)
                </span>
              </div>
            </div>

            {/* Center Column: Why? Signature Provenance Teaser */}
            <div className="p-4 rounded-lg bg-surface-2 border border-border/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-gold mb-2">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>SIGNATURE: WHY? CARD</span>
                </div>
                <h3 className="font-serif text-lg text-text-primary">
                  How Garrick <span className="italic text-signal">learned</span> about it:
                </h3>
                <div className="mt-4 p-3 rounded-md bg-surface-3 border border-border flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gold font-bold">Martha</span>
                    <span className="text-text-tertiary">→</span>
                    <span className="text-signal font-bold">Garrick</span>
                  </div>
                  <span className="text-gold tabular-nums">Conf: 0.72</span>
                </div>
                <p className="mt-3 text-xs text-text-secondary leading-relaxed">
                  Decay applied across TRUSTS edge with 0.85 weight factor. Event: &ldquo;Gold Donated to Guild&rdquo;.
                </p>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-text-tertiary">
                <span>Decay: -28%</span>
                <span className="text-success">Verified Graph Path</span>
              </div>
            </div>

            {/* Right Column: Knowledge Firewall & Grounded Reply */}
            <div className="p-4 rounded-lg bg-surface-2 border border-border/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-signal mb-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>KNOWLEDGE FIREWALL</span>
                </div>
                <div className="p-2.5 rounded bg-surface-3 text-xs text-text-secondary leading-relaxed font-sans italic border-l-2 border-signal">
                  &ldquo;Martha told me you donated to the guild at the square. We are grateful, traveler.&rdquo;
                </div>
                <div className="mt-3 text-xs text-text-tertiary font-mono">
                  <span className="text-text-primary font-semibold">LLM Prompt:</span> Contains only Martha&apos;s rumor. Un-witnessed player deeds are strictly isolated.
                </div>
              </div>
              <div className="pt-3 border-t border-border">
                <Link
                  href="/"
                  className="w-full h-8 rounded bg-primary/20 hover:bg-primary/30 text-signal border border-signal/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Test in Live Simulator</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
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
                  parameterized Cypher queries (<code className="text-signal font-mono text-xs">Q10_read_opinion</code>, <code className="text-signal font-mono text-xs">Q30_dialogue_facts</code>) execute with read-only permissions, returning only facts within their personal knowledge horizon.
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
                    c_hop = c_prev × w_trust × 0.85
                  </span>
                  Enemies dismiss true deeds; friends amplify gossip.
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
                  Every statement uttered by an NPC has verifiable cryptographic-like provenance in FalkorDB. Players or game masters can click &ldquo;Why?&rdquo; to traverse the exact graph path from the initial eyewitness to the speaker, observing hop decay and edge weights.
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
              Hearsay ships as a lightweight TypeScript library (<code className="text-signal font-mono text-xs">@hearsay/core</code>) and a Model Context Protocol (<code className="text-signal font-mono text-xs">@hearsay/mcp</code>) server. Connect it to Unreal Engine, Unity, Godot, or LLM agent frameworks like Claude Desktop and Cursor.
            </p>

            <ul className="mt-8 space-y-3 font-sans text-sm text-text-secondary">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-signal shrink-0 mt-0.5" />
                <span><strong className="text-text-primary">FalkorDB Subgraph Isolation:</strong> Clones isolated graphs per player (<code className="font-mono text-xs text-text-tertiary">player:{"{id}"}</code>) with near-instant instantiation.</span>
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
                className="h-10 px-4 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-96 transition-all duration-120 flex items-center gap-2"
              >
                <span>Launch Demo Town</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* 10-line Integration Code Card */}
          <div className="rounded-2xl bg-surface-1 border border-border p-2 card-elevation overflow-hidden">
            <div className="h-10 px-4 bg-surface-2 rounded-t-xl border-b border-border flex items-center justify-between text-xs font-mono text-text-tertiary">
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-signal" />
                <span className="text-text-secondary font-medium">game-server.ts</span>
              </div>
              <span className="text-xs">TypeScript</span>
            </div>

            <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-text-primary">
              <div className="text-text-tertiary">// 1. Initialize per-player isolated FalkorDB world</div>
              <div>
                <span className="text-signal">import</span> &#123; Hearsay &#125; <span className="text-signal">from</span> <span className="text-gold">&quot;@hearsay/core&quot;</span>;
              </div>
              <div className="mt-1">
                <span className="text-signal">const</span> hearsay = <span className="text-signal">new</span> <span className="text-text-primary">Hearsay</span>(&#123; graph: <span className="text-gold">&quot;player:042&quot;</span> &#125;);
              </div>

              <div className="text-text-tertiary mt-3">// 2. Player performs an action in the world</div>
              <div>
                <span className="text-signal">await</span> hearsay.<span className="text-text-primary">recordAction</span>(&#123;
              </div>
              <div className="pl-4">
                actor: <span className="text-gold">&quot;player&quot;</span>, action: <span className="text-gold">&quot;donated_50_gold&quot;</span>,
              </div>
              <div className="pl-4">
                place: <span className="text-gold">&quot;blacksmith_forge&quot;</span>, witnesses: [<span className="text-gold">&quot;martha&quot;</span>]
              </div>
              <div>&#125;);</div>

              <div className="text-text-tertiary mt-3">// 3. Advance tick: rumors spread over trust network</div>
              <div>
                <span className="text-signal">const</span> gossip = <span className="text-signal">await</span> hearsay.<span className="text-text-primary">advanceTime</span>();
              </div>

              <div className="text-text-tertiary mt-3">// 4. Generate dialogue strictly from known facts</div>
              <div>
                <span className="text-signal">const</span> reply = <span className="text-signal">await</span> hearsay.<span className="text-text-primary">dialogue</span>(&#123; npcId: <span className="text-gold">&quot;garrick&quot;</span> &#125;);
              </div>

              <div className="text-text-tertiary mt-3">// 5. Inspect the mathematical provenance chain</div>
              <div>
                <span className="text-signal">const</span> why = <span className="text-signal">await</span> hearsay.<span className="text-text-primary">explain</span>(reply.provenanceId);
              </div>
              <div>
                console.log(why.path); <span className="text-text-tertiary">// Martha → Garrick (0.72)</span>
              </div>
            </div>
          </div>
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
                    <span><strong>Verifiable Provenance:</strong> Every single claim is backed by an auditable Cypher path in milliseconds.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-border text-xs font-mono text-gold flex items-center justify-between">
                <span>100% Explainable Provenance</span>
                <span className="text-success">Production Ready</span>
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
            Interact with the live 5-NPC graph, commit deeds, advance simulation ticks, and audit the Why? provenance card in real-time.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="h-11 px-6 rounded-md bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover active:scale-96 transition-all duration-120 flex items-center gap-2.5 shadow-md"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Launch Town Simulation</span>
            </Link>

            <Link
              href="/styleguide"
              className="h-11 px-5 rounded-md bg-surface-3 hover:bg-surface-2 text-text-primary text-sm font-medium border border-border active:scale-96 transition-all duration-120 flex items-center gap-2"
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
