"use client";
import { Button } from "../ui/button";
import { choicesFor, choiceBlocked, scenarioFromPlayer } from "../../lib/scenarios";
import { observeAt } from "../../lib/town-space";
import { homes } from "../../lib/town-residents";
import type { TownPosition } from "../../lib/town-space";
import type { TownState } from "../../lib/types";
import type { ToolInput } from "@hearsay/contract";

export function LocationChoices({ town, position, busy, error, onChoose, onFreeAction, onCustom, onInspect }: {
  town: TownState; position: TownPosition; busy: boolean; error: string;
  onChoose: (id: string) => void; onFreeAction: (input: ToolInput<"recordEvent">) => void;
  onCustom: () => void; onInspect: () => void;
}) {
  const nearby = observeAt(position, town), scenario = scenarioFromPlayer(town.playerId);
  const locals = scenario ? choicesFor(scenario, town.npcs).filter((choice) => {
    const home = homes[choice.npc];
    return home?.district === position.district && nearby.witnesses.some((npc) => npc.id === choice.npc);
  }) : [];
  return <section className="space-y-4" aria-label="Choices at your location"><p className="paper-eyebrow">{nearby.place?.name ?? "On the road"}</p><p>Within sight: <strong>{nearby.witnesses.map((npc) => npc.name).join(", ") || "nobody"}</strong>. Everyone nearby witnesses your choice.</p>
    {scenario && <p className="paper-caption">{town.puzzle ? `${town.puzzle.ap}/2 AP. A choice or refused request spends 1 AP. Two spent points end the turn and spread gossip. Social prerequisites must be discovered by asking.` : "Committing a choice spends one turn and spreads every eligible rumour one hop. You cannot repeat a completed choice."}</p>}
    {!nearby.witnesses.length && <p>Walk closer to a villager to find local choices.</p>}
    {scenario === "detective" && <p>Question villagers through their character cards. Detective mode does not create new deeds to influence the case.</p>}
    {locals.filter(() => scenario !== "detective").map((choice) => { const blocked = choiceBlocked(town, choice); return <article className="memory-paper space-y-3" key={choice.id}><h3 className="font-serif text-2xl">{choice.label}</h3><p>{choice.hint}</p>{blocked && <p className="paper-caption">{blocked}</p>}<Button disabled={busy || Boolean(blocked) || town.puzzle?.ap === 0} variant={choice.type === "stole" || choice.type === "attacked" || choice.type === "lied" ? "destructive" : "default"} onClick={() => onChoose(choice.id)}>{choice.label} · {town.puzzle ? "1 AP" : "1 turn"}</Button></article>; })}
    {!scenario && nearby.witnesses.length > 0 && ([{ type: "helped", label: "Help with local work", subject: "local work" }, { type: "donated", label: "Donate supplies here", subject: "supplies for the neighbourhood" }, { type: "stole", label: "Steal local supplies", subject: "local supplies" }] as const).map((choice) => <article className="memory-paper space-y-3" key={choice.type}><p>{choice.type === "stole" ? "A harmful memory. Nearby people may tell the guard." : "A helpful memory. Only people who learn it will change their opinion."}</p><Button disabled={busy || !nearby.place || nearby.witnesses.length > 6} variant={choice.type === "stole" ? "destructive" : "default"} onClick={() => onFreeAction({ playerId: town.playerId ?? "", type: choice.type, subject: choice.subject, placeId: nearby.place?.id ?? "", witnesses: nearby.witnesses.map((npc) => npc.id) })}>{choice.label}</Button></article>)}
    {error && <div role="alert"><p className="paper-error">{error}</p>{scenario && <Button variant="secondary" disabled={busy} onClick={onInspect}>Check saved story</Button>}</div>}
    {!scenario && <Button variant="ghost" disabled={busy} onClick={onCustom}>Other action at this location</Button>}
  </section>;
}
