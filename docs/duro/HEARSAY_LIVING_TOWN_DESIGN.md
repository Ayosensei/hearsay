# HEARSAY: THE LIVING TOWN
### Redesign brief for an interactive 2D world with moving characters

Version: 2.0 proposal
Replaces: the near black developer console in the current DESIGN.md
Keeps from the old system: gold for provenance, electric blue for information in motion, Geist Mono for real numbers, honesty about what the engine really does

---

## 0. HOW TO READ THIS DOCUMENT

This brief has three kinds of statements. Every line should be read in light of which one it is.

* **ENGINE TRUTH**: something the backend already does (record event, witnesses, advance time, gossip along trust, confidence multiplication, attitude from memories, chat limited to known events, why evidence chain, Player A and B saves, reset).
* **PRESENTATION**: new visuals, animation, audio and layout that make engine truth visible. These are what the designer owns.
* **PROPOSED EXTENSION**: things that need small frontend only logic (for example proximity choosing witnesses). They are flagged so nobody promises a feature the backend does not have.

The golden rule of this redesign:

> The world may move on its own for charm, but it may never claim anything the engine has not confirmed.

Ambient wandering is decoration. A whisper, a pointed finger, a changed face or a glowing thread is evidence, and it only appears after the backend says it happened.

---

## 1. THE BIG IDEA

### 1.1 One sentence

**You arrive in Hollowbrook at dusk. You do one thing. Then you watch the whole town quietly talk about you, and you can follow every whisper back to where it started.**

### 1.2 The metaphor: a paper diorama that gossips

Hollowbrook is a small hand built theatre of layered paper cutouts lit by lanterns, like a pop up storybook sitting on a table. Tiny villagers walk its streets. When something is said about you, a glowing paper whisper leaves one mouth and travels to another ear. The thing that makes Hearsay special (provenance, who told whom) becomes a visible physical object you can watch, catch and unravel.

Why this works:
* A diorama is small enough to understand at a glance (three people, three places) and rich enough to feel alive.
* Paper and ink fit the theme of stories, ledgers, rumour and records.
* Layered paper is cheap to build in 2D with parallax, so it is realistic for a hackathon or small team.
* Warm lantern light against deep indigo gives a memorable look that is nothing like the usual dark dashboard.

### 1.3 What the player should feel, in order

1. Curiosity: "Ooh, the town is already moving."
2. Agency: "I can walk in and do something."
3. Consequence: "Brom just turned and stared at me."
4. Suspense: "Garrick has no idea. Yet."
5. Discovery: "Wait, the guard heard? Mira told him? Show me."
6. Understanding: "So this is how a reputation travels."

---

## 2. DESIGN PRINCIPLES

1. **Show the story, hide the machinery.** The first screen has no panels, graphs or forms. The graph exists, but it is a drawer you open later ("Under the hood").
2. **Every confirmed change gets a visible cause and a sentence.** Visual plus words, always both.
3. **Knowledge and attitude never share a symbol.** Knowledge is shown with whispers and the ledger. Attitude is shown with faces, posture and a lantern colour. See section 9.
4. **Trust is a standing bond. Gossip is an act.** Trust is a faint rope between people. A whisper is a thing that actually travelled. They look completely different.
5. **Motion explains cause and effect.** Ambient motion is slow and grey. Meaningful motion is warm, bright and tied to a confirmed event.
6. **Never imply mechanics that do not exist.** No stealth meter, no arrest, no inventory, no reward. The player does not "get away" with anything.
7. **Everyone can play.** Full keyboard control, reduced motion mode, text narration of every beat, colour never the only signal.

---

## 3. HOW ENGINE TRUTH BECOMES WORLD VISUALS

Each engine concept gets exactly one visual language.

**Event (something you did)**
Shown as a small paper "deed card" that pins above the location where it happened and also goes into the Ledger. Harmful deeds have a torn red edge and a wax stamp. Helpful deeds have a green ribbon. The sword theft is a card with a sword stamp.

**Witness (someone who directly saw it)**
Shown as a gold eye mark above the head of the witness at the moment of the deed, plus a quick gold line from deed card to witness. Gold stays reserved for provenance. This is the "origin" highlight from the old system, now in the world.

**Memory and confidence (someone learned it, how sure they are)**
Shown as a paper whisper note held in the character's "thought tab" (a small tag floating near their shoulder). Confidence is drawn as ink legibility:
* 100 percent: crisp black ink, sharp edges, gold seal.
* 90 percent: crisp ink, slightly lighter, blue seal.
* 63 percent: smudged ink, softly torn corner, faded seal.
This makes "each link reduces certainty" something you can see without a number. The number appears in mono type on hover or tap.

