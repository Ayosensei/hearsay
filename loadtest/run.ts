import { randomUUID } from "node:crypto";
import { cpus, totalmem, platform, release } from "node:os";
import { performance } from "node:perf_hooks";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { connectDatabase, createHearsay } from "../packages/hearsay/src/index";
import type {
  Envelope,
  ToolInput,
  ToolName,
} from "../packages/contract/src/index";
import { summarize, display } from "./stats";
import type { Sample } from "./stats";

process.env.HEARSAY_LLM = "off";
function option(name: string, fallback: string) {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : (process.argv[index + 1] ?? "");
}
const sizes = option("--players", "10,50,100").split(",").map(Number);
const concurrency = Number(option("--concurrency", "5"));
if (
  !sizes.length ||
  sizes.some((n) => !Number.isInteger(n) || n < 1 || n > 1000) ||
  !Number.isInteger(concurrency) ||
  concurrency < 1 ||
  concurrency > 50
)
  throw new Error("Use 1..1000 players and 1..50 concurrent players.");
function take<T>(result: Envelope<T>): T {
  if (!result.ok) throw new Error(result.error.code);
  return result.data;
}
const docker =
  process.env.DOCKER_BIN ??
  (process.platform === "win32" && process.env.LOCALAPPDATA
    ? join(
        process.env.LOCALAPPDATA,
        "Programs",
        "DockerDesktop",
        "resources",
        "bin",
        "docker.exe",
      )
    : "docker");
