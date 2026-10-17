import { z } from 'zod';

export const CONTRACT_VERSION = '1.0.0';

// ---------- primitives ----------
export const Id = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,39}$/);
export const PlayerId = Id;
export const NpcId = Id;
export const PlaceId = Id;
export const EventId = z.string().regex(/^ev_[a-z0-9_-]{1,40}$/);
export const Weight = z.number().min(-1).max(1);
export const Unit = z.number().min(0).max(1);
export const Tick = z.number().int().min(0);

export const EventType = z.enum(['stole', 'attacked', 'lied', 'helped', 'donated', 'saved', 'traded']);
export type EventType = z.infer<typeof EventType>;

export const DEFAULT_EVENT_WEIGHT: Record<EventType, number> = {
  stole: -0.8, attacked: -0.9, lied: -0.4, helped: 0.5, donated: 0.4, saved: 0.9, traded: 0.1,
};

export const AttitudeLabel = z.enum(['hostile', 'wary', 'neutral', 'friendly', 'devoted']);
export type AttitudeLabel = z.infer<typeof AttitudeLabel>;

// ---------- envelope ----------
export const ErrorCode = z.enum([
  'BAD_ARGS', 'UNKNOWN_PLAYER', 'UNKNOWN_NPC', 'UNKNOWN_EVENT', 'UNKNOWN_PLACE',
  'UNKNOWN_POLICY', 'LLM_UNAVAILABLE', 'DB_UNAVAILABLE', 'INTERNAL',
]);

export const TraceStep = z.object({
  agent: z.enum(['scribe', 'gossip', 'npc', 'system']),
  tool: z.string(),
  queryId: z.string().optional(),          // e.g. 'Q40_gossip_candidates'
  args: z.record(z.string(), z.unknown()), // sanitised: never include API keys
  rows: z.number().int(),
  ms: z.number(),
});
export type TraceStep = z.infer<typeof TraceStep>;

export const ErrorBody = z.object({ code: ErrorCode, message: z.string(), hint: z.string().optional() });

export type Envelope<T> =
  | { ok: true; data: T; trace: TraceStep[] }
  | { ok: false; error: z.infer<typeof ErrorBody>; trace: TraceStep[] };

// ---------- shared output pieces ----------
export const KnownItem = z.object({
  eventId: EventId,
  type: EventType,
  placeId: PlaceId.nullable(),
  weight: Weight,
  tick: Tick,
  learnedFrom: z.string(),        // 'witness' or an NPC id
  confidence: Unit,
  hop: z.number().int().min(0),
});

export const GraphNode = z.object({
  id: z.string(),                 // stable: `${kind}:${id}` e.g. 'NPC:brom'
  kind: z.enum(['Player', 'NPC', 'Event', 'Place', 'Faction', 'Fact', 'Policy']),
  label: z.string(),
  props: z.record(z.string(), z.unknown()),
});
export const GraphEdge = z.object({
  id: z.string(),                 // `${type}:${from}->${to}` (+ ':' + eventId for KNOWS/TOLD)
  from: z.string(),
  to: z.string(),
  type: z.enum(['PERFORMED', 'HAPPENED_AT', 'KNOWS', 'TOLD', 'TRUSTS', 'MEMBER_OF', 'BELIEVES', 'FOLLOWS', 'ALLIED_WITH', 'HOSTILE_TO']),
  props: z.record(z.string(), z.unknown()),
});