**Gossip (someone actually told someone)**
Shown as a whisper moth: a glowing paper moth carrying the note, flying from teller to listener in an arc. Only appears after a confirmed advance of time. Signal blue glow. See section 8.

**Trust (standing relationship, directional)**
Shown only on demand as a thin thread between two people with a small arrowhead pointing from the one who trusts to the one trusted, labelled "Mira trusts Brom, 90 percent". Hidden by default, revealed by the "Bonds" lens. Never animated.

**Attitude (hostile, wary, neutral, friendly, devoted)**
Shown by the character's face, posture, distance kept from the player, and lantern colour. See section 9.

**Time step (advance time)**
Shown as a lantern pulse sweeping across town and every villager pausing to "murmur" for a moment, then the confirmed results playing one by one. Called a "turn", never "tomorrow" or "hour", because the engine models neither.

**Evidence chain (why)**
Shown as the whisper's trail: the path of its flights lights up as a golden thread through the town with each stop labelled. See section 10.

**Player A and Player B**
Shown as two separate traveller tags (see section 12) that load two different versions of the same diorama.

---

## 4. THE FIRST USER EXPERIENCE: "THE ARRIVAL"

This is the headline feature. It must feel like opening a storybook, not a web app.

### 4.1 Before anything is clicked (0 to 6 seconds)

The browser opens to a full screen diorama. No navigation bar. The camera begins slightly pulled back, and slowly pushes in.

* Dusk sky in deep indigo fading to amber at the horizon, with paper clouds drifting at parallax speed.
* Lanterns flicker on, one by one, from left to right as the scene fades up (about 2 seconds).
* Tiny villagers are already living: Brom hammers at the forge, sparks popping. Mira wipes a table and waves at someone offscreen. Garrick paces slowly along the barracks wall. None of them look at the camera.
* A single line of handwritten serif text fades in at the top, with one italic word:

  **A town that *remembers*.**

  Beneath, in small Geist:
  "Do one thing. Then watch Hollowbrook talk about it."

### 4.2 The invitation (6 to 10 seconds)

A small paper tag swings down on a string at the town gate. It reads:

  **Traveller, arrive.**
  [ Step into Hollowbrook ]
  Explore freely (small text link)
  Under it, in caption: "About one minute. Three villagers. Every reaction explained."

A faint pulsing gold footprint trail on the cobbles shows the way in. The footprints are purely a hint and disappear after first click.

### 4.3 The arrival (click to 14 seconds)

Clicking the tag makes the traveller sprite walk in from the left edge under the camera, lantern in hand. The camera follows and settles on Brom's Forge, which becomes the centre of attention while the rest of town dims slightly (soft vignette, not a hard overlay).

The traveller is a small, simple, expressive figure: hooded, satchel, a lantern that glows the colour of the player's reputation. At the start the lantern is a neutral warm white.

A narrator caption at the bottom appears in typewriter style:
"Nobody here knows your story yet."

### 4.4 The beats of the first story

Each beat has: what the screen shows, what text appears, which engine call is used.

**Beat 1: Choose to act**
Brom stands at his anvil. A glowing iron sword rests on the rack. A pulsing hand cursor hovers over the sword. Caption: "Brom is close enough to see everything."
Interaction: click the sword. A small prepared action card opens beside it (not a form):
"You steal an iron sword at Brom's Forge. Brom sees you."
Buttons: [ Take the sword ] [ Change this ]
"Change this" opens the full action form (section 10.2).
Engine: none yet.

**Beat 2: The deed**
Click "Take the sword". The button shows a spinner and the world holds still (do not show success first).
Engine: record event with action steal, item iron sword, location Brom's Forge, witness Brom.
On confirmed success:
* The sword animates into the traveller's satchel.
* Brom freezes mid swing, head snaps up. A gold eye mark pops above his head.
* A deed card with a red torn edge and sword stamp pins above the forge.
* Brom's face turns angry, his lantern shifts to red, and he steps forward, then stops.
* Caption: "Brom saw you take the iron sword. He is hostile now."
* Mira and Garrick keep going about their business, with a small grey "unaware" thought tag over their heads (a sleeping eye).
* The traveller's own lantern flickers and starts to tint a little red.
On failure: the world resumes, the action card stays open with values intact, and a calm message appears: "We could not confirm that this was recorded. Your choices are still here." Never auto retry.

**Beat 3: The knowledge boundary**
The camera pulls back to show the whole town. Mira and Garrick's sleeping eyes stay visible. Prompt in a speech tag: "Does Garrick know? Walk over and ask."
The traveller auto walks (or the player walks) toward the barracks.
Engine: chat with Garrick ("Have you heard anything about me?").
Garrick answers briefly from his own memory (currently template fallback). His thought tab shows an empty paper. Panel caption: "Garrick is unaware of this event. Nobody has told him."
Display "Template reply" as a tiny mono chip with a tooltip.

