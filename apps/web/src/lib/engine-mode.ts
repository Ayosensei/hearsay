/**
 * Which engine the UI is talking to. Labels read this so the app never claims
 * FalkorDB latency or queries while it is running on the local mock.
 * Flip to "live" when packages/hearsay is wired into hearsay-client.ts.
 */
export type EngineMode = "mock" | "live";

// Cast keeps the type wide; otherwise TS narrows to "mock" and flags the isLive comparison.
export const ENGINE_MODE: EngineMode = process.env.NEXT_PUBLIC_HEARSAY_MODE === "mock" ? "mock" : "live";

export const isLive = ENGINE_MODE === "live";
