import { NPC, RumorKnowledge, TownEvent } from "./types";

/**
 * Mock stand-in for "LLM answers from the NPC's prompt only". The real engine
 * asks the knowledge-firewall query which facts this NPC may use; here we do the
 * same filtering by hand so the UI shows real firewall behaviour.
 */

/** Words that say nothing about *which* event the player means. */
const STOP_WORDS = new Set([
  "what", "that", "this", "with", "have", "from", "about", "your", "know", "tell", "told",
  "heard", "happened", "there", "where", "when", "does", "were", "they", "them", "would",
  "could", "should", "into", "been", "some", "anything", "something", "which", "their",
  "just", "like", "town", "please", "stranger", "player", "performed", "deed", "helpful",
  "harmful", "hello", "news", "rumor", "rumour",
]);

/** 4-letter stems so "herb" matches "herbs" and "poison" matches "poisoned". */
function stems(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  return new Set(words.filter((w) => !STOP_WORDS.has(w)).map((w) => w.slice(0, 4)));
}

/** Events the player's message seems to be asking about (title + description overlap). */
export function eventsMentioned(message: string, events: TownEvent[]): TownEvent[] {
  const asked = stems(message);
  if (asked.size === 0) return [];
  return events.filter((event) => {
    const known = stems(`${event.title} ${event.description}`);
    return [...asked].some((stem) => known.has(stem));
  });
}

export function replyForRumor(rumor: RumorKnowledge): string {
  if (rumor.hops === 0) {
    return rumor.eventType === "help"
      ? `I saw your kindness with my own eyes: "${rumor.eventTitle}". You have my gratitude and respect.`
      : `I saw it myself: "${rumor.eventTitle}". Don't try to deny it to my face.`;
  }
  const doubt = rumor.confidence < 0.7 ? " Honestly, I'd take it with a grain of salt." : "";
  return `${rumor.heardFromName ?? "Someone"} told me about "${rumor.eventTitle}". I wasn't there in person.${doubt}`;
}

export interface Answer {
  text: string;
  /** The fact the answer rests on. Undefined when the NPC knows nothing relevant. */
  rumor?: RumorKnowledge;
  /** Event ids the question matched, for the trace panel. */
  topics: string[];
}

/** Pick the one thing this NPC is allowed to say about the question. */
export function answerFor(npc: NPC, message: string, events: TownEvent[]): Answer {
  const asked = eventsMentioned(message, events);
  const topics = asked.map((e) => e.id);

  if (asked.length > 0) {
    const known = asked.map((e) => npc.rumors.find((r) => r.eventId === e.id)).find(Boolean);
    if (known) return { text: replyForRumor(known), rumor: known, topics };
    // Firewall: the player asked about something this NPC never witnessed or heard.
    return {
      text: "I don't know anything about that. Nobody has told me, and I wasn't there.",
      topics,
    };
  }

  const headline = npc.primaryRumor;
  if (!headline) {
    return {
      text: "I have no quarrel with you, stranger, but I haven't heard any town talk regarding your deeds.",
      topics,
    };
  }
  return { text: replyForRumor(headline), rumor: headline, topics };
}