**Beat 4: Let the town talk**
A lantern shaped button glows at the bottom centre:
  **Let the town talk**
  "Give townspeople another chance to share what they know."
Click. Engine: advance time one step.
The scene plays the confirmed gossip results in order:
1. A soft hush and a lantern pulse across the town.
2. Brom turns to a window. Mira walks from the inn toward the forge (or Brom walks toward her, whichever is shorter on the map).
3. They meet halfway, lean in, and a whisper moth lifts from Brom's mouth and flies into Mira's ear.
4. A paper note appears in Mira's thought tab, ink crisp (90 percent).
5. Mira's face becomes wary, her lantern amber.
6. Caption: "Brom told Mira. She is 90 percent sure of what she heard."
Garrick still has a sleeping eye. Make this obvious by briefly spotlighting him with a quiet label: "Garrick has not heard yet."

**Beat 5: The second hop**
A prompt: "She can pass it on next turn." The lantern button pulses again.
Click. Engine: advance time one step again.
Mira walks along the cobbled road to the barracks, whispers to Garrick, and the whisper moth is visibly dimmer and the ink on his note is smudged (63 percent). Garrick's face tightens. His lantern turns amber orange.
Caption: "Mira told Garrick. He believes it 63 percent."
If nothing else spreads, a third press shows: "No new rumours spread this turn" with a calm, still town. This must never look like a broken button.

**Beat 6: Follow the whisper**
A glowing gold button appears over Garrick: [ How did he find out? ]
Click. Engine: why for Garrick.
The camera slowly retraces the route: a gold thread ignites from the forge to the inn to the barracks, with a small label at each stop.
  Brom saw it: 100 percent
  Mira heard from Brom: 90 percent
  Garrick heard from Mira: 63 percent
A "ledger page" slides up with the same three lines in handwriting, and a toggle: "Show the arithmetic" which reveals "100 percent times 90 percent is 90. 90 percent times 70 percent is 63."
Text: "Garrick did not see the theft. He heard it secondhand."

**Beat 7: The reveal**
The camera pulls up to show the whole diorama and the three whisper trails glowing like constellations. The headline appears:
  **Now you have seen how Hollowbrook *remembers*.**
Buttons: [ Try a good deed ] [ Meet a second traveller ] [ Explore the town ]
The prompts hide, the world is yours.

### 4.5 Skip and replay
A small "Skip the tour" text link always sits in the corner during Arrival. "Replay the sword story" lives in the main menu forever.

---

## 5. THE MAIN SCREEN

After the tour, the full screen stays the diorama. Interface lives at the edges, styled as paper and brass fittings, never as floating glass panels.

**Centre: the Diorama** (about 75 to 80 percent of the screen)
The living town, with the traveller and the villagers.

**Top left: the Ledger tab**
A leather bound book icon. Opens a paper drawer listing your deeds ("Iron sword stolen, Brom's Forge, Turn 0"). Selecting a deed sets the "current story" for the whole world: who witnessed it, who knows it, and which whisper trail belongs to it.

**Top right: Traveller tag and menu**
Shows "Your story: A" with a small swap control, plus reset, settings, replay tour, accessibility.

**Bottom centre: the Action dock**
Three large buttons in a brass frame:
* Take an action (opens the verb wheel)
* Let the town talk (advance time)
* Trace a story (opens the evidence view for the selected person and event)

**Bottom left: the Narrator strip**
One line of text describing the last confirmed consequence. Replaced after every confirmed change. Also read aloud to screen readers.

**Bottom right: Lenses**
Small toggle chips: Bonds (trust threads), Whispers (all past gossip trails), Under the hood (engine drawer).

**Right edge: Character drawer**
Appears only when someone is selected. See section 7.4.

No panel ever covers the whole town. Drawers are at most 30 percent width and can be closed with Escape.

---

## 6. THE WORLD

### 6.1 Layout

A horizontal diorama about 3200 by 1200 design pixels, scrollable by dragging or by following the traveller, with three clear districts at left, centre and right so the gossip route reads as a single path.

* Left: **Brom's Forge**. Glowing furnace, anvil, weapon rack, a cart, open front.
* Centre: **The Copper Kettle**. Warm inn with big lit windows, tables outside, a hanging copper kettle sign.
* Right: **Guard Barracks**. Stone building, banner, training dummy, sturdy gate.
* Between them: cobbled road, a well in the square, trees, a fence, a notice board.

Distances matter: forge to inn is about 700 px, inn to barracks about 700 px. Walking time is about 4 seconds each leg at traveller pace. This makes the two hop story physically readable.

### 6.2 Layers (parallax, back to front)

