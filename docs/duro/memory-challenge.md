# Visible memory and the trust race

Town / Memory graph switches between the walking town and an inspectable projection
of the current player's real FalkorDB snapshot. Select a deed to see its KNOWS and
TOLD edges, confidence labels and direct witnesses. Trust links are optional.
Selecting a node only inspects it; Talk explicitly approaches the villager.
Follow this memory calls the existing explain tool and highlights its recorded IDs.
The graph has a text alternative and respects reduced motion.

The objective is to steal the forge sword and make Garrick friendly before he
learns that theft. Start challenge creates a separate player graph; free-play A/B
remain available. Everyone nearby witnesses actions. Gossip continues on the
existing automatic town clock and pauses during reading or action forms.
The outcome derives from Garrick's actual attitude and target-event memories.
Theft knowledge takes precedence over friendliness. Terminal outcomes stop the
challenge clock. Local storage keeps only the challenge player and target event,
so reloading reconstructs progress from the graph. No scoring or inventory exists.

Real FalkorDB integration tests cover winning through a witnessed helpful deed,
losing through Brom → Mira → Garrick, explain edge IDs, reload and isolation.
Styleguide specimens cover empty/known/unaware memory and every challenge stage.

Browser checks confirmed a new challenge, the fixed sword action with Brom as
the nearby witness, one automatic gossip round (three handoffs), walking to
Garrick, a helpful deed producing a friendly attitude and Trust earned, then
the same result after reload. The inline explain displayed Brom → Mira.
Typecheck, design guard and production build pass. The build retains the existing
seed-loader dynamic-filesystem tracing warning.

Browser capture recovered on October 18. The 1440×900 graph screenshot is saved
at screens/memory-challenge-desktop.png; the inspector and live explain path
are readable alongside the graph.
