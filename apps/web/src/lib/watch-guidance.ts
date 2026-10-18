import { missions } from "./mission-catalog";

export interface WatchStep { key: string; text: string; npc?: string; reply?: string; done: boolean }

// Follow the route the player actually committed to, including the longer survey.
export function watchGuidance(flags: string[], tick: number): WatchStep[] {
  const has = (key: string) => flags.includes(key);
  const choice = (key: string, text: string, done = has(key)): WatchStep => {
    const option = missions.watch.choices.find((item) => item.key === key)!;
    return { key, text, npc: option.npc, reply: option.label, done };
  };
  const report = choice("report", "Visit Garrick at the Guard Barracks in Old Town. Give your final report to finish the level.");
  if (has("evacuate") || (tick >= 5 && !has("seal") && !has("divert"))) return [
    choice("evacuate", "Visit Sister Ayla at the Riverside chapel. Ask her to shelter the residents. Repairing is no longer an option after bell five; evacuation saves lives but loses homes."),
    choice("boats", "Return to Silas at the River docks. Ask him to bring the remaining residents to the chapel."), report,
  ];
  if (has("divert")) return [
    choice("divert", "You opened the relief channel. Homes are protected, but the market will flood."),
    choice("warn-market", "Visit Marta at the Riverside butchery and warn her to move the stock."), report,
  ];
  const survey = has("waterline") ? [
    choice("waterline", "You checked the water pressure. This route needs one extra comparison before the survey is usable."),
    choice("compare-level", "Visit Oren at the Workshop in Vale Lane. Compare the pressure and hinge readings.", has("survey")),
  ] : [choice("survey", "Visit Silas at the River docks in Riverside. Check the gate mechanism to collect the damage survey.")];
  return [...survey,
    choice("tool-work", "Visit Brom at the Forge in Old Town. Help him first so he trusts you with his tools.", has("tool-work") || has("tools")),
    choice("tools", "Stay with Brom and ask for the floodgate repair kit. Helping him does not automatically give you the kit."),
    choice("brief", "Visit Oren at the Workshop in Vale Lane. Ask him to study Silas's survey and prepare the brace."),
    choice("brace", "Return to Silas. Fit Oren's brace before bell five. This commits you to repairing rather than diverting water."),
    choice("return-tools", "Return the borrowed kit to Brom while the brace settles. You must give it back before the final report."),
    { key: "brace-ready", text: "Let one turn pass after fitting the brace. Returning the kit may already advance the turn. If it has not, use End turn · let town talk once. Avoid extra waits: sealing must happen before bell five.", done: has("brace-ready") },
    choice("seal", "Return to Silas and seal the repaired gate before bell five. The brace must have settled first."), report,
  ];
}
