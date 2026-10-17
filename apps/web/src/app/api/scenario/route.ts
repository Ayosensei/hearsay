import { getHearsay } from "../../../server/hearsay";
import { ScenarioDirector } from "../../../server/scenario-director";
import type { ScenarioCommand } from "../../../server/scenario-director";
import type { HearsayClient } from "@hearsay/contract";

function valid(value: unknown): value is ScenarioCommand {
  if (!value || typeof value !== "object" || !("playerId" in value) || typeof value.playerId !== "string" || !/^quest_(medicine|feud|watch)_[a-z0-9]{20}$/.test(value.playerId)) return false;
  if (!("action" in value) || typeof value.action !== "string" || !["inspect", "wait", "verdict", "choose"].includes(value.action)) return false;
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
export async function POST(request: Request) {
  const reply = (value: unknown) => Response.json(value, { headers: { "Cache-Control": "no-store" } });
  try {
    const command: unknown = await request.json();
    if (!valid(command)) return reply({ ok: false, error: { code: "BAD_ARGS", message: "Invalid scenario command." }, trace: [] });
    const client = await getHearsay();
    let director = directors.get(client);
    if (!director) { director = new ScenarioDirector(client); directors.set(client, director); }
    return reply(await director.execute(command));
  } catch {
    return reply({ ok: false, error: { code: "DB_UNAVAILABLE", message: "Could not load the scenario. Check the connection and inspect before retrying a choice." }, trace: [] });
  }
}
