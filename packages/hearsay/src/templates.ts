import { createHash } from "node:crypto";
import type { AttitudeLabel } from "@hearsay/contract";
import type { Seed } from "./seed-schema";

export interface TemplateContext {
  npcId: string;
  conversationId: string;
  utteranceCount: number;
  label: AttitudeLabel;
  aware: boolean;
  text: string;
}
export function templateCandidates(
  templates: Seed["templates"],
  context: TemplateContext,
): string[] {
  const local = templates.byNpc?.[context.npcId];
  const kind = context.aware
    ? "aware"
    : /\?|\b(heard|know|remember)\b/i.test(context.text)
      ? "unknownTopic"
      : "greeting";
  const lines =
    kind === "unknownTopic"
      ? (local?.unknownTopic ?? templates.unknownTopic)
      : (local?.[kind] ?? templates[kind])[context.label];
  const hash = createHash("sha256")
    .update(
      JSON.stringify([
        context.npcId,
        context.conversationId,
        context.utteranceCount,
      ]),
    )
    .digest()
    .readUInt32BE(0);
  const offset = hash % lines.length;
  return [...lines.slice(offset), ...lines.slice(0, offset)];
}
