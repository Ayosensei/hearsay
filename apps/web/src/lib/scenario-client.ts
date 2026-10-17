import type { TownState, ToolEnvelope } from "./types";
import type { PuzzleCommand } from "../server/puzzle-director";

export async function runScenario(command: PuzzleCommand): Promise<ToolEnvelope<TownState>> {
  try {
    const response = await fetch("/api/scenario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(command) });
    if (!response.ok) return { ok: false, error: { code: "INTERNAL", message: "Scenario request failed. Inspect your story before retrying a choice." }, trace: [] };
    return await response.json() as ToolEnvelope<TownState>;
  } catch {
    return { ok: false, error: { code: "DB_UNAVAILABLE", message: "Connection interrupted. A choice may already be saved. Inspect the story before deciding again." }, trace: [] };
  }
}
