import { createHash } from "node:crypto";
import { z } from "zod";
import { EventId } from "@hearsay/contract";

export const GeneratedReply = z.object({
  reply: z
    .string()
    .trim()
    .min(1)
    .max(800)
    .refine((s) => s.split(/\s+/u).length <= 50),
  referencedEventIds: z.array(EventId).max(100),
});
export type GeneratedReply = z.infer<typeof GeneratedReply>;
export interface LlmInput {
  system: string;
  messages: { role: "user" | "model"; text: string }[];
}
export type LlmResult =
  | { ok: true; data: GeneratedReply; cached: boolean }
  | {
      ok: false;
      error: { code: "LLM_UNAVAILABLE"; message: string; reason: string };
    };
export interface Llm {
  generate(input: LlmInput): Promise<LlmResult>;
}
export interface LlmOptions {
  apiKey?: string;
  model?: string;
  mode?: "live" | "off";
  timeoutMs?: number;
  transport?: typeof fetch;
  now?: () => number;
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
}
const failure = (reason: string): LlmResult => ({
  ok: false,
  error: {
    code: "LLM_UNAVAILABLE",
    message: "Dialogue generation is unavailable.",
    reason,
  },
});
const WireReply = z.object({
  candidates: z
    .array(
      z.object({
        finishReason: z.string().optional(),
        content: z.object({
          parts: z.array(
            z.object({
              text: z.string().optional(),
              thought: z.boolean().optional(),
            }),
          ),
        }),
      }),
    )
    .min(1),
});

export function createLlm(options: LlmOptions = {}): Llm {
  const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
  const model = (options.model ?? process.env.GEMINI_MODEL ?? "").replace(
    /^models\//,
    "",
  );
  const now = options.now ?? Date.now;
  const cache = new Map<string, { expires: number; data: GeneratedReply }>();
  const transport = options.transport ?? fetch;
  return {
    async generate(input) {
      if (process.env.HEARSAY_LLM === "off" || options.mode === "off")
        return failure("disabled");
      if (!apiKey || !/^[a-zA-Z0-9._-]+$/.test(model))
        return failure("configuration");
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const key = createHash("sha256")
          .update(JSON.stringify([model, input]))
          .digest("hex");
        const hit = cache.get(key);
        if (hit && hit.expires > now())
          return { ok: true, data: structuredClone(hit.data), cached: true };
        cache.delete(key);
        const deadline = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("timeout"));
          }, options.timeoutMs ?? 8000);
        });
        // One shared deadline covers requests, response parsing and retry backoff.
        const bounded = <T>(work: Promise<T>) => Promise.race([work, deadline]);
        let serverRetries = 0,
          rateRetries = 0;
        while (true) {
          const response = await bounded(
            transport(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
              {
                method: "POST",
                signal: controller.signal,
                headers: {
                  "content-type": "application/json",
                  "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: input.system }] },
                  contents: input.messages.map((m) => ({
                    role: m.role,
                    parts: [{ text: m.text }],
                  })),
                  generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 2048,
                    responseMimeType: "application/json",
                    responseJsonSchema: {
                      type: "object",
                      properties: {
                        reply: { type: "string" },
                        referencedEventIds: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["reply", "referencedEventIds"],
                    },
                  },
                }),
              },
            ),
          );
          if (!response.ok) {
            await response.body?.cancel();
            if (
              response.status >= 500 &&
              response.status < 600 &&
              serverRetries++ < 1
            )
              continue;
            if (response.status === 429 && rateRetries < 2) {
              const delay =
                500 * 2 ** rateRetries++ +
                Math.floor((options.random ?? Math.random)() * 250);
              await bounded(
                (
                  options.sleep ??
                  ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
                )(delay),
              );
              continue;
            }
            return failure(`http_${response.status}`);
          }
          const wire = WireReply.parse(await bounded(response.json()));
          const candidate = wire.candidates[0];
          if (
            !candidate ||
            (candidate.finishReason && candidate.finishReason !== "STOP")
          )
            return failure("blocked_or_incomplete");
          const json = candidate.content.parts
            .filter((p) => !p.thought)
            .map((p) => p.text ?? "")
            .join("");
          const data = GeneratedReply.parse(JSON.parse(json));
          for (const [id, value] of cache)
            if (value.expires <= now()) cache.delete(id);
          if (cache.size >= 256) {
            const oldest = cache.keys().next().value;
            if (oldest) cache.delete(oldest);
          }
          cache.set(key, {
            expires: now() + 60_000,
            data: structuredClone(data),
          });
          return { ok: true, data, cached: false };
        }
      } catch {
        return failure(
          controller.signal.aborted ? "timeout" : "invalid_response_or_network",
        );
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
  };
}