1. Sky gradient with moon and stars
2. Far hills silhouette
3. Mid hills with tiny lit windows
4. Distant roofs
5. Buildings (three hero buildings, each on its own layer)
6. Road and props
7. Characters and whispers
8. Foreground paper (fence posts, leaves, hanging lanterns), slightly blurred
9. Light overlay and soft vignette

Parallax is mouse movement and character movement driven, small (max 24 px), and disabled in reduced motion mode.

### 6.3 Time of day
The world stays at dusk. It does not change with turns, because the engine has no day cycle. A turn is shown by the lantern pulse only.

---

## 7. CHARACTERS

### 7.1 Visual style
Chunky paper puppet style: layered cutout limbs, visible paper edges, soft shadows, slightly oversized heads for readable expressions. About 160 px tall at base zoom.

### 7.2 The cast

**The Traveller (player)**
Hooded cloak, satchel, lantern. Gender neutral. Lantern colour reflects overall standing in this save (neutral warm white at start). Small, readable idle: lantern sway and breathing.

**Brom, blacksmith**
Broad, soot smudged apron, leather gloves, a hammer. Warm orange palette. Energetic when friendly, slams hammer when hostile.
Personality hint on hover: "Plain spoken. Takes his craft personally."

**Mira, innkeeper**
Round, quick, tea towel over shoulder, copper kettle brooch. Teal and cream palette. Hand gestures when talking, always leans in to share news. She is the town's connector, so give her extra social idles.
Hover: "Warm. Knows everyone."

**Garrick, guard captain**
Tall, armoured, plumed helm under arm, rigid posture. Violet and steel palette. Stands apart from others, crosses arms when wary.
Hover: "Dutiful. Keeps order."

### 7.3 Animation set per character

Every character needs these cycles. Frame counts are minimums for 2D skeletal (Spine, DragonBones) or frame by frame.

* Idle (loop, 4 variations, 6 to 8 s total)
* Work loop (hammering, wiping tables, patrolling), ambient only
* Walk left and right (8 frames)
* Turn to face the traveller (4 frames)
* Notice (head snap, gold eye mark appears) 
* Speak (mouth and hand loop)
* Whisper lean in, and receive whisper (ear tilt)
* Reaction faces: hostile, wary, neutral, friendly, devoted (static pose with 2 frame idle breathing)
* React to gift or help (positive surprise)
* Step back, cross arms (distance keeping behaviour)

### 7.4 Character state machine (presentation only)

Top level states and when they change:
* **Ambient**: default. Wander within home zone, perform work loop. No speech marks.
* **Noticing**: triggered only by a confirmed event with them as witness.
* **Receiving**: triggered only by a confirmed gossip result with them as listener.
* **Telling**: triggered only by a confirmed gossip result with them as teller.
* **Conversing**: triggered when the player opens chat with them.
* **Reacting**: transitions to a new attitude pose after a confirmed attitude change.

Transitions into Noticing, Receiving, Telling must come from backend responses. Never from timers.

### 7.5 The character drawer (when selected)

Left side avatar and name, role. Right side two separated blocks:

**What does Garrick know?** (Knowledge)
A paper note showing "The sword theft. Heard from Mira. 63 percent sure." with ink smudge matching confidence. For witnesses: "Saw it happen." For none: "Has not heard about this event yet." Always names the event.

**How does Garrick feel about you?** (Attitude)
Face, label ("Wary"), and one plain sentence: "The theft damaged his opinion of you." A "Why?" link opens contribution breakdown.

Below: the chat box with suggestions: "What have you heard about me?", "What do you think of me?", "Has any news reached you?" and a small helper line: "Conversation does not create an action. Use Take an action to change your story."

Under that: two buttons: [ How did he find out? ] and [ Why is he wary? ] kept deliberately separate (origin of knowledge versus reason for attitude).

---

## 8. SHOWING GOSSIP

### 8.1 The whisper moth
A small glowing paper moth, about 40 px, carrying a tiny note. It leaves the teller's mouth, flies in a soft arc and enters the listener's ear. Duration about 1.6 seconds. A faint sparkle trail fades behind it.

* Colour: signal blue.
* Opacity and sharpness of the moth and note match confidence (crisp at 90, softer at 63).
* Never loops, never flies without a confirmed result.

### 8.2 Choreography for a turn
Backend returns a list of gossip results. Play them in order, never in parallel, with a half second pause between. Between each, the Narrator strip updates its sentence. If the list is empty, play the "quiet town" beat: the lantern pulse, all villagers pause, a small cloud of paper confetti does nothing, and the strip says "No new rumours spread this turn."

### 8.3 Newly informed rule
A newly informed person gets a gentle glow ring that lasts exactly one turn, because they cannot pass it on until the next one. This teaches the hop by hop rule through the picture.

