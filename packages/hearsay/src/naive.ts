import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { z } from "zod";
import { TOOLS, EventId, EventType, Tick } from "@hearsay/contract";
import type { ToolInput } from "@hearsay/contract";
import type { Database } from "./db";
import {
  executeMemoryTool,
  resolvePlayer,
  resolveNpcs,
} from "./memory-context";
import { createLlm, GeneratedReply } from "./llm";
import type { DialogueOptions } from "./dialogue";
import { DialogueProfile } from "./dialogue-prompt";
import { loadSeed } from "./seed-schema";
import { scanUnknownVocabulary } from "./firewall";
import { Q50_recall } from "./queries/memory";
import { Q93_dialogue_profile, Q99_dialogue_unknown } from "./queries/dialogue";
import { Q98_player_events_all } from "./queries/naive";

const Event = z.object({
  eventId: EventId,
  type: EventType,
  subject: z.string().nullable(),
  place: z.string().nullable(),
  tick: Tick,
});
const Unknown = z.object({
  eventId: EventId,
  type: EventType,
  subject: z.string().nullable(),
  keywords: z.array(z.string()).nullable(),
});
// Deliberately unrestricted demo baseline; never persist its reply as NPC memory.
export function createNaive(db: Database, options: DialogueOptions = {}) {
  const llm = options.llm ?? createLlm();
  let seed: ReturnType<typeof loadSeed> | undefined;
  const sayNaive = (input: ToolInput<"sayNaive">) =>
    executeMemoryTool(
      db,
      "sayNaive",
      TOOLS.sayNaive,
      input,
      async (scope, args) => {
        const { graph } = await resolvePlayer(db, scope, args.playerId);
        await resolveNpcs(scope, graph, [args.npcId]);
        const params = { pid: args.playerId, nid: args.npcId };
        const profile = DialogueProfile.parse(
          (
            await scope.ro(
              graph,
              "Q93_dialogue_profile",
              Q93_dialogue_profile,
              params,
            )
          )[0],
        );
        const events = Event.array().parse(
          await scope.ro(
            graph,
            "Q98_player_events_all",
            Q98_player_events_all,
            params,
          ),
        );
        const known = new Set(
          z
            .array(EventId)
            .parse(
              (
                await scope.ro(graph, "Q50_recall", Q50_recall, {
                  ...params,
                  limit: Number.MAX_SAFE_INTEGER,
                })
              ).map((e) => e.eventId),
            ),
        );
        const unknown = Unknown.array()
          .parse(
            await scope.ro(
              graph,
              "Q99_dialogue_unknown",
              Q99_dialogue_unknown,
              params,
            ),
          )
          .filter((e) => !known.has(e.eventId))
          .map((e) => ({
            ...e,
            subject: e.subject ?? "",
            keywords: e.keywords ?? [],
          }));
        let reply: string | undefined;
        let source: "llm" | "template_fallback" = "template_fallback";
        if (process.env.HEARSAY_LLM !== "off") {
          const started = performance.now();
          try {
            const generated = await llm.generate({
              format: "text",
              system: [
                `You are ${profile.name}, ${profile.role} of Hollowbrook. ${profile.persona}`,
                "Here is everything that has happened in town involving the traveller:",
                ...events.map(
                  (e) =>
                    `- [${e.eventId}] The traveller ${e.type === "lied" ? "lied about" : e.type} ${e.subject || "something"} at ${e.place || "an unspecified location"} (tick ${e.tick}).`,
                ),
                "Reply in character in at most 50 words.",
              ].join("\n"),
              messages: [{ role: "user", text: args.text }],
            });
            if (generated.ok) {
              reply = GeneratedReply.parse(generated.data).reply;
              source = "llm";
            }
          } catch {
            /* Provider failures use the configured seed baseline. */
          }
          scope.record([
            {
              agent: "npc",
              tool: "sayNaive.generate",
              args: {
                provider: options.llm ? "injected" : "gemini",
                attempt: 1,
              },
              rows: reply ? 1 : 0,
              ms: performance.now() - started,
            },
          ]);
        }
        if (reply === undefined) {
          const templates = (await (seed ??= loadSeed(options.seedPath)))
            .templates;
          // Older valid seeds may omit the optional naive list.
          const lines =
            templates.byNpc?.[args.npcId]?.naive ??
            templates.naive ??
            templates.greeting.neutral;
          const index =
            createHash("sha256")
              .update(JSON.stringify([args.playerId, args.npcId, args.text]))
              .digest()
              .readUInt32BE(0) % lines.length;
          reply = lines[index] ?? "Hello, traveller.";
        }
        const started = performance.now();
        const leakedEventTypes = [
          ...new Set(
            unknown
              .filter((e) => scanUnknownVocabulary(reply, [e]).length > 0)
              .map((e) => e.type),
          ),
        ];
        scope.record([
          {
            agent: "npc",
            tool: "sayNaive.measure",
            args: {},
            rows: leakedEventTypes.length,
            ms: performance.now() - started,
          },
        ]);
        return {
          reply,
          source,
          leaked: leakedEventTypes.length > 0,
          leakedEventTypes,
        };
      },
    );
  return { sayNaive };
}
