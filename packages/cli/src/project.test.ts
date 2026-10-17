import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";
import { initProject, loadProject } from "./project";

it("initializes an unrelated project, ignores secrets and preserves every existing file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "hearsay-cli-"));
  const originalEnv = { ...process.env };
  try {
    const first = await initProject(directory);
    expect(first.created).toHaveLength(4);
    const config = await loadProject(directory);
    expect(config.port).toBe(8787);
    expect(config.seedPath).toBe(join(directory, "hearsay/world.json"));
    expect(process.env.HEARSAY_API_KEY).toMatch(/^[a-f0-9]{64}$/);
    const ignore = await readFile(join(directory, ".gitignore"), "utf8");
    expect(ignore).toContain("/.env.hearsay.local");
    await writeFile(join(directory, "hearsay/world.json"), "custom world");
    expect((await initProject(directory)).preserved).toHaveLength(4);
    expect(await readFile(join(directory, "hearsay/world.json"), "utf8")).toBe(
      "custom world",
    );
    expect(await readFile(join(directory, ".gitignore"), "utf8")).toBe(ignore);
  } finally {
    for (const key of Object.keys(process.env))
      if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
    if (!resolve(directory).startsWith(join(resolve(tmpdir()), "hearsay-cli-")))
      throw new Error("Unexpected test directory");
    await rm(directory, { recursive: true, force: true });
  }
});
