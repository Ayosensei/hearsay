# Guided campaign

The campaign order is Demo → Night Watch → Missing Medicine → Family Feud → Cover-up → Redemption → Three Factions → Rumour Detective.

New travellers open the campaign automatically. The demo is an untimed, illustrated example: Next advances the example, Back revisits a lesson, and its AP, turn, conversation and news route change with each step. Seven lessons cover objectives, movement, nearby witnesses, AP, turn advance, trust-directed gossip, tradeoffs and endings. No demo actions are sent to the game backend. Returning early does not complete the demo; finishing unlocks Night Watch. A mission that was already running retains its deadline while the demo is viewed.

The campaign menu disables future levels and explains their unlock requirement. A confirmed winning scenario state marks the level complete; a loss does not advance progress. Win screens offer Next level, and completed levels remain replayable. The start handler also checks prerequisites so other UI entry points cannot bypass the campaign sequence.

Campaign home now displays all eight stops as a connected map, with completed, ready and locked states. Small screens use a vertical trail in the same level order. When a mission reaches a winning or losing ending, the game automatically returns to home and displays its outcome above the map. An ending is handled once per attempt, so opening the ending and revealed graph does not bounce back home. Demo completion also returns to the map. Browser verification completed Night Watch through evacuation, checked the automatic return and next unlock, and reopened its ending in a separate local session.

Ended scenarios now render home directly unless the player explicitly chooses to review that attempt's ending. This no longer relies on a one-time drawer redirect. The result panel has a direct Retry level button, plus Next level on an eligible win. A retry creates a fresh attempt and clock; the current restored level remains retryable even if its local unlock history is missing. Home and Demo shortcuts stay fixed on home, in the town and graph views, and while loading. The Demo opens a separate help dialog and preserves the current mission; an active mission's deadline continues. Browser verification exercised loss → Retry → fresh turn zero, win → Next level → the next fresh mission, and opening/closing Demo.

Campaign completion is saved in `hearsay-campaign-v1` in this browser's local storage and synchronized between tabs. It is not account-based or an anti-cheat boundary. Clearing browser storage resets campaign unlocks. Existing individual mission saves remain intact in FalkorDB and can still be restored; campaign ordering applies to starting fresh attempts.

`campaign.test.ts` verifies the initial demo gate, every unlock boundary, replay access, completion gaps, and safe progress restoration. Browser checks cover all seven demo steps, Back, completion, the first mission unlock and persistence across reload.
