import type { AttitudeLabel, ToolOutput } from "@hearsay/contract";

export interface OpinionEvent {
  eventId: string;
  type: ToolOutput<"attitude">["contributions"][number]["type"];
  weight: number;
  tick: number;
  confidence: number;
  learnedFrom: string;
}

export function attitudeLabel(score: number): AttitudeLabel {
  if (score <= -0.6) return "hostile";
  if (score <= -0.2) return "wary";
  if (score < 0.2) return "neutral";
  if (score < 0.6) return "friendly";
  return "devoted";
}

export function scoreAttitude(
  traits: { loyalty: number; greed: number },
  currentTick: number,
  events: readonly OpinionEvent[],
): ToolOutput<"attitude"> {
  const contributions = events.map((event) => {
    const recency = Math.max(0.3, 1 - 0.05 * (currentTick - event.tick));
    const traitFactor =
      event.weight < 0
        ? 0.7 + 0.6 * traits.loyalty
        : 0.7 + 0.6 * (1 - traits.greed);
    return {
      eventId: event.eventId,
      type: event.type,
      effect: event.weight * event.confidence * recency * traitFactor,
      confidence: event.confidence,
      learnedFrom: event.learnedFrom,
    };
  });
  const score = Math.max(
    -1,
    Math.min(
      1,
      contributions.reduce((sum, event) => sum + event.effect, 0),
    ),
  );
  return { score, label: attitudeLabel(score), contributions };
}
