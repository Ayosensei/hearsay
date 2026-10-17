import { randomUUID } from "node:crypto";
import { z } from "zod";
import { TOOLS, EventId, Unit } from "@hearsay/contract";
import type { ToolInput } from "@hearsay/contract";
import type { Database } from "./db";
import { createWorld } from "./world";
import { WorldFailure } from "./world-operation";
import {
  executeMemoryTool,
  resolveNpcs,
  resolvePlayer,
} from "./memory-context";
import { createOpinion } from "./opinion-tools";
import { createLlm } from "./llm";
import type { Llm } from "./llm";
import { loadSeed } from "./seed-schema";
import { templateCandidates } from "./templates";
import {
  DialogueProfile,
  DialogueEvent,
  DialogueLine,
  buildDialoguePrompt,
} from "./dialogue-prompt";
import { chooseDialogueReply } from "./dialogue-reply";
import { Q50_recall } from "./queries/memory";
import * as q from "./queries/dialogue";

export interface DialogueOptions {
  llm?: Llm;
  seedPath?: string | URL;
}
const Unknown = z.object({
  eventId: EventId,
  subject: z.string().nullable(),
  keywords: z.array(z.string()).nullable(),
});
const Belief = z.object({ text: z.string(), confidence: Unit });
export function createDialogue(
  db: Database,
  world = createWorld(db),
  options: DialogueOptions = {},
) {
  const llm = options.llm ?? createLlm();
  const opinion = createOpinion(db, world);
  let seed: ReturnType<typeof loadSeed> | undefined;
  const pending = new Map<string, Promise<unknown>>();
  async function locked<T>(key: string, work: () => Promise<T>) {
    const next = (pending.get(key) ?? Promise.resolve()).then(work, work);
    pending.set(key, next);
    try {
      return await next;
    } finally {
      if (pending.get(key) === next) pending.delete(key);
    }
  }
  const say = (input: ToolInput<"say">) =>
    locked(`${input?.playerId}:${input?.npcId}`, () =>
      executeMemoryTool(db, "say", TOOLS.say, input, async (scope, args) => {
        const { graph, tick } = await resolvePlayer(db, scope, args.playerId);
        await resolveNpcs(scope, graph, [args.npcId]);
        let cid = args.conversationId;
        const params = { pid: args.playerId, nid: args.npcId };
        if (cid !== undefined) {
          const found = await scope.ro(
            graph,
            "Q23_resolve_conversation",
            q.Q23_resolve_conversation,
            { ...params, cid },
          );
          if (found.length !== 1)
            throw new WorldFailure({
              code: "BAD_ARGS",
              message: "Conversation does not belong to this player and NPC.",
            });
        }
        scope.take(await world.ensureWorld());
        const templates = (await (seed ??= loadSeed(options.seedPath)))
          .templates;
        if (cid === undefined) {
          cid = `conv_${randomUUID().replaceAll("-", "")}`;
          const created = await scope.run(
            graph,
            "Q95_conversation_start",
            q.Q95_conversation_start,
            { ...params, cid, tick, at: new Date().toISOString() },
          );
          if (created.length !== 1)
            throw new WorldFailure({
              code: "INTERNAL",
              message: "Conversation could not be created.",
            });
        }
        const recalled = await scope.ro(graph, "Q50_recall", Q50_recall, {
          ...params,
          limit: Number.MAX_SAFE_INTEGER,
        });
        const knownIds = z.array(EventId).parse(recalled.map((r) => r.eventId));
        const attitude = scope.take(
          await opinion.attitude({
            playerId: args.playerId,
            npcId: args.npcId,
          }),
        );
        const profile = DialogueProfile.parse(
          (
            await scope.ro(
              graph,
              "Q93_dialogue_profile",
              q.Q93_dialogue_profile,
              params,
            )
          )[0],
        );
        const events = DialogueEvent.array()
          .parse(
            await scope.ro(
              graph,
              "Q92_dialogue_known",
              q.Q92_dialogue_known,
              params,
            ),
          )
          .filter((e) => knownIds.includes(e.eventId));
        const beliefs = Belief.array().parse(
          await scope.ro(
            graph,
            "Q94_dialogue_beliefs",
            q.Q94_dialogue_beliefs,
            params,
          ),
        );
        const unknown = Unknown.array()
          .parse(
            await scope.ro(
              graph,
              "Q99_dialogue_unknown",
              q.Q99_dialogue_unknown,
              params,
            ),
          )
          .map((e) => ({
            ...e,
            subject: e.subject ?? "",
            keywords: e.keywords ?? [],
          }));
        const recent = DialogueLine.array()
          .parse(
            await scope.ro(
              graph,
              "Q97_recent_utterances",
              q.Q97_recent_utterances,
              { ...params, limit: 6 },
            ),
          )
          .reverse();
        const counted = await scope.ro(
          graph,
          "Q97b_conversation_count",
          q.Q97b_conversation_count,
          { cid },
        );
        const count = z.number().int().min(0).parse(counted[0]?.count);
        async function save(speaker: string, text: string, sequence: number) {
          const result = await scope.run(
            graph,
            "Q96_utterance_add",
            q.Q96_utterance_add,
            {
              ...params,
              cid: cid ?? "",
              uid: `ut_${randomUUID().replaceAll("-", "")}`,
              speaker,
              text,
              sequence,
              tick,
              at: new Date().toISOString(),
            },
          );
          if (result.length !== 1)
            throw new WorldFailure({
              code: "INTERNAL",
              message: "Conversation changed before the line could be saved.",
            });
        }
        await save("player", args.text, count);
        const prompt = buildDialoguePrompt(
          profile,
          attitude.label,
          events,
          beliefs,
          recent,
          args.text,
        );
        const candidates = templateCandidates(templates, {
          npcId: args.npcId,
          conversationId: cid,
          utteranceCount: count,
          label: attitude.label,
          aware: events.length > 0,
          text: args.text,
        });
        const response = await chooseDialogueReply(
          scope,
          llm,
          prompt,
          events.map((e) => e.eventId),
          unknown,
          candidates,
          options.llm ? "injected" : "gemini",
        );
        await save(args.npcId, response.reply, count + 1);
        return {
          conversationId: cid,
          ...response,
          attitude: { score: attitude.score, label: attitude.label },
          usedEventIds: events.map((e) => e.eventId),
        };
      }),
    );
  return { say };
}
