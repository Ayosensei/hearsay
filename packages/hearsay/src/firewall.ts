export interface UnknownEvent {
  eventId: string;
  keywords: string[];
  subject: string;
}
export function checkFirewall(
  reply: string,
  referencedEventIds: readonly string[],
  knownEventIds: readonly string[],
  unknownEvents: readonly UnknownEvent[],
) {
  const known = new Set(knownEventIds.map((id) => id.toLowerCase()));
  const text = reply.normalize("NFKC").toLowerCase();
  const violations = new Set<string>();
  const references = [
    ...referencedEventIds,
    ...(text.match(/\bev_[a-z0-9_-]+\b/g) ?? []),
  ];
  for (const id of references)
    if (!known.has(id.toLowerCase()))
      violations.add(`referenced unknown event ${id}`);
  for (const violation of scanUnknownVocabulary(reply, unknownEvents))
    violations.add(violation);
  return { passed: violations.size === 0, violations: [...violations] };
}

// Shared measurement only: the naive control reports these matches without blocking.
export function scanUnknownVocabulary(
  reply: string,
  unknownEvents: readonly UnknownEvent[],
) {
  const text = reply.normalize("NFKC").toLowerCase();
  const words = new Set(text.match(/[\p{L}\p{N}_]+/gu) ?? []);
  const violations = new Set<string>();
  for (const event of unknownEvents) {
    const forbidden = [
      ...event.keywords,
      ...(event.subject.match(/[\p{L}\p{N}_]+/gu) ?? []),
    ];
    for (const word of forbidden) {
      const normalized = word.normalize("NFKC").toLowerCase();
      const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches =
        words.has(normalized) ||
        new RegExp(
          `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`,
          "u",
        ).test(text);
      if (matches)
        violations.add(
          `mentions ${normalized} of an event this NPC never learned`,
        );
    }
  }
  return [...violations];
}
