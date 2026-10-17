# G13 — deliberately naive comparison NPC

`createHearsay(...).call('sayNaive', { playerId, npcId, text })` now implements the existing shared contract. `createNaive(db, options)` is also exported. The control remains excluded from MCP's 14 tools. It is ready for the Compare view to call; this stage does not wire the mock website to the engine.

The tool resolves player and NPC first. Q93 supplies the actual persona. Q98 reads every event performed by this player in this player's graph, including events the NPC never learned. The system prompt includes those event descriptions and the same player text, requesting plain text with a 50-word limit. The shared Gemini wrapper retains its configured model, deadline, retry and cache behavior; text format omits the guarded JSON response schema and uses a distinct cache key.

Q50 and Q99 provide graph knowledge and unknown vocabulary only for measuring the result. The shared lexical scanner checks unknown-event keywords and subject words, reports deduplicated matching event types, and never blocks or retries a leaking control reply. An invented event ID alone is not a keyword leak. Matching vocabulary can be ambiguous; this is not semantic proof of knowledge or a guarantee that all paraphrases are detected.

Off mode bypasses even an injected model. Provider failure or malformed output selects a deterministic NPC-specific/global `templates.naive` line. Older valid seeds without the optional naive list use a neutral greeting. Fallback text is measured too, so it can honestly report a leak. There are no Conversation or Utterance writes and no world initialization in this read-only tool.

## Evidence and boundaries

The new integration tests use real FalkorDB and disposable six-NPC synthetic graphs. A fake model deliberately says “You stole the iron sword.” Garrick's control receives that hidden theft plus a known helping event and returns the leaking line unchanged. Guarded `say` receives only the helping event, rejects the fake theft reply twice, then returns a safe template. The test checks both unchanged graph snapshot and an empty Q97 conversation result immediately after the control call.

Additional live cases cover keyword and subject matching, whole-word boundaries, known-only replies, deduplicated types, another player's empty log, deterministic off-mode templates, provider failures and early ID/input rejection. The HTTP test uses fake transport to verify text output parsing and absence of the JSON schema; it does not call Gemini.

No Gemini credentials/model are configured, so live model behavior and leakage rate remain unmeasured. The production content is still the permitted three-NPC stub. Cloud/app validation under G11 remains pending R-005. Independent graph reads are not one transactional snapshot during simultaneous gameplay writes.

Validation: typecheck, all 124 workspace tests (104 core, 5 contract, 13 web mock, 2 MCP), and the 49-query drift check pass. The six new control integration cases use a real database; the model and HTTP transport are injected fakes.
