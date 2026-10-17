import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { TOOLS, CONTRACT_VERSION } from "@hearsay/contract";
import type { HearsayClient } from "@hearsay/contract";
import { z } from "zod";
import { callTool, toolName } from "./runtime";

class HttpFailure extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
function send(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(data));
}
async function body(request: IncomingMessage): Promise<unknown> {
  if (
    request.headers["content-type"]?.split(";")[0].trim() !== "application/json"
  )
    throw new HttpFailure(415, "Use application/json.");
  const text = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0,
      failed = false;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 65536) {
        if (!failed) reject(new HttpFailure(413, "Request body is too large."));
        failed = true;
        return;
      }
      if (!failed) chunks.push(chunk);
    });
    request.once("end", () => {
      if (!failed) resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.once("error", () =>
      reject(new HttpFailure(400, "Request interrupted.")),
    );
    request.once("aborted", () =>
      reject(new HttpFailure(400, "Request interrupted.")),
    );
  });
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpFailure(400, "Invalid JSON.");
  }
}
export async function startApi(
  client: HearsayClient,
  options: { port: number; key: string },
) {
  if (options.key.length < 24)
    throw new Error("HEARSAY_API_KEY must contain at least 24 characters.");
  const digest = (value: string) => createHash("sha256").update(value).digest();
  const expected = digest(`Bearer ${options.key}`);
  const server = createServer((request, response) => {
    const handle = async () => {
      const address = server.address();
      const port =
        address && typeof address !== "string" ? address.port : options.port;
      if (
        ![`127.0.0.1:${port}`, `localhost:${port}`].includes(
          request.headers.host ?? "",
        ) ||
        request.headers.origin
      )
        throw new HttpFailure(
          403,
          "This API accepts local native clients only.",
        );
      if (request.method === "GET" && request.url === "/health") {
        send(response, 200, {
          ok: true,
          service: "hearsay",
          contractVersion: CONTRACT_VERSION,
        });
        return;
      }
      if (
        !timingSafeEqual(digest(request.headers.authorization ?? ""), expected)
      )
        throw new HttpFailure(401, "A valid bearer token is required.");
      if (request.method === "GET" && request.url === "/tools") {
        send(
          response,
          200,
          Object.keys(TOOLS).map((name) => ({
            name,
            input: z.toJSONSchema(TOOLS[toolName(name)].input),
          })),
        );
        return;
      }
      const match = /^\/tools\/([A-Za-z][A-Za-z0-9]*)$/.exec(request.url ?? "");
      if (
        request.method !== "POST" ||
        !match ||
        !Object.hasOwn(TOOLS, match[1])
      )
        throw new HttpFailure(404, "Unknown route or tool.");
      const result = await callTool(
        client,
        toolName(match[1]),
        await body(request),
      );
      send(
        response,
        result.ok
          ? 200
          : result.error.code === "BAD_ARGS"
            ? 400
            : result.error.code === "DB_UNAVAILABLE"
              ? 503
              : 422,
        result,
      );
    };
    void handle().catch((error) => {
      const known = error instanceof HttpFailure;
      send(response, known ? error.status : 500, {
        ok: false,
        error: {
          code: known ? "BAD_ARGS" : "INTERNAL",
          message: known ? error.message : "The request failed.",
        },
        trace: [],
      });
    });
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  return server;
}
