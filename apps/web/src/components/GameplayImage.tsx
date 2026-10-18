import Image from "next/image";

export const gameplayImages = {
  campaign: { src: "campaign-map.png", alt: "Hearsay campaign map with Night Watch completed and the next mission unlocked", caption: "Follow the campaign map. Finish a mission to unlock the next chapter." },
  conversation: { src: "night-watch-chat.png", alt: "Silas discussing floodgate evidence at Riverside, with the mission clock and action points visible", caption: "Night Watch: talk to Silas at Riverside, compare clues, and choose your next move." },
  gossip: { src: "gossip.png", alt: "Glowing gossip trails crossing the town as new accounts spread between villagers", caption: "Glowing trails signal gossip spreading as turns advance. Exact memory routes stay hidden until the ending." },
  graph: { src: "memory-graph.png", alt: "The game's memory graph highlighting an accusation travelling from Lysa through Mira to Garrick", caption: "After a story ends, inspect the graph: who witnessed an event, who passed it on, and how certain they are." },
  medicine: { src: "medicine-chat.png", alt: "A conversation with Elin in Vale Lane during the Missing Medicine mission", caption: "Missing Medicine: villagers offer clues and competing choices through conversations in the town." },
};

export function GameplayImage({ kind, priority = false }: { kind: keyof typeof gameplayImages; priority?: boolean }) {
  const shot = gameplayImages[kind];
  return <figure className="overflow-hidden rounded-xl border border-current/20 text-left">
    <a href={`/gameplay/${shot.src}`} target="_blank" rel="noreferrer" className="block" aria-label={`${shot.alt}. Open full-size screenshot in a new tab`}>
      <Image src={`/gameplay/${shot.src}`} alt={shot.alt} width={1600} height={900} sizes="(max-width: 768px) 100vw, 1024px" priority={priority} className="block h-auto w-full" />
    </a>
    <figcaption className="px-4 py-3 text-sm leading-relaxed"><span className="font-semibold">Actual gameplay.</span> {shot.caption}</figcaption>
  </figure>;
}
