import Link from "next/link";
import { Sparkles, Compass, Shield, ArrowRight, Activity, GitFork } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-16">
      {/* Top Bar */}
      <header className="w-full max-w-6xl flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center p-0.5 relative">
            <div className="absolute inset-0 rounded-full chrome-ring opacity-80" />
            <div className="relative h-full w-full rounded-full bg-surface-1 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-signal" />
            </div>
          </div>
          <div>
            <span className="font-serif text-xl tracking-tight text-text-primary">Hearsay</span>
            <span className="ml-2 font-mono text-xs text-text-tertiary">v0.1.0</span>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <Link
            href="/styleguide"
            className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors duration-120"
          >
            <Compass className="h-3.5 w-3.5 text-signal" />
            <span>Design Styleguide</span>
          </Link>
          <div className="flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-mono text-text-tertiary">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span>mock-mode</span>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-4xl text-center my-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1 text-xs font-mono text-text-secondary border border-border mb-6">
          <span className="text-signal">Track 02</span>
          <span className="text-text-tertiary">·</span>
          <span>Agent Memory and Coordination</span>
        </div>

        <h1 className="font-serif text-5xl md:text-6xl text-text-primary tracking-tight leading-tight max-w-3xl">
          Persistent, explainable NPC memory on <em className="italic text-signal font-serif">FalkorDB</em>.
        </h1>

        <p className="mt-6 text-lg text-text-secondary max-w-2xl leading-relaxed">
          NPCs witness events, spread gossip along social trust graphs with hop-decay, and reply in dialogue
          using only facts they actually know. Every answer traces its origin.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/styleguide"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-on-primary hover:bg-primary-hover active:scale-96 transition-all duration-120"
          >
            <span>Explore Styleguide</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-surface-3 px-5 text-sm font-medium text-text-primary border border-border">
            <Activity className="h-4 w-4 text-gold" />
            <span className="font-mono tabular-nums">0 ms</span>
            <span className="text-text-tertiary text-xs">latency</span>
          </div>
        </div>

        {/* Feature Cards Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="rounded-xl bg-surface-2 p-5 card-elevation border border-border">
            <div className="h-8 w-8 rounded-lg bg-surface-3 flex items-center justify-center mb-3">
              <Shield className="h-4 w-4 text-signal" />
            </div>
            <h2 className="font-sans font-semibold text-text-primary text-base">Knowledge Firewall</h2>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              NPCs never hallucinate knowledge. Dialogues only include facts verified through graph queries.
            </p>
          </div>

          <div className="rounded-xl bg-surface-2 p-5 card-elevation border border-border">
            <div className="h-8 w-8 rounded-lg bg-surface-3 flex items-center justify-center mb-3">
              <GitFork className="h-4 w-4 text-gold" />
            </div>
            <h2 className="font-sans font-semibold text-text-primary text-base">Gossip Propagation</h2>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Rumors travel along TRUSTS edges with hop decay. Credibility drops per hop naturally.
            </p>
          </div>

          <div className="rounded-xl bg-surface-2 p-5 card-elevation border border-border">
            <div className="h-8 w-8 rounded-lg bg-surface-3 flex items-center justify-center mb-3">
              <Sparkles className="h-4 w-4 text-agent-npc" />
            </div>
            <h2 className="font-sans font-semibold text-text-primary text-base">The &quot;Why?&quot; Card</h2>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Click any statement to see the full path through the social graph to the original eyewitness.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl flex items-center justify-between border-t border-border pt-4 text-xs font-mono text-text-tertiary">
        <div>Hearsay Engine · Graph Hacks 2026</div>
        <div>DuroT (Frontend) · Ayosensei (Core)</div>
      </footer>
    </main>
  );
}
