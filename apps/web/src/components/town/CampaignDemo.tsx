"use client";
import { useState } from "react";
import { GameplayImage, type gameplayImages } from "../GameplayImage";
import { Button } from "../ui/button";
import "./campaign.css";

const steps = [
  { title: "Your choices leave a trail", text: "You are a traveller in a town that remembers. Each level gives you a problem to solve before a deadline. Watch this short example; Next plays the next move for you.", reply: "Silas: The floodgate is cracking. Help us before the storm.", ap: 2, turn: 0, scene: "🌊 Silas → a damaged floodgate", goal: "Protect Riverside before the storm.", focus: "objective" },
  { title: "Walk first, then talk", text: "Click a villager to walk over and open their chat. You can also use the district and villager menus. Walking costs no AP, but the real clock continues in a mission.", reply: "You walk to Silas. He can now hear your reply.", ap: 2, turn: 0, scene: "You → Silas · nearby at Riverside", goal: "Investigate the floodgate.", focus: "movement" },
  { title: "Choose a reply. Spend one action", text: "We choose “Let’s check the gate mechanism first.” Replies can perform deeds, reveal evidence, or ask for help. Everyone within sight witnesses a deed automatically. You never pick your witnesses.", reply: "Silas: The hinge is split. Oren will need this survey.", ap: 1, turn: 0, scene: "You → survey → Silas sees it", goal: "Survey found. Take the evidence to Oren.", focus: "AP" },
  { title: "Two actions make a turn", text: "We use our second AP to brief Oren. At zero AP, the town advances one turn and your two AP return. End turn does the same, but gives up unused AP. In a mission, a real minute also advances the clock.", reply: "Oren: I can design a brace. Bring trusted tools.", ap: 2, turn: 1, scene: "Silas → Oren · news begins travelling", goal: "Find tools and prepare a repair.", focus: "turn" },
  { title: "News travels through trust", text: "Gossip follows directed trust links in FalkorDB. If Garrick trusts Oren, Oren's account can reach him. Secondhand confidence weakens along the route. Someone's expression is a clue; their exact memories stay hidden until the ending.", reply: "Garrick: Oren told me you investigated the gate.", ap: 2, turn: 1, scene: "Silas ──→ Oren ──→ Garrick", goal: "Read reactions. Predict who will hear next.", focus: "gossip" },
  { title: "An easy choice can have a cost", text: "Brom refuses to lend tools until he trusts you. A refusal still costs AP. Helping him takes time; diverting the flood can sacrifice the market. Repairing, diverting water into the market, and evacuating lead to different losses. Some commitments close other routes.", reply: "Brom: Help with my work first. Then I'll lend the kit.", ap: 1, turn: 1, scene: "Help Brom  /  divert the flood  /  evacuate", goal: "Choose a route and accept its tradeoff.", focus: "choices" },
  { title: "Finish the whole objective", text: "A good deed alone may not finish a level. Check the mission title for your goal and who to visit. In Night Watch, close the watch with Garrick after saving people or securing the gate. A win unlocks the next level; a loss lets you retry. At the ending, reveal the graph to see what actually spread.", reply: "Demo complete. Your first real mission is Night Watch.", ap: 2, turn: 2, scene: "Objective met → ending revealed → next level", goal: "You are ready. The live clock starts when you begin a mission.", focus: "ending" },
];

const demoImages: (keyof typeof gameplayImages)[] = ["campaign", "conversation", "conversation", "gossip", "gossip", "conversation", "graph"];

export function CampaignDemo({ onComplete, onClose }: { onComplete: () => void; onClose: () => void }) {
  const [step, setStep] = useState(0), current = steps[step];
  return <section className="campaign-demo space-y-4" aria-label="Guided demo">
    <p className="paper-eyebrow">Demo · {step + 1} of {steps.length} · no running clock</p>
    <progress aria-label="Demo progress" value={step + 1} max={steps.length} />
    <h2 className="font-serif text-3xl">{current.title}</h2>
    <GameplayImage kind={demoImages[step]} priority={step === 0} />
    <div className="demo-stage" aria-label="Example game state">
      <div className="demo-meter"><strong>{current.ap}/2 AP</strong><span>Turn {current.turn} · example</span></div>
      <p className="demo-goal">{current.goal}</p>
      <p className="demo-route">{current.scene}</p>
      <p className="story-bubble" key={step}>{current.reply}</p>
    </div>
    <p role="status">{current.text}</p>
    <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>{step < steps.length - 1 ? <Button onClick={() => setStep(step + 1)}>Next · {steps[step + 1].focus}</Button> : <Button onClick={onComplete}>Finish demo · unlock Night Watch</Button>}<Button variant="ghost" onClick={onClose}>Return to campaign</Button></div>
    <p className="paper-caption">Screenshots show real missions; the practice dialogue and AP below each image are illustrative. Untimed guided practice. These moves do not change your saved town. Start a fresh mission afterward; an already running mission keeps its deadline.</p>
  </section>;
}