// ---------- tools ----------
export const TOOLS = {
  getWorld: {
    agent: 'system' as const,
    input: z.object({}),
    output: z.object({
      npcs: z.array(z.object({
        id: NpcId, name: z.string(), role: z.string(), faction: z.string(),
        greed: Unit, courage: Unit, loyalty: Unit,
      })),
      places: z.array(z.object({ id: PlaceId, name: z.string() })),
      eventTypes: z.array(z.object({ type: EventType, weight: Weight })),
    }),
  },

  newPlayer: {
    agent: 'system' as const,
    input: z.object({ playerId: PlayerId, name: z.string().max(40).optional() }),
    output: z.object({ playerId: PlayerId, graph: z.string(), created: z.boolean() }), // created=false if it already existed
  },

  resetPlayer: {
    agent: 'system' as const,
    input: z.object({ playerId: PlayerId }),
    output: z.object({ playerId: PlayerId, tick: Tick }),
  },

  recordEvent: {
    agent: 'scribe' as const,
    input: z.object({
      playerId: PlayerId,
      type: EventType,
      placeId: PlaceId,
      witnesses: z.array(NpcId).min(1).max(6),
      weight: Weight.optional(),             // defaults to DEFAULT_EVENT_WEIGHT[type]
      subject: z.string().max(60).optional(), // e.g. 'iron sword'
    }),
    output: z.object({
      eventId: EventId, tick: Tick, weight: Weight,
      witnesses: z.array(NpcId),
    }),
  },

  spread: {   // run gossip for ONE event up to maxHops (experiment / demo contrast)
    agent: 'gossip' as const,
    input: z.object({
      playerId: PlayerId, eventId: EventId,
      maxHops: z.number().int().min(1).max(4).default(3),
      minCredibility: Unit.default(0.25),
    }),
    output: z.object({
      steps: z.array(z.object({
        hop: z.number().int().min(1), tellerId: NpcId, listenerId: NpcId, credibility: Unit,
      })),
      reached: z.array(NpcId),
      stoppedBecause: z.enum(['max_hops', 'min_credibility', 'no_listeners']),
    }),
  },

  advanceTime: {   // ONE gossip hop for ALL rumors, then tick += 1
    agent: 'gossip' as const,
    input: z.object({ playerId: PlayerId }),
    output: z.object({
      tick: Tick,
      steps: z.array(z.object({
        eventId: EventId, tellerId: NpcId, listenerId: NpcId, credibility: Unit, hop: z.number().int().min(1),
      })),
    }),
  },

  recall: {
    agent: 'npc' as const,
    input: z.object({ playerId: PlayerId, npcId: NpcId, limit: z.number().int().min(1).max(50).default(10) }),
    output: z.object({
      status: z.enum(['known', 'not_in_graph']),   // not_in_graph = this NPC has heard nothing about the player
      items: z.array(KnownItem),
    }),
  },

  attitude: {
    agent: 'npc' as const,
    input: z.object({ playerId: PlayerId, npcId: NpcId }),
    output: z.object({
      score: z.number().min(-1).max(1),
      label: AttitudeLabel,
      contributions: z.array(z.object({
        eventId: EventId, type: EventType, effect: z.number(), confidence: Unit, learnedFrom: z.string(),
      })),
    }),
  },

  explain: {
    agent: 'npc' as const,
    input: z.object({ playerId: PlayerId, npcId: NpcId, eventId: EventId }),
    output: z.object({
      status: z.enum(['known', 'not_in_graph']),
      learnedFrom: z.string().nullable(),
      chain: z.array(z.object({ npcId: NpcId, name: z.string() })),   // root witness ... this NPC; [] if not_in_graph
      hopConfidences: z.array(Unit),                                   // length = chain.length - 1
      edgeIds: z.array(z.string()),                                    // GraphEdge ids to highlight in the UI
    }),
  },

  whoKnows: {
    agent: 'gossip' as const,
    input: z.object({ playerId: PlayerId, eventId: EventId }),
    output: z.object({
      witnesses: z.array(NpcId),
      heardFrom: z.array(z.object({ npcId: NpcId, from: NpcId, confidence: Unit, hop: z.number().int() })),
      unaware: z.array(NpcId),
    }),
  },

  gossipHubs: {
    agent: 'gossip' as const,
    input: z.object({ playerId: PlayerId.optional(), limit: z.number().int().min(1).max(10).default(3) }),
    output: z.object({ hubs: z.array(z.object({ npcId: NpcId, name: z.string(), score: z.number() })) }),
  },

  adaptPolicy: {
    agent: 'npc' as const,
    input: z.object({
      playerId: PlayerId, npcId: NpcId, policyId: Id,
      outcome: z.enum(['lowballed', 'fair']),
    }),
    output: z.object({
      policyId: Id, before: z.object({ markup: z.number() }), after: z.object({ markup: z.number() }),
      tries: z.number().int(), wins: z.number().int(),
    }),
  },

  say: {
    agent: 'npc' as const,
    input: z.object({
      playerId: PlayerId, npcId: NpcId,
      text: z.string().min(1).max(400),
      conversationId: z.string().optional(),
    }),
    output: z.object({
      conversationId: z.string(),
      reply: z.string(),
      source: z.enum(['llm', 'template_fallback']),
      firewall: z.object({ passed: z.boolean(), violations: z.array(z.string()) }),
      attitude: z.object({ score: z.number(), label: AttitudeLabel }),
      usedEventIds: z.array(EventId),     // events the reply is allowed to refer to (what the NPC knew)
    }),
  },

  sayNaive: {   // DEMO-ONLY control: same LLM and persona, told EVERYTHING, no firewall. Not registered in MCP.
    agent: 'npc' as const,
    input: z.object({ playerId: PlayerId, npcId: NpcId, text: z.string().min(1).max(400) }),
    output: z.object({
      reply: z.string(),
      source: z.enum(['llm', 'template_fallback']),
      leaked: z.boolean(),                       // reply mentions an event this NPC never learned (measured, never blocks)
      leakedEventTypes: z.array(EventType),
    }),
  },

  snapshot: {
    agent: 'system' as const,
    input: z.object({ playerId: PlayerId, focusEventId: EventId.optional() }),
    output: z.object({
      tick: Tick,
      nodes: z.array(GraphNode),
      edges: z.array(GraphEdge),
    }),
  },
} as const;

export type ToolName = keyof typeof TOOLS;
export type ToolInput<N extends ToolName> = z.input<(typeof TOOLS)[N]['input']>;
export type ToolOutput<N extends ToolName> = z.output<(typeof TOOLS)[N]['output']>;

export interface HearsayClient {
  call<N extends ToolName>(name: N, input: ToolInput<N>): Promise<Envelope<ToolOutput<N>>>;
}