### 8.4 Trust versus gossip lenses
* **Bonds lens**: thin dotted ropes between people, arrowheads from truster to trusted, labels on hover. Static.
* **Whispers lens**: shows all completed whisper routes for the selected deed as solid glowing paths that people can hover.
* Never show both at once by default. A small legend always names what the current lens shows.

### 8.5 What the visuals must not do
* No story mutation effects. The sword does not change shape.
* No continuous floating whispers while paused.
* No percent that looks like a health bar.

---

## 9. SHOWING ATTITUDE

Attitude is communicated by four redundant cues so no single one is required:

1. **Face and posture** (primary)
2. **Lantern colour** (a small lantern or glow near them)
3. **Comfortable distance** from the traveller (hostile stays far, devoted comes close)
4. **A text badge** in the drawer and on hover

Scale:
* Hostile: dark red glow, scowl, arms tight, turns away, keeps far.
* Wary: amber glow, narrowed eyes, arms crossed, keeps a few steps away.
* Neutral: soft white glow, relaxed.
* Friendly: green glow, smile, waves.
* Devoted: cyan glow, bright smile, follows slightly, offers things.

Keep icons next to every colour, and name the attitude in text.
Never use a percent for attitude on the main stage. The number lives in the engine drawer.

---

## 10. INTERACTIONS

### 10.1 Movement
* Click anywhere on the ground to walk the traveller there.
* WASD or arrow keys also work. Shift to move faster.
* Click a person to walk up and open their drawer.
* Walking does not change the world and has no consequences. Only recorded actions do.
* A thin, calm text under the drawer reminds: "Walking is free. Actions are remembered."

### 10.2 The verb wheel (Take an action)
When the traveller is near a location, "Take an action" opens a radial wheel with the seven actions as hand drawn icons:

* Steal (strongly negative)
* Attack (strongly negative)
* Lie (negative)
* Help (positive)
* Donate (positive)
* Save (strongly positive)
* Trade (slightly positive, and a small note: "Too minor to spread")

After choosing a verb, show a short sentence builder inside a paper card:
"You [steal] [an iron sword] at [Brom's Forge]. [Brom] sees you."
Each bracket is a tap to change. Witnesses are shown as small portraits that can be toggled.

PROPOSED EXTENSION: witnesses are suggested by proximity, meaning people within a visible radius ring around the traveller are pre selected. The backend contract supports a witness list, but the current form only picks one. Until multi witness is verified, only allow a single witness in the UI.

The sentence is the primary summary. "Event weight" and other internals are in the Under the hood drawer.

### 10.3 Talking
Talking opens the drawer and a speech bubble above the character. Replies show a small chip: "Template reply" or "Live reply". The chip has a plain explanation tooltip. Replies must never narrate events that the character has not learned. If the player types about the theft to someone unaware, the response stays in their knowledge boundary, and a small notice explains that the character cannot know.

### 10.4 Let the town talk
The lantern button advances time by exactly one step. While loading, the button shows a rotating flame and is disabled. The world does not move until the result arrives.

### 10.5 Trace a story
Opens the evidence view (section 11). Disabled with a tooltip when no event exists: "Create an action first, then follow how people learn about it."

### 10.6 Free exploration
Full verb wheel and all locations remain available. Several events can exist. The Ledger lists them. Selecting a deed changes who is highlighted, which whispers are shown, and which knowledge note each character displays. Overall attitude still reflects all known events.

### 10.7 Selected event model
PROPOSED EXTENSION: add an explicit event picker (the Ledger). The current page uses a simplified latest event selection. Do not imply otherwise.

---

## 11. THE EVIDENCE VIEW (WHY)

The strongest moment of the product, treated like a detective board made of paper.

### 11.1 How did they know? (knowledge path)
* Camera glides along the route.
* A gold thread draws from origin to witness to listeners.
* Each stop shows a small card: name, how they learned, confidence in mono type.
* A ledger page lists the same in sentences.
* A toggle reveals arithmetic.
* Direct witness: "Brom saw this happen himself. No gossip chain was needed."
* Unaware: "Garrick has not learned about this event yet."

### 11.2 Why do they feel this way? (attitude breakdown)
A second, differently styled card (cream paper, a balance scale icon) lists the deeds influencing the attitude, each with a direction and a plain sentence: "He heard that you stole an iron sword. He trusts Mira, and theft matters strongly to him." Positive events appear with green ribbons, negative with red. Detailed scores are in the expandable Under the hood area.

These two views are linked (click a deed to see its path) but never merged.

---

## 12. TWO TRAVELLERS: PLAYER A AND PLAYER B

Presented as two paper tags on a hook at the top right, labelled "Traveller A" and "Traveller B". Selecting the other tag causes a gentle page turn animation and loads that save's version of the same diorama.

