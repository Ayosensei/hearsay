import { performance } from "node:perf_hooks";
import { GeneratedReply } from "./llm";
import type { Llm, LlmInput } from "./llm";
import { checkFirewall } from "./firewall";
import type { UnknownEvent } from "./firewall";
import type { WorldScope } from "./world-operation";

export async function chooseDialogueReply(
  scope: WorldScope,
  llm: Llm,
  prompt: LlmInput,
  known: string[],
  unknown: UnknownEvent[],
  templates: string[],
  provider: string,
) {
  const rejected = new Set<string>();
  if (process.env.HEARSAY_LLM !== "off") {
    for (let attempt = 0; attempt < 2; attempt++) {
      const started = performance.now();
      let candidate;
      try {
        const result = await llm.generate(
          attempt
            ? {
                ...prompt,
                system: `${prompt.system}\nYour last reply mentioned something you do not know. Do not mention it.`,
              }
            : prompt,
        );
        if (result.ok) candidate = GeneratedReply.parse(result.data);
      } catch {
        /* A provider failure must still allow a safe template reply. */
      }
      scope.record([
        {
          agent: "npc",
          tool: "say.generate",
          args: { provider, attempt: attempt + 1 },
          rows: candidate ? 1 : 0,
          ms: performance.now() - started,
        },
      ]);
      if (!candidate) break;
      const checkStarted = performance.now();
      const firewall = checkFirewall(
        candidate.reply,
        candidate.referencedEventIds,
        known,
        unknown,
      );
      scope.record([
        {
          agent: "npc",
          tool: "say.firewall",
          args: { attempt: attempt + 1 },
          rows: firewall.violations.length,
          ms: performance.now() - checkStarted,
        },
      ]);
      if (firewall.passed)
        return { reply: candidate.reply, source: "llm" as const, firewall };
      for (const violation of firewall.violations) rejected.add(violation);
    }
  }
  for (const reply of templates) {
    const check = checkFirewall(reply, [], known, unknown);
    if (check.passed)
      return {
        reply,
        source: "template_fallback" as const,
        firewall: { passed: rejected.size === 0, violations: [...rejected] },
      };
    for (const violation of check.violations) rejected.add(violation);
  }
  // User-controlled subjects can overlap every seed line. A wordless abstention cannot confirm them.
  return {
    reply: "…",
    source: "template_fallback" as const,
    firewall: { passed: false, violations: [...rejected] },
  };
}
