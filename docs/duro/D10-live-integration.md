# D10 — connect the town to the graph engine

Run `docker compose up -d falkordb`, `pnpm install`, then `pnpm dev`. Open
http://localhost:3001. The default is live graph mode; `NEXT_PUBLIC_HEARSAY_MODE=mock`
keeps the older fixture client available for development. Gemini settings remain server-side;
without a configured key/model the real dialogue pipeline returns labeled templates.

`HttpHearsay` implements the shared `HearsayClient.call` contract and parses response schemas.
`LiveTownClient` maps tool outputs into presentation data; it never computes gossip, attitudes
or provenance. Every refresh uses getWorld, snapshot, recall and attitude. Stable graph edge IDs
are preserved for explain highlighting. Missing players are created and retried once; ambiguous
write failures are never replayed. Reset requires confirmation and calls resetPlayer.

The form sends an explicit contract event type, graph-resolved place and witness, and a 60-character
subject. Player identities persist in browser local storage, with distinct A/B graphs. Browser
chat messages stay in UI state while the engine persists Utterances for prompt continuity.

The existing production seed remains the three-NPC starter. This task does not silently replace
templates or migrate existing player saves. The template must be deployed explicitly when the
full six-NPC content lands. Cloud browser recovery and live Gemini need separate verification.

Next's Cache Components disallows a per-route runtime export, so this route uses the default
Node runtime. FalkorDB is listed in serverExternalPackages because bundling its Temporal/JSBI
dependency produced `e.BigInt is not a function` in the actual Next server.

New dependencies are shadcn Button's small `class-variance-authority` and Radix Slot primitives.
Button/Input were generated with the shadcn CLI and themed with existing semantic tokens; the
temporary umbrella Radix dependency was removed. No new design, animation or icon system.

API tests use the actual handler and real FalkorDB, including the complete two-tick gossip path,
exact attitude and snapshot-matching explanation IDs. UI specimens are on `/styleguide` and
screenshots are in `screens/D10-*.png`.

## Browser verification

Verified at 1440x900 on the actual Next server and local FalkorDB:

- Record `stole / iron sword / forge / brom`: Brom becomes hostile; Garrick remains unaware.
- Ask Garrick `I stole the iron sword. Did you hear?`: safe abstention, template source and passed firewall.
- Explain before gossip: explicit `No path exists` state.
- Advance once: Mira learns at 90%; Garrick remains unaware. Advance twice: Garrick is wary,
  score -0.56 in the UI (exact backend score -0.562464), confidence 63%.
- Explain after gossip: actual Brom → Mira → Garrick path at 100%, 90%, 63%, with Q61 provenance.
- Player B: tick zero, no events or memories. Return/reload A: tick two and knowledge preserved.
- Comparison: actual sayNaive/say replies, both accurately labeled template fallback.
- Reset A: tick zero, all three NPCs neutral and unaware. Repeating the action/gossip flow succeeds.
- Styleguide renders the new form, source/firewall metadata and graph states.

The full workspace suite passes 136 tests. Production build passes with the existing dynamic
seed-file tracing warning; no live Gemini or Cloud-browser result is claimed.