* Helper text: "Same town, separate history. Actions in one save do not affect the other."
* Traveller B starts with neutral villagers, a clean Ledger, a white lantern.
* Returning to A restores the earlier consequences.
* After the Arrival tour, a prompt invites the player to try B: "Does everyone inherit your reputation?"
* Do not show both travellers in the same town at once. They are separate saves, not multiplayer.
* The save is tied to this browser. Do not claim cloud accounts.

Reset: lives inside the traveller tag menu. It is a secondary action with a confirm dialog naming exactly which save is affected: "Reset story A? This removes its actions, memories and reputation changes." The confirm button is red and labelled with the save name.

Persistence note: world events, knowledge and reputation survive reload. Visible chat does not fully return, so never promise otherwise. After a reload, replay a quick, silent "settle" animation that positions characters according to their stored attitude and knowledge tags, with the Narrator strip saying "Welcome back. Hollowbrook remembers."

---

## 13. EMPTY, LOADING AND FAILURE STATES

All of these are shown in the world, not in a modal.

* **No actions yet**: Ledger shows a blank page with "Your story has not started. Take an action to give the town something to remember."
* **Selected person unaware**: sleeping eye and "Nobody has told Garrick about this yet."
* **Direct witness**: gold eye and "Brom saw it happen."
* **No gossip this turn**: "No new rumours spread this turn." A calm lantern pulse.
* **No chat yet**: placeholder "Ask Mira what she has heard about you."
* **No event to trace**: disabled trace button with tooltip.
* **Other save untouched**: "This traveller has a clean history."
* **Loading town**: paper skeleton silhouettes of buildings and tiny grey puppets with a message "Setting up Hollowbrook."
* **Town failed to load**: the paper town folded flat with a retry button and "We could not load your town. Try again."
* **Action write uncertain**: values preserved, no auto retry, to avoid duplicate events.
* **Chat waiting**: character shows a thinking loop and caption "Garrick is responding."
* **Offline**: calm banner "You are offline. Your last confirmed story is still here."

---

## 14. VISUAL SYSTEM

### 14.1 Direction
Warm dusk storybook. Lantern light on layered paper. Not a dark console. Technical details are available but live in a clearly different, quieter area (Under the hood).

### 14.2 Colour tokens (camelCase names, no hyphens)
Backgrounds and paper:
* skyDeep: #1B1E3F
* skyMid: #3A3563
* skyGlow: #F2A65A
* paperCream: #F4E9D2
* paperShade: #D9C9A6
* inkBlack: #1C1A24
* woodBrown: #5A3E2B

Meaning colours (kept from the old system on purpose):
* provenanceGold: #E8C46A (eye marks, origin, gold thread only)
* whisperBlue: #8FA2FF (whispers, information in motion)
* primaryBlue: #3150E9 (primary button fill)
* harmRed: #FF5C6C
* helpGreen: #4ADE9A

Attitude lantern colours:
* hostile: #FF5C6C
* wary: #FFA35C
* neutral: #F4E9D2
* friendly: #4ADE9A
* devoted: #3DD6EB

Faction accent rings (small): townsfolk #7DD3FC, guard #B79CFF, merchants #5EEAD4.

Contrast: all text on paper uses inkBlack. Text on sky uses paperCream. Every colour signal is paired with an icon or text.

### 14.3 Typography
* Display: Instrument Serif, with one italic word per headline.
* UI: Geist.
* Real numbers, ids and trace rows: Geist Mono, tabular numerals.
* Handwritten accents (ledger lines, narrator caption): a handwriting face such as Caveat or Kalam, used only for in world paper text and only at 18 px or larger.
* Sentence case. No all caps except tiny eyebrow labels.

### 14.4 Shape and material
* Paper cutouts have a 2 px lighter edge on top and a soft 6 px drop shadow beneath.
* Buttons look like small brass or leather tags.
* Brass frames and rivets for the dock only.
* Corner radii: 12 px on controls, 20 px on drawers.

### 14.5 Light
* Each lantern is a soft radial light layer (additive blend).
* Light flickers slowly at 2 to 4 percent intensity, never strobing.
* Lights are the main tool for pulling attention: dim the unfocused part of the world to 70 percent and lift the focus point.

### 14.6 Motion rules
* Durations: 120 ms press feedback, 200 ms small UI, 320 ms drawers, 400 to 700 ms camera moves, up to 1.6 s whisper flights.
* Easing: cubic bezier 0.22, 1, 0.36, 1 for UI, ease in out for camera.
* Never animate with an unlisted property or a looping flourish that implies a confirmed event.
* Reduced motion: no parallax, camera cuts instead of glides, whispers appear as a short highlighted line, no particles, no flicker.
* Press scale 0.96 on buttons.

