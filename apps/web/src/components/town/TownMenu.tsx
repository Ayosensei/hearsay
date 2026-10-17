"use client";
import { Button } from "../ui/button";
import type { LivingTown } from "./use-living-town";

export function TownMenu({ game, lens, onLens }: {
  game: Pick<LivingTown, "active" | "offline" | "town" | "slot" | "eventId" | "switchSave" | "setDrawer" | "explain" | "reduced" | "setReduced" | "textMode" | "setTextMode" | "largeText" | "setLargeText">;
  lens: "none" | "bonds" | "whispers";
  onLens: (lens: "none" | "bonds" | "whispers") => void;
}) {
  const disabled = game.active || game.offline;
  return <div className="minimal-menu">
    <section><h3>Your traveller · Turn {game.town?.tick}</h3>
      <div className="save-buttons">{["a", "b"].map((slot) => <Button key={slot} variant="secondary" aria-pressed={game.slot === slot} disabled={disabled} onClick={() => game.switchSave(slot)}>Traveller {slot.toUpperCase()}</Button>)}</div>
      <p className="paper-caption">Expanded town · separate histories. Your earlier town saves are kept separately.</p>
    </section>
    <section><h3>Explore your story</h3>
      <Button variant="ghost" onClick={() => game.setDrawer("residents")}>Meet the villagers ({game.town?.npcs.length ?? 0})</Button>
      <Button variant="ghost" onClick={() => game.setDrawer("ledger")}>Your deeds</Button>
      <Button variant="ghost" disabled={disabled || !game.eventId} onClick={() => void game.explain()}>Trace the selected memory</Button>
    </section>
    <details><summary>View options</summary><section>
      <Button variant="secondary" aria-pressed={lens === "bonds"} onClick={() => onLens(lens === "bonds" ? "none" : "bonds")}>Bonds · who trusts whom</Button>
      <Button variant="secondary" aria-pressed={lens === "whispers"} onClick={() => onLens(lens === "whispers" ? "none" : "whispers")}>Whispers · confirmed routes</Button>
      <Button variant="ghost" onClick={() => game.setDrawer("engine")}>Under the hood</Button>
    </section></details>
    <details><summary>Accessibility</summary><section>
      <Button variant="secondary" aria-pressed={game.reduced} onClick={() => game.setReduced(!game.reduced)}>Reduced motion: {game.reduced ? "on" : "off"}</Button>
      <Button variant="secondary" aria-pressed={game.textMode} onClick={() => game.setTextMode(!game.textMode)}>Story as text: {game.textMode ? "on" : "off"}</Button>
      <Button variant="secondary" aria-pressed={game.largeText} onClick={() => game.setLargeText(!game.largeText)}>Larger text: {game.largeText ? "on" : "off"}</Button>
    </section></details>
    <details><summary>Start over</summary><section>
      <Button variant="secondary" disabled={disabled} onClick={() => game.setDrawer("replay")}>Replay the sword story</Button>
      <Button variant="ghost" disabled={disabled} onClick={() => game.setDrawer("reset")}>Reset story {game.slot.toUpperCase()}</Button>
      <p className="paper-caption">You’ll confirm before anything is cleared.</p>
    </section></details>
  </div>;
}
