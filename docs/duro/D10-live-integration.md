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