### 14.7 Audio (optional but recommended)
* Ambient: soft crickets, distant anvil, muffled tavern chatter, low wind. Gentle.
* Deed recorded: a single low wooden thump and stamp sound.
* Whisper: a breathy paper rustle with a tiny rising chime.
* Smudged whisper (lower confidence): the same sound but quieter and more filtered.
* Attitude change: a short warm chord for positive, a muted low chord for negative.
* Nothing loud, nothing looping on UI controls.
* Master mute button always visible, default muted on first visit until the user presses "Step into Hollowbrook".

---

## 15. ACCESSIBILITY

* Every beat has a plain text equivalent in a live region (the Narrator strip).
* Full keyboard play: Tab cycles through people and buttons, Enter interacts, Space advances time when the dock is focused, Escape closes drawers, arrow keys move the traveller.
* Focus rings: 2 px whisperBlue with 2 px offset.
* Hit areas at least 44 by 44 px.
* Colour is never alone: attitude has face, text and icon; confidence has ink, number and word.
* Text size can be increased, and the world supports 200 percent zoom.
* A "Story mode as text" toggle presents the entire experience as a readable log with the same buttons.
* Dyslexia friendly option replaces handwriting font with Geist.

---

## 16. UNDER THE HOOD (for judges and developers)

A hidden drawer opened from the bottom right, styled as a brass plate over a dark, quiet panel (this is the only area where the old developer look survives).

Contains:
* Trace of engine calls with query ids and timing.
* The graph view of people, events and relationships (trust, gossip, knowledge) with a legend.
* Confidence calculations and attitude scores.
* Event weight values.
* Dialogue source (template fallback or live model) and firewall results.
* Comparison view: an NPC given the whole log versus one limited to its own memories, reporting actual outcomes only. With templates active, it must not promise a dramatic leak.
* Save management.

This area is never shown during the Arrival.

---

## 17. TECHNICAL APPROACH

### 17.1 Recommended stack
* **Rendering**: Phaser 3 or PixiJS, mounted inside the existing Next.js app as a client only component.
* **Character animation**: Spine or DragonBones skeletons for the four characters (or sprite sheets if tooling is limited).
* **UI overlay**: regular React components absolutely positioned over the canvas for drawers, dock and text, so accessibility and focus work normally.
* **State**: one store (for example Zustand) that holds the backend snapshot. The canvas only reads state and a queue of "confirmed beats".
* **Pathfinding**: a simple navmesh or grid with three waypoints per location.

### 17.2 Data flow
1. User triggers an action in the UI.
2. UI calls the existing backend endpoint (record event, chat, advance time, why).
3. On success, response is normalised into a **beat queue**: an ordered list of story beats such as Deed(forge, witnessBrom), Whisper(Brom to Mira, 90), AttitudeChange(Mira, wary).
4. The world director plays beats one at a time and updates the Narrator strip.
5. Store holds the final snapshot so a reload just sets positions and tags instantly.

### 17.3 Rules for the director
* The director never plays a beat that is not in the response.
* Ambient behaviour may not use speech marks, moths, eye marks or lantern colour changes.
* If the user triggers another action during a beat sequence, queue it and show "Hollowbrook is still talking."

### 17.4 Performance targets
* 60 fps on a mid range laptop, 30 fps on a mid range phone.
* Total initial asset payload under 6 MB, with characters lazy loaded after the first frame.
* Atlas packing for all props and UI paper pieces.
* Offscreen layers paused.

### 17.5 Responsive
* Desktop: full diorama with drawers on the right.
* Tablet: drawers become bottom sheets.
* Phone: the diorama scrolls horizontally with a minimap strip of three icons (Forge, Kettle, Barracks), drawers are full height sheets, and the dock becomes three large buttons at the bottom.

---

## 18. ASSET LIST AND GENERATION INSTRUCTIONS

Style prompt to prepend to every image generation request:
"Layered paper cutout diorama art, handcrafted storybook style, soft drop shadows between layers, visible paper texture, warm lantern light against indigo dusk, chunky friendly shapes, slightly oversized heads, consistent lighting from the upper left, flat colour with subtle grain, no text, transparent background where noted."

### 18.1 Generated 2D images (required)

Backgrounds, each at 3200 by 1200 unless noted, PNG, separate layers with transparency:
1. **sky_dusk.png**, indigo to amber gradient, moon, paper stars. (opaque)
2. **hills_far.png**, silhouette hills with lit windows.
3. **hills_mid.png**, mid hills with small cottages.
4. **forge_building.png**, Brom's forge with open front, furnace glow, weapon rack, anvil, hanging tools. 1000 by 800.
5. **inn_building.png**, The Copper Kettle, big warm windows, outdoor tables, copper kettle sign. 1000 by 800.
6. **barracks_building.png**, stone barracks with banner, training dummy, heavy gate. 1000 by 800.
7. **road_square.png**, cobbled road, well, notice board, fence, trees. 3200 by 400.
8. **foreground_paper.png**, hanging lanterns, leaves, fence posts. 3200 by 400, with transparency.

