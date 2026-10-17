import { afterEach, expect, it, vi } from "vitest";
import { createLlm } from "./llm";
const input = {
  system: "Only use known events.",
  messages: [{ role: "user" as const, text: "Hello" }],
};
const reply = { reply: "Good day.", referencedEventIds: [] };
const wire = () =>
  Response.json({
    candidates: [
      {
        finishReason: "STOP",
        content: { parts: [{ text: JSON.stringify(reply) }] },
      },
    ],
  });
afterEach(() => {
  vi.unstubAllEnvs();
});
const options = () => {
  vi.stubEnv("HEARSAY_LLM", "live");
  return {
    apiKey: "synthetic-test-credential",
    model: "test-model",
    mode: "live" as const,
  };
};

it("uses the configured REST model/header/JSON shape and caches only identical prompts for 60 seconds", async () => {
  let now = 0;
  const transport = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => wire());
  const llm = createLlm({ ...options(), transport, now: () => now });
  expect(await llm.generate(input)).toEqual({
    ok: true,
    data: reply,
    cached: false,
  });
  expect(await llm.generate(input)).toEqual({
    ok: true,
    data: reply,
    cached: true,
  });
  expect(transport).toHaveBeenCalledTimes(1);
  expect(transport.mock.calls[0]?.[0]).toBe(
    "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent",
  );
  const request = transport.mock.calls[0]?.[1];
  expect(request?.headers).toMatchObject({
    "x-goog-api-key": "synthetic-test-credential",
  });
  expect(JSON.parse(String(request?.body))).toMatchObject({
    systemInstruction: { parts: [{ text: input.system }] },
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });
  now = 60_001;
  await llm.generate(input);
  await llm.generate({ ...input, system: "Stricter prompt" });
  expect(transport).toHaveBeenCalledTimes(3);
});
it("retries a server error once and backs off exponentially with jitter for two 429 retries", async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response("", { status: 503 }))
    .mockImplementation(async () => wire());
  expect(
    (await createLlm({ ...options(), transport }).generate(input)).ok,
  ).toBe(true);
  expect(transport).toHaveBeenCalledTimes(2);
  const sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue();
  const rate = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response("", { status: 429 }))
    .mockResolvedValueOnce(new Response("", { status: 429 }))
    .mockImplementation(async () => wire());
  expect(
    (
      await createLlm({
        ...options(),
        transport: rate,
        sleep,
        random: () => 0.5,
      }).generate(input)
    ).ok,
  ).toBe(true);
  expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([625, 1125]);
});
it("returns typed failures for repeated server errors, 4xx, malformed JSON and blocked candidates", async () => {
  for (const response of [
    () => new Response("", { status: 503 }),
    () => new Response("", { status: 401 }),
    () => Response.json({ candidates: [] }),
    () =>
      Response.json({
        candidates: [{ finishReason: "SAFETY", content: { parts: [] } }],
      }),
    () =>
      Response.json({
        candidates: [{ content: { parts: [{ text: "not json" }] } }],
      }),
  ]) {
    const transport = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => response());
    expect(
      await createLlm({ ...options(), transport }).generate(input),
    ).toMatchObject({ ok: false, error: { code: "LLM_UNAVAILABLE" } });
    expect(transport.mock.calls.length).toBeLessThanOrEqual(2);
  }
});
it("times out even if the injected transport ignores abort and never resolves", async () => {
  const transport: typeof fetch = async () => new Promise(() => {});
  expect(
    await createLlm({ ...options(), transport, timeoutMs: 10 }).generate(input),
  ).toMatchObject({ ok: false, error: { reason: "timeout" } });
});
it("honors off mode even after caching and never sends a request with missing configuration", async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => wire());
  const llm = createLlm({ ...options(), transport });
  await llm.generate(input);
  vi.stubEnv("HEARSAY_LLM", "off");
  expect(await llm.generate(input)).toMatchObject({
    ok: false,
    error: { reason: "disabled" },
  });
  expect(transport).toHaveBeenCalledTimes(1);
  vi.stubEnv("HEARSAY_LLM", "live");
  expect(
    await createLlm({ apiKey: "", model: "", transport }).generate(input),
  ).toMatchObject({ ok: false, error: { reason: "configuration" } });
  expect(transport).toHaveBeenCalledTimes(1);
});