let dockerResources: unknown = "unavailable";
try {
  if (docker === "docker" || existsSync(docker))
    dockerResources = JSON.parse(
      execFileSync(
        docker,
        [
          "info",
          "--format",
          '{"cpus":{{.NCPU}},"memoryBytes":{{.MemTotal}},"version":"{{.ServerVersion}}"}',
        ],
        { encoding: "utf8", timeout: 15_000 },
      ),
    );
} catch {
  /* Report unavailable rather than assume resource limits. */
}
const machine = {
  cpu: cpus()[0]?.model,
  logicalCpus: cpus().length,
  ramBytes: totalmem(),
  os: `${platform()} ${release()}`,
  node: process.version,
  docker: dockerResources,
};
const db = take(await connectDatabase());
const batches = [];
try {
  for (const players of sizes) {
    const runId = randomUUID().replaceAll("-", "");
    const templateGraph = `load_template_${runId}`;
    const client = createHearsay(db, { templateGraph });
    const ids = Array.from(
      { length: players },
      (_, i) => `load_${runId.slice(0, 16)}_${i}`,
    );
    const samples: Sample[] = [];
    let cleanupErrors = 0;
    try {
      take(await client.ensureWorld());
      const world = take(await client.call("getWorld", {}));
      async function measured<N extends ToolName>(
        kind: Sample["kind"],
        name: N,
        input: ToolInput<N>,
      ) {
        const start = performance.now();
        const result = await client.call(name, input);
        samples.push({
          tool: name,
          kind,
          ms: performance.now() - start,
          ok: result.ok,
          ...(!result.ok ? { error: result.error.code } : {}),
          copyAttempts: result.trace
            .filter((t) => t.queryId === "Q01_graph_copy")
            .reduce((n, t) => n + Number(t.args.attempts ?? 1), 0),
        });
        return result.ok ? result.data : null;
      }
      let next = 0;
      const started = performance.now();
      await Promise.all(
        Array.from({ length: Math.min(players, concurrency) }, async () => {
          while (next < players) {
            const playerId = ids[next++];
            if (!playerId) continue;
            if (!(await measured("write", "newPlayer", { playerId }))) continue;
            if (
              !(await measured("write", "recordEvent", {
                playerId,
                type: "stole",
                placeId: "forge",
                witnesses: ["brom"],
                subject: "iron sword",
              }))
            )
              continue;
            for (let i = 0; i < 3; i++)
              if (!(await measured("write", "advanceTime", { playerId })))
                break;
            await measured("read", "recall", { playerId, npcId: "garrick" });
            await measured("read", "attitude", { playerId, npcId: "garrick" });
            await measured("read", "snapshot", { playerId });
          }
        }),
      );
      const seconds = (performance.now() - started) / 1000;
      const summaries = (["read", "write"] as const).map((kind) =>
        summarize(samples, seconds, kind),
      );
      batches.push({
        players,
        concurrency,
        seconds,
        npcCount: world.npcs.length,
        summaries,
        samples,
        cleanupErrors,
      });
      console.table(
        summaries.map((s) => ({
          players,
          concurrency,
          ...s,
          successPerSecond: display(s.successPerSecond),
          p50: display(s.p50),
          p95: display(s.p95),
          p99: display(s.p99),
        })),
      );
    } finally {
      const existing = take(await db.list());
      for (const graph of [...ids.map((id) => `player:${id}`), templateGraph])
        if (existing.includes(graph)) {
          if (
            !graph.startsWith(`player:load_${runId.slice(0, 16)}_`) &&
            graph !== templateGraph
          )
            throw new Error("Unexpected cleanup target");
          if (!(await db.delete(graph)).ok) cleanupErrors++;
        }
      const last = batches.at(-1);
      if (last?.players === players) last.cleanupErrors = cleanupErrors;
    }
  }
} finally {
  take(await db.close());
}
const report = {
  at: new Date().toISOString(),
  machine,
  configuration: {
    llm: "off",
    ticks: 3,
    seed: "default production seed",
    warmup: "none; template preparation excluded",
    latency: "API envelope end-to-end, all attempted successes and failures",
    throughput: "successful category operations / entire batch wall time",
    cleanup: "excluded from timed batch",
  },
  batches,
};
await mkdir(new URL("./", import.meta.url), { recursive: true });
await writeFile(
  new URL("./results.json", import.meta.url),
  JSON.stringify(report, null, 2) + "\n",
);
const lines = [
  "# Measured local load test",
  `\nRun: ${report.at}`,
  "\nHEARSAY_LLM=off. Raw samples and machine/resource details: [results.json](results.json).",
  `\nCPU: ${machine.cpu}; logical CPUs: ${machine.logicalCpus}; RAM bytes: ${machine.ramBytes}; OS: ${machine.os}; Node: ${machine.node}.`,
  `\nDocker: ${JSON.stringify(machine.docker)}`,
  "\n| Players | Concurrent players | NPCs | Kind | Attempts | Successes | Errors | Success ops/s | p50 ms | p95 ms | p99 ms |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
];
for (const batch of batches)
  for (const s of batch.summaries)
    lines.push(
      `| ${batch.players} | ${batch.concurrency} | ${batch.npcCount} | ${s.kind} | ${s.attempts} | ${s.successes} | ${s.errors} | ${display(s.successPerSecond)} | ${display(s.p50)} | ${display(s.p95)} | ${display(s.p99)} |`,
    );
lines.push(
  "\nPercentiles use nearest rank on all attempted operations, including failures. Displayed numbers are truncated to three decimals; raw milliseconds are preserved. Successful ops/s uses the whole batch duration for each category, not isolated read/write phases. No LLM calls or separate warmup. Template creation and cleanup are outside timing. Failed player setup skips dependent operations; error counts must be read alongside percentiles.",
  "\nThis is one run on the current three-NPC production stub, not a production capacity claim or proof for the final six-NPC town. Local Docker and the client share a machine. Background saves, graph-copy contention and client scheduling affect results. Writes include player graph copies. No retry hides general write failures; only explicit pre-copy fork rejection has bounded helper backoff.",
  `\nCleanup errors: ${batches.reduce((n, b) => n + b.cleanupErrors, 0)}. All benchmark graph names are unique and cleanup is restricted to the run's own graphs.`,
);
await writeFile(
  new URL("./results.md", import.meta.url),
  lines.join("\n") + "\n",
);
if (batches.some((b) => b.cleanupErrors || b.samples.some((s) => !s.ok)))
  process.exitCode = 1;