Characters (generate as separated body parts for rigging, each on transparent background, front facing and side facing, 1024 px tall reference, same lighting):
9. **traveller_parts**: hood, head, torso, two arms, two legs, satchel, lantern.
10. **brom_parts**, **mira_parts**, **garrick_parts**, with matching sets.
11. **expressions_sheet** per character: five faces (hostile, wary, neutral, friendly, devoted) plus notice and speak mouths, as a 4 by 2 grid.

Props and UI paper pieces (512 px or less, transparent):
12. **sword_iron.png**, **satchel_sword.png**, **deed_card_harm.png**, **deed_card_help.png**, **wax_stamp.png**.
13. **whisper_moth.png** (3 frames), **whisper_note_crisp.png**, **whisper_note_smudged.png**, **seal_gold.png**, **seal_blue.png**, **seal_faded.png**.
14. **eye_gold.png**, **eye_sleeping.png**.
15. **ledger_book.png**, **paper_tag.png** (for A and B), **brass_dock_frame.png**, **lantern_icons** for five attitudes.
16. **footprints_gold.png** for the invitation hint.
17. **verb_wheel_icons**: seven hand drawn icons (steal, attack, lie, help, donate, save, trade), 128 by 128 each.

### 18.2 Optional 3D pass
If the team wants extra polish, build the town as a low poly 3D paper diorama in Blender (or Spline), using flat shaded, slightly rounded geometry with paper textures. Render the following from a fixed three quarter camera as 2D PNG layers rather than running 3D in the browser:
* The three buildings as separate layers with baked ambient occlusion and lantern light.
* One hero establishing shot for the landing hero.
* Optional soft depth maps (grayscale) for each layer, used by the engine for gentle parallax depth.
Keep the browser experience fully 2D. No realtime 3D is required.

### 18.3 Files to deliver
* Layered source (Figma or PSD or Blender)
* Exported atlas JSON and PNG
* Spine or DragonBones rigs and animation exports
* Audio pack (WAV and OGG)
* Style guide page showing every state of every component

---

## 19. SCREENS THE DESIGNER MUST DELIVER

1. First load: dusk diorama with title and tag.
2. Footprint hint and "Step into Hollowbrook".
3. Arrival walk in and neutral lantern.
4. Prepared sword action card.
5. Deed confirmed: Brom noticing, others with sleeping eyes.
6. Garrick selected before gossip.
7. First turn: whisper to Mira, 90 percent note.
8. Second turn: whisper to Garrick, 63 percent smudged note.
9. Quiet turn: no new rumours.
10. How did he find out: gold thread and ledger page.
11. Why is he wary: attitude breakdown.
12. Reveal headline and next options.
13. Free exploration with verb wheel open.
14. Several deeds in the Ledger with selection context.
15. Several memories contributing to one attitude.
16. Traveller B clean history versus A.
17. Reset confirmation naming the save.
18. Loading, failure, offline and uncertain write states.
19. Bonds lens and Whispers lens.
20. Under the hood drawer open.
21. Mobile versions of 5, 8, 10 and 13.
22. Reduced motion version of 7 and 10.

---

## 20. BOUNDARIES (DO NOT OVERPROMISE)

Present and real:
* Three villagers, three locations.
* Events recorded through an action.
* Gossip along directional trust, one hop per turn, confidence multiplying and falling.
* Opinions from multiple events.
* Separate saves A and B.
* Chat limited to a character's knowledge, currently using template replies.

Not present, so never imply them:
* Stealth, guards chasing, arrests, punishments.
* Inventory, money, quests, rewards, score or win screen.
* Secret keeping or choosing who tells.
* Stories that mutate as they spread.
* A day and night cycle or a literal calendar.
* Cloud accounts or cross device sync.
* Players sharing one town.
* Richly generated dialogue, until live dialogue is verified.

The walking, waving and wandering are presentation. They exist to make the engine feel alive, not to add gameplay.

---

## 21. SUCCESS TEST

Give a new person the screen with no explanation. Within a minute they should be able to say:

"I did something. Somebody saw it. Then people told each other, and their opinion of me changed. I can follow the whisper to see who told them."

Then they should be able to:
1. Start the sword story without help.
2. Point out who saw it and who has not heard.
3. Explain why they pressed Let the town talk.
4. Notice who just learned something.
5. Say why Garrick's attitude changed.
6. Open the evidence chain and read it aloud.
7. Switch to Traveller B and describe why it is different.
8. Explain, without prompting, that typing into chat does not create a deed.

The one line the whole design is trying to deliver:

**You stole the sword. Brom saw you. Mira heard about it. Now Garrick is wary. Here is how he found out.**
