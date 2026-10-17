import { createHash, randomBytes } from "node:crypto";
import {
  access,
  mkdir,
  readFile,
  writeFile,
  appendFile,
} from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import { z } from "zod";

export const Project = z
  .object({
    version: z.literal(1),
    seed: z.string().min(1),
    templateGraph: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
    port: z.number().int().min(1).max(65535),
  })
  .strict();
export type Project = z.infer<typeof Project>;
export async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
export async function exampleSeed() {
  const bundled = fileURLToPath(new URL("./world.json", import.meta.url));
  return (await exists(bundled))
    ? bundled
    : fileURLToPath(new URL("../../../seed/hollowbrook.json", import.meta.url));
}
export async function initProject(directory: string) {
  const root = resolve(directory);
  await mkdir(root, { recursive: true });
  const config: Project = {
    version: 1,
    seed: "hearsay/world.json",
    templateGraph: `hearsay_${createHash("sha256").update(root).digest("hex").slice(0, 12)}`,
    port: 8787,
  };
  const files: Record<string, string> = {
    "hearsay.config.json": JSON.stringify(config, null, 2) + "\n",
    "hearsay/world.json": await readFile(await exampleSeed(), "utf8"),
    ".env.hearsay.local": [
      "FALKORDB_HOST=localhost",
      "FALKORDB_PORT=6379",
      "FALKORDB_USERNAME=",
      "FALKORDB_PASSWORD=",
      "HEARSAY_LLM=off",
      "GEMINI_API_KEY=",
      "GEMINI_MODEL=",
      `HEARSAY_API_KEY=${randomBytes(32).toString("hex")}`,
      "",
    ].join("\n"),
    "hearsay.compose.yml":
      "services:\n  falkordb:\n    image: falkordb/falkordb:latest\n    ports:\n      - '6379:6379'\n      - '3000:3000'\n    volumes:\n      - hearsay_data:/var/lib/falkordb/data\nvolumes:\n  hearsay_data:\n",
  };
  const created: string[] = [],
    preserved: string[] = [];
  // Ignore the credentials before writing them, even when an existing project has no ignore file.
  const ignore = resolve(root, ".gitignore");
  const current = (await exists(ignore)) ? await readFile(ignore, "utf8") : "";
  if (!current.split(/\r?\n/).includes("/.env.hearsay.local"))
    await appendFile(
      ignore,
      "\n# Hearsay private connection settings\n/.env.hearsay.local\n",
    );
  for (const [name, contents] of Object.entries(files)) {
    const path = resolve(root, name);
    await mkdir(dirname(path), { recursive: true });
    try {
      await writeFile(path, contents, {
        flag: "wx",
        mode: name.startsWith(".env") ? 0o600 : 0o644,
      });
      created.push(name);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "EEXIST")
        preserved.push(name);
      else throw error;
    }
  }
  return { created, preserved };
}
export async function loadProject(directory: string, envFile?: string) {
  const root = resolve(directory);
  const env = resolve(root, envFile ?? ".env.hearsay.local");
  if (await exists(env)) loadEnvFile(env);
  const raw: unknown = JSON.parse(
    await readFile(resolve(root, "hearsay.config.json"), "utf8"),
  );
  const config = Project.parse(raw);
  return { ...config, seedPath: resolve(root, config.seed) };
}
