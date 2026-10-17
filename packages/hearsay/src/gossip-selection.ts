import { z } from "zod";
import { EventId, NpcId, Unit } from "@hearsay/contract";

export const GossipCandidate = z.object({
  eventId: EventId,
  teller: NpcId,
  listener: NpcId,
  cred: Unit,
  root: NpcId,
  hop: z.number().int().min(0),
});
export type GossipCandidate = z.infer<typeof GossipCandidate>;

// ASCII slug ordering is deterministic across server locales.
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function selectGossip(
  candidates: readonly GossipCandidate[],
): GossipCandidate[] {
  const picks = new Map<string, GossipCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.eventId}:${candidate.listener}`;
    const current = picks.get(key);
    if (
      !current ||
      candidate.cred > current.cred ||
      (candidate.cred === current.cred &&
        compare(candidate.teller, current.teller) < 0)
    ) {
      picks.set(key, candidate);
    }
  }
  return [...picks.values()].sort(
    (a, b) => compare(a.eventId, b.eventId) || compare(a.listener, b.listener),
  );
}
