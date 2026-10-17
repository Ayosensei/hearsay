export interface Sample {
  tool: string;
  kind: "read" | "write";
  ms: number;
  ok: boolean;
  error?: string;
  copyAttempts: number;
}
export function percentile(values: number[], p: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(p * sorted.length) - 1)] ?? null;
}
// Truncate display precision so the report never rounds measured performance upward.
export const display = (n: number | null) =>
  n === null ? "n/a" : (Math.floor(n * 1000) / 1000).toFixed(3);
export function summarize(
  samples: Sample[],
  seconds: number,
  kind: Sample["kind"],
) {
  const rows = samples.filter((s) => s.kind === kind);
  const times = rows.map((s) => s.ms);
  return {
    kind,
    attempts: rows.length,
    successes: rows.filter((s) => s.ok).length,
    errors: rows.filter((s) => !s.ok).length,
    successPerSecond: rows.filter((s) => s.ok).length / seconds,
    p50: percentile(times, 0.5),
    p95: percentile(times, 0.95),
    p99: percentile(times, 0.99),
  };
}
