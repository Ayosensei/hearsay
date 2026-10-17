import { ErrorBody, TOOLS, TraceStep } from "@hearsay/contract";
import type { Envelope, HearsayClient, ToolInput, ToolName, ToolOutput } from "@hearsay/contract";

export class HttpHearsay implements HearsayClient {
  constructor(private readonly endpoint = "/api/tool/", private readonly transport: typeof fetch = (...args) => fetch(...args)) {}

  async call<N extends ToolName>(name: N, input: ToolInput<N>): Promise<Envelope<ToolOutput<N>>> {
    const invalid = (code: "BAD_ARGS" | "INTERNAL" | "DB_UNAVAILABLE", message: string): Envelope<ToolOutput<N>> =>
      ({ ok: false, error: { code, message }, trace: [] });
    if (!TOOLS[name].input.safeParse(input).success) return invalid("BAD_ARGS", "Invalid tool arguments.");
    try {
      const response = await this.transport(this.endpoint + name, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input), cache: "no-store",
      });
      const wire: unknown = await response.json();
      if (!wire || typeof wire !== "object" || !("ok" in wire) || !("trace" in wire))
        return invalid("INTERNAL", "The server returned an invalid tool response.");
      const trace = TraceStep.array().parse(wire.trace);
      if (wire.ok === false && "error" in wire)
        return { ok: false, error: ErrorBody.parse(wire.error), trace };
      if (wire.ok !== true || !("data" in wire)) return invalid("INTERNAL", "Invalid tool response.");
      return { ok: true, data: TOOLS[name].output.parse(wire.data) as ToolOutput<N>, trace };
    } catch {
      return invalid("DB_UNAVAILABLE", "Cannot reach the Hearsay API. Check the server and retry.");
    }
  }
}
