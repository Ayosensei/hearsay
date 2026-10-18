import { describe, expect, it } from "vitest";
import { watchGuidance } from "../watch-guidance";

const next = (flags: string[], tick = 0) => watchGuidance(flags, tick).find((step) => !step.done);

describe("Night Watch objective guidance", () => {
  it("directs a beginner through preparation, a settling turn, and the final report", () => {
    expect(next([])?.npc).toBe("silas");
    expect(next(["survey"])?.key).toBe("tool-work");
    expect(next(["survey", "tools"])?.key).toBe("brief");
    const prepared = ["survey", "tools", "brief", "brace", "return-tools"];
    expect(next(prepared)?.key).toBe("brace-ready");
    expect(next([...prepared, "brace-ready"])?.key).toBe("seal");
    expect(next([...prepared, "brace-ready", "seal"], 5)?.key).toBe("report");
  });
  it("recovers from the longer pressure investigation without requesting the excluded survey", () => {
    const steps = watchGuidance(["waterline"], 0);
    expect(next(["waterline"])?.key).toBe("compare-level");
    expect(steps.some((step) => step.key === "survey")).toBe(false);
    expect(next(["waterline", "survey"])?.key).toBe("tool-work");
  });
  it("replaces expired repairs and chosen sacrifices with achievable remaining goals", () => {
    expect(next(["survey", "brace"], 5)?.key).toBe("evacuate");
    expect(next(["evacuate"])?.key).toBe("boats");
    expect(next(["evacuate", "boats"])?.key).toBe("report");
    expect(next(["divert"], 5)?.key).toBe("warn-market");
    expect(next(["divert", "warn-market"], 5)?.key).toBe("report");
  });
});
