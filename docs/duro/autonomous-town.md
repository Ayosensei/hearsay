# Autonomous town: proximity and time

Requested by the user: stop choosing witnesses and let news spread over time.
They confirmed that everyone nearby sees the action, with no random stealth roll.

## Witnesses

The traveller has a local position independent of camera focus. Walking, district
travel and approaching someone to talk change that position. Watching a whisper
only moves the camera. The action form displays the nearest graph-resolved place
and all villagers within 240 world units in the same district; neither is editable.
The app derives both again at submission, then the existing core resolves IDs and
persists the event and witness knowledge in FalkorDB. No contract/query changes.

This is simple game geometry with static residents, no walls/occlusion, facing or
random detection. Positions are local demo state, not server-authoritative physics;
CLI/MCP tools retain explicit witnesses for game integrations. They are reset near
Brom when loading a traveller. This does not claim persistent graph NPC locations.
The locked contract requires 1–6 witnesses; the current layout yields at most two
within the radius. With nobody nearby, the form clearly asks you to move closer
and disables the deed. Unobserved deeds would require a separately approved
contract/core change; no fake witness is substituted.

## Time

After a deed exists, each 12 seconds of idle, visible exploration calls the actual
advanceTime tool once. The graph still chooses gossip candidates and strongest
sources, writes knowledge and increments its own tick. There is no client gossip
simulation, offline catch-up or background server scheduler.

Time pauses during dialogs, conversation, comparison, reaction/replay playback,
requests, offline state, hidden tabs and errors. A quiet empty world makes no clock
writes. Pause/Resume town is always available in free play; on an error, explicitly
resuming clears the displayed error and starts a fresh countdown, without an
immediate write retry. A native Web Lock plus shared timestamp rate-limits visible
windows for the same player. The guided story holds time at its teaching steps,
then automatically runs at the gossip steps; Wait ahead remains an optional shortcut.

The countdown, nearby people and current location are shown below the two actions.
Text mode offers equivalent location navigation. No new dependencies or LLM calls
are needed for either proximity or time. Gemini remains dialogue-only.

## Verification

Real FalkorDB integration checks cover a radius boundary, district exclusion,
multiple nearby people and the exact persisted witness set. Existing gossip and
isolation tests remain unchanged. Styleguide adds running/paused clock and a
no-nearby-person deed state, alongside normal, pending and failed forms.

Browser verification: a Town Square action automatically picked Sister Ayla and
Old Fenn, with both receiving 100% witness memories and Julian remaining unaware.
Without a manual advance, the next round changed Turn 2 to Turn 3 and displayed
Ayla → Elin / Mira and Fenn → Silas / Tilda. The traveller stayed at Town Square
while the camera followed other districts. A reading menu remained at Turn 3
for longer than a clock period. Manual pause, walking out of range (disabled
submission), returning near Brom, and 390x844 mobile controls were verified.
Screenshots: nearby-witnesses-1440x900.png, autonomous-town-1440x900.png,
nearby-empty-mobile-390x844.png and autonomous-mobile-390x844.png.

Regression: all 140 tests pass (5 contract, 105 core, 20 web, 2 MCP, 8 CLI).
Design guard and DESIGN.md lint pass; semantic tokens were regenerated unchanged.
