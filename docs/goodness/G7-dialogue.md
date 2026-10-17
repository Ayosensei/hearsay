# G7 — guarded dialogue and persistent conversation history

`createDialogue(db, world?, options?)` exposes say. Options allow an injected Llm and the seedPath used for template content; custom-world callers should pass that same seed path. Normal callers use the default world seed. createLlm and the provider types are also exported. No new dependencies or shared contract changes.

```ts
import { createDialogue } from '@hearsay/core';

const dialogue = createDialogue(db, world);
const first = await dialogue.say({
  playerId: 'demo', npcId: 'garrick', text: 'What have you heard?',
});
if (first.ok) {
  console.log(await dialogue.say({
    playerId: 'demo', npcId: 'garrick', text: 'Tell me more.',
    conversationId: first.data.conversationId,
  }));
}
```

## Request flow

1. Validate the shared say input, resolve player and NPC, and validate a supplied conversation's ownership. Missing/foreign conversations return BAD_ARGS without writes. Otherwise create a Conversation linked to this player/NPC.
2. Read all known events via Q50, current attitude through Q51, the NPC's voice, known event descriptions and their own BELIEVES facts. Known descriptions are intersected with recall IDs. The server separately reads unknown events for the firewall.
3. Retrieve the last six saved lines between this player/NPC, across their conversations. Reverse them into chronological order; ignore an orphan leading model line and merge adjacent same-role lines when prior failures left an incomplete pair.
4. Save the current player Utterance, then generate a reply using only known event details in the system knowledge section, beliefs, current attitude and recent history. User messages may contain unknown claims; they remain unverified user speech and never become KNOWS edges.
5. Validate model JSON and check its event references, literal event IDs, unknown-event keywords and unknown subject words. On a leak, retry once with a stricter system instruction. If the second reply leaks or generation fails, select a deterministic seed template.
6. Check templates too. Try the selected line and remaining lines in that category; if all overlap unknown-event vocabulary, return a wordless ellipsis abstention. Save only the accepted/generated or fallback NPC reply. Rejected model drafts are never persisted.

usedEventIds is the allowed known-event list, as specified by the contract; it is not a claim that every allowed event was mentioned. A clean retry returns firewall.passed true with no final violations. A fallback after rejected content reports false plus violations, even though the returned fallback itself is safe. Off/provider-unavailable fallbacks normally report true unless candidate templates also fail.

## Gemini wrapper

Uses native fetch with the configured GEMINI_MODEL and GEMINI_API_KEY, sent in the API-key header. It uses the documented generateContent REST endpoint, systemInstruction/contents, JSON response format/schema and temperature 0.3. Response JSON must contain a nonempty reply of at most 50 whitespace-separated words and valid referencedEventIds. Incomplete/blocked output, malformed JSON and network errors return typed LLM_UNAVAILABLE failures; raw service errors and credentials are not returned.

Each generate call has one 8-second deadline covering HTTP, body parsing and backoff. Retry 5xx once; retry 429 twice with 500/1000 ms exponential base delays plus 0–249 ms jitter, within that deadline. Other 4xx are not retried. Cache successful structured responses for 60 seconds by model/prompt hash, bounded to 256 entries per provider instance. A stricter firewall retry changes the prompt/cache key. A say call can invoke generate twice, so this is not an 8-second deadline for the entire say pipeline. Injected providers are responsible for their own timeout.

HEARSAY_LLM=off bypasses even injected providers. Missing key/model safely falls back. The library reads process environment; the hosting application must load its environment configuration. After configuring a new key/model, recreate the provider/service. Templates come from the validated seed and are cached per dialogue service.

API shape checked against Google's [generateContent reference](https://ai.google.dev/api/generate-content) and [structured-output guide](https://ai.google.dev/gemini-api/docs/structured-output). Model names remain configuration; none are hardcoded.

## Evidence and real/mock boundary

Nine new live FalkorDB integration tests cover deliberate leakage and retry/fallback, clean retry, graph-grounded event confidence/attitude, own beliefs, history across recreated service instances, off mode, provider failures, unsafe-template abstention, identifier/foreign-conversation validation, concurrent turns, player isolation and literal query-looking input. Database access is real; these tests deliberately inject fake LLM replies to exercise failures deterministically. Seven wrapper tests simulate HTTP responses/timeouts and verify request shape, bounded retries, cache expiry and configuration handling. Five pure firewall/template tests plus one prompt-history test cover the lexical checks and template/history behavior.

The golden dialogue test records a theft, advances two actual gossip ticks, then gives Garrick the event through his real KNOWS edge: Mira source, 63% confidence and wary attitude at -0.562464. Before gossip, the system knowledge section excludes the theft; an injected model that confirms the player's theft claim twice is rejected and only the safe fallback is saved. Both Utterances persist in FalkorDB and feed a subsequent request through a new service instance. This is not a container-restart persistence test.

No Gemini key or model is configured locally. No real Gemini requests were made, so live model availability, quota, output quality and latency remain unverified. source:llm in injection tests describes the configured fake provider, not a Google response. Default off/configuration-failure behavior remains usable without credentials. The website still uses its mock engine; production content remains the three-NPC stub pending D1. HTTP/MCP integration and G13's naive control are not part of G7.

Final verification at 05:22 WAT: pnpm typecheck and pnpm test pass all 113 workspace tests (95 core: 61 live database, 34 pure/transport; 5 contract; 13 existing web mock). GRAPH.LIST is empty after cleanup. All 22 new G7 tests pass.

## Limits and issues

The firewall follows the specified lexical rules; it is not a semantic proof against every paraphrase, encoded leak or invented fact. It can conservatively reject a known event's wording when a different unknown event shares those keywords. Unknown player claims remain in user/history messages, explicitly unverified; only the authoritative event section is graph-scoped. No optional gazetteer/entity firewall was added.

Conversation writes are separate operations. Database/reset failure can leave an empty conversation or a lone player line; no transaction or rollback is claimed. Same-player/NPC calls serialize within one dialogue service, but independent instances and reset/gossip calls are outside that queue. Reads can observe concurrent changes; no transactional knowledge snapshot is provided. No automatic write retry was introduced. Production load and restart durability remain separate tasks.

One initial boundary run had one reset hook fail at Q01_graph_copy before the clean-retry assertion ran. Server logs show BGSAVE and repeated module-fork failures at 04:21:07 UTC, matching the existing copy/background-save issue. The boundary rerun passed all five tests. No tests were suppressed or durability settings changed; the infrastructure issue remains unresolved. No G7 Cypher syntax failures occurred.
