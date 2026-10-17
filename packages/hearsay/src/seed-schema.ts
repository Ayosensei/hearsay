import { readFile } from "node:fs/promises";
import { z } from "zod";
import { Id, Unit, EventType, Weight } from "@hearsay/contract";

const lines = z.array(z.string().min(1)).min(1);
const voices = z.object({
  hostile: lines,
  wary: lines,
  neutral: lines,
  friendly: lines,
  devoted: lines,
});
const templates = z.object({
  greeting: voices,
  aware: voices,
  unknownTopic: lines,
  naive: lines.optional(),
});
export const SeedSchema = z
  .object({
    version: z.literal(1),
    factions: z.array(z.object({ id: Id, name: z.string().min(1) })).min(1),
    places: z.array(z.object({ id: Id, name: z.string().min(1) })).min(1),
    npcs: z
      .array(
        z.object({
          id: Id,
          name: z.string().min(1),
          role: z.string().min(1),
          faction: Id,
          greed: Unit,
          courage: Unit,
          loyalty: Unit,
          persona: z.string().min(1),
        }),
      )
      .min(1),
    trusts: z.array(z.object({ truster: Id, trusted: Id, weight: Unit })),
    factionRelations: z.array(
      z.object({
        from: Id,
        to: Id,
        type: z.enum(["ALLIED_WITH", "HOSTILE_TO"]),
      }),
    ),
    facts: z.array(
      z.object({ id: Id, text: z.string().min(1), topic: z.string().min(1) }),
    ),
    believes: z.array(z.object({ npc: Id, fact: Id, confidence: Unit })),
    policies: z.array(
      z
        .object({
          id: Id,
          kind: z.literal("haggle"),
          markup: Unit,
          minMarkup: Unit,
          maxMarkup: Unit,
          step: z.number().positive().max(1),
        })
        .refine(
          (p) => p.minMarkup <= p.markup && p.markup <= p.maxMarkup,
          "Invalid policy bounds",
        ),
    ),
    follows: z.array(z.object({ npc: Id, policy: Id })),
    eventTypes: z
      .array(
        z.object({
          type: EventType,
          weight: Weight,
          keywords: z.array(z.string().min(1)),
        }),
      )
      .min(1),
    templates: templates.extend({
      byNpc: z.record(Id, templates.partial()).optional(),
    }),
  })
  .superRefine((seed, ctx) => {
    const checkUnique = (values: string[], field: string) => {
      if (new Set(values).size !== values.length)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `Duplicate ${field}`,
        });
      return new Set(values);
    };
    const npcIds = checkUnique(
      seed.npcs.map((n) => n.id),
      "npcs",
    );
    const factionIds = checkUnique(
      seed.factions.map((f) => f.id),
      "factions",
    );
    checkUnique(
      seed.places.map((p) => p.id),
      "places",
    );
    const factIds = checkUnique(
      seed.facts.map((f) => f.id),
      "facts",
    );
    const policyIds = checkUnique(
      seed.policies.map((p) => p.id),
      "policies",
    );
    checkUnique(
      seed.eventTypes.map((t) => t.type),
      "eventTypes",
    );
    checkUnique(
      seed.trusts.map((t) => `${t.truster}:${t.trusted}`),
      "trusts",
    );
    checkUnique(
      seed.believes.map((b) => `${b.npc}:${b.fact}`),
      "believes",
    );
    checkUnique(
      seed.follows.map((f) => `${f.npc}:${f.policy}`),
      "follows",
    );
    checkUnique(
      seed.factionRelations.map((r) => `${r.from}:${r.type}:${r.to}`),
      "factionRelations",
    );
    const reference = (set: Set<string>, value: string, field: string) => {
      if (!set.has(value))
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `Unknown reference ${value} in ${field}`,
        });
    };
    for (const npc of seed.npcs)
      reference(factionIds, npc.faction, "npcs.faction");
    for (const trust of seed.trusts) {
      reference(npcIds, trust.truster, "trusts.truster");
      reference(npcIds, trust.trusted, "trusts.trusted");
    }
    for (const relation of seed.factionRelations) {
      reference(factionIds, relation.from, "factionRelations.from");
      reference(factionIds, relation.to, "factionRelations.to");
    }
    for (const belief of seed.believes) {
      reference(npcIds, belief.npc, "believes.npc");
      reference(factIds, belief.fact, "believes.fact");
    }
    for (const follows of seed.follows) {
      reference(npcIds, follows.npc, "follows.npc");
      reference(policyIds, follows.policy, "follows.policy");
    }
    for (const npc of Object.keys(seed.templates.byNpc ?? {}))
      reference(npcIds, npc, "templates.byNpc");
  });
export type Seed = z.infer<typeof SeedSchema>;
export const DEFAULT_SEED_URL = new URL(
  "../../../seed/hollowbrook.json",
  import.meta.url,
);

export async function loadSeed(
  path: string | URL = DEFAULT_SEED_URL,
): Promise<Seed> {
  return SeedSchema.parse(JSON.parse(await readFile(path, "utf8")));
}
