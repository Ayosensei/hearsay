import { getHearsay } from "../../../server/hearsay";
import { ScenarioDirector } from "../../../server/scenario-director";
import type { ScenarioCommand } from "../../../server/scenario-director";
import type { HearsayClient } from "@hearsay/contract";
import { scenarioFromPlayer } from "../../../lib/scenarios";
import { isPuzzle } from "../../../lib/puzzle";
import { PuzzleDirector } from "../../../server/puzzle-director";
import type { PuzzleCommand } from "../../../server/puzzle-director";

function valid(value: unknown): value is PuzzleCommand {
  if (!value || typeof value !== "object" || !("playerId" in value) || typeof value.playerId !== "string" || !scenarioFromPlayer(value.playerId)) return false;
  if (!("action" in value) || typeof value.action !== "string" || !["inspect", "wait", "verdict", "choose", "ask", "speak", "accuse"].includes(value.action)) return false;
  for (const field of ["npcId", "eventId", "text", "conversationId"] as const) {
    const item = (value as Record<string, unknown>)[field];
    if (field in value && (typeof item !== "string" || item.length > (field === "text" ? 400 : 80))) return false;
  }
  if ("answer" in value) {
    const answer = value.answer;
    if (!answer || typeof answer !== "object" || !("witnessId" in answer) || typeof answer.witnessId !== "string" || answer.witnessId.length > 40 || !("account" in answer) || !["eyewitness", "secondhand", "unaware"].includes(String(answer.account)) || !("route" in answer) || !Array.isArray(answer.route) || answer.route.length > 13 || !answer.route.every((id: unknown) => typeof id === "string" && id.length <= 40)) return false;
  }
  if ("choiceId" in value && (typeof value.choiceId !== "string" || value.choiceId.length > 60)) return false;
  if ("position" in value) {
    const p = value.position;
    if (!p || typeof p !== "object" || !("x" in p) || !("y" in p) || !("district" in p)) return false;
    if (typeof p.x !== "number" || !Number.isFinite(p.x) || p.x < 0 || p.x > 1900 || typeof p.y !== "number" || !Number.isFinite(p.y) || p.y < 0 || p.y > 1000) return false;
    if (typeof p.district !== "string" || !["oldtown", "vale", "riverside"].includes(p.district)) return false;
  }
  return true;
}
const directors = new WeakMap<HearsayClient, ScenarioDirector>();
const puzzles = new WeakMap<HearsayClient, PuzzleDirector>();
export async function POST(request: Request) {
  const reply = (value: unknown) => Response.json(value, { headers: { "Cache-Control": "no-store" } });
  try {
    const command: unknown = await request.json();
    if (!valid(command)) return reply({ ok: false, error: { code: "BAD_ARGS", message: "Invalid scenario command." }, trace: [] });
    const client = await getHearsay();
    if (isPuzzle(command.playerId)) {
      let puzzle = puzzles.get(client);
      if (!puzzle) { puzzle = new PuzzleDirector(client); puzzles.set(client, puzzle); }
      return reply(await puzzle.execute(command));
    }
    if (!["inspect", "wait", "verdict", "choose"].includes(command.action)) return reply({ ok: false, error: { code: "BAD_ARGS", message: "This command requires a new puzzle save." }, trace: [] });
    let director = directors.get(client);
    if (!director) { director = new ScenarioDirector(client); directors.set(client, director); }
    return reply(await director.execute(command as ScenarioCommand));
  } catch {
    return reply({ ok: false, error: { code: "DB_UNAVAILABLE", message: "Could not load the scenario. Check the connection and inspect before retrying a choice." }, trace: [] });
  }
}
