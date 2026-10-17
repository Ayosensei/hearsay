import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { initProject } from "../../packages/cli/src/project";
import { SeedSchema } from "../../packages/hearsay/src/seed-schema";

type BoundProfile = {
  playerId: string;
  apiKey: string;
  worldPrepared: boolean;
  bindings: { slot: string; key: string; name: string }[];
};
function parseProfile(value: unknown): BoundProfile {
  if (!value || typeof value !== "object") throw new Error("Invalid profile.");
  const p = value as Record<string, unknown>;
  if (
    typeof p.playerId !== "string" ||
    !/^dfu_[a-f0-9]{32}$/.test(p.playerId) ||
    typeof p.apiKey !== "string" ||
    typeof p.worldPrepared !== "boolean" ||
    !Array.isArray(p.bindings) ||
    p.bindings.length !== 3
  )
    throw new Error("Invalid profile.");
  const bindings = p.bindings.map((raw: unknown) => {
    if (!raw || typeof raw !== "object") throw new Error("Invalid binding.");
    const b = raw as Record<string, unknown>;
    if (
      typeof b.slot !== "string" ||
      !["brom", "mira", "garrick"].includes(b.slot) ||
      typeof b.key !== "string" ||
      !b.key ||
      typeof b.name !== "string" ||
      !b.name ||
      b.name.length > 120
    )
      throw new Error("Invalid binding.");
    return { slot: b.slot, key: b.key, name: b.name };
  });
  return {
    playerId: p.playerId,
    apiKey: p.apiKey,
    worldPrepared: p.worldPrepared,
    bindings,
  };
}

export function prepareWorld(rawProfile: unknown, rawSeed: unknown) {
  const profile = parseProfile(rawProfile);
  if (
    new Set(profile.bindings.map((b) => b.slot)).size !== 3 ||
    new Set(profile.bindings.map((b) => b.key)).size !== 3
  )
    throw new Error("Bind three different game NPCs to the three slots first.");
  const seed = SeedSchema.parse(rawSeed);
  seed.npcs = profile.bindings.map((b) => ({
    id: b.slot,
    name: b.name,
    role: "Daggerfall resident",
    faction: "townsfolk",
    greed: 0.5,
    courage: 0.5,
    loyalty: 0.5,
    persona:
      "A resident of the Daggerfall game world. Speak plainly and briefly.",
  }));
  seed.factions = [{ id: "townsfolk", name: "Daggerfall test residents" }];
  seed.places = [{ id: "dfu_location", name: "Daggerfall test area" }];
  seed.factionRelations = [];
  seed.facts = [];
  seed.believes = [];
  seed.policies = [];
  seed.follows = [];
  // Controlled experimental relationships, not extracted native game relationships.
  seed.trusts = [
    { truster: "mira", trusted: "brom", weight: 0.9 },
    { truster: "garrick", trusted: "mira", weight: 0.7 },
  ];
  delete seed.templates.byNpc;
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(profile.bindings))
    .digest("hex")
    .slice(0, 12);
  return {
    profile,
    seed: SeedSchema.parse(seed),
    templateGraph: `dfu_${fingerprint}`,
  };
}

async function main() {
  const [profilePath, directory, connectionFile] = process.argv.slice(2);
  if (!profilePath || !directory)
    throw new Error(
      "Usage: prepare.mts <profile.json> <backend-directory> [private-connection.env]",
    );
  // Validate before creating files or changing an existing private profile.
  const prepared = prepareWorld(
    JSON.parse(await readFile(profilePath, "utf8")),
    JSON.parse(
      await readFile(
        new URL("../../seed/hollowbrook.json", import.meta.url),
        "utf8",
      ),
    ),
  );
  await initProject(directory);
  const configPath = resolve(directory, "hearsay.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (
    config.templateGraph !== prepared.templateGraph &&
    prepared.profile.worldPrepared
  )
    throw new Error(
      "Profile already prepared elsewhere. Use its existing backend directory.",
    );
  const privatePath = resolve(directory, ".env.hearsay.local");
  let settings = await readFile(privatePath, "utf8");
  if (connectionFile) {
    const connection = parseEnv(await readFile(connectionFile, "utf8"));
    for (const name of [
      "FALKORDB_HOST",
      "FALKORDB_PORT",
      "FALKORDB_USERNAME",
      "FALKORDB_PASSWORD",
    ]) {
      if (connection[name] !== undefined) {
        const value = connection[name];
        if (/[\r\n"\\]/.test(value))
          throw new Error("Unsupported connection setting encoding.");
        settings = settings.replace(
          new RegExp(`^${name}=.*$`, "m"),
          () => `${name}="${value}"`,
        );
      }
    }
  }
  const key = parseEnv(settings).HEARSAY_API_KEY;
  if (!key || key.length < 24)
    throw new Error("Missing local HTTP bearer key.");
  config.seed = "hearsay/world.json";
  config.templateGraph = prepared.templateGraph;
  config.port = 8787;
  await writeFile(
    resolve(directory, config.seed),
    JSON.stringify(prepared.seed, null, 2),
  );
  await writeFile(configPath, JSON.stringify(config, null, 2));
  await writeFile(privatePath, settings, { mode: 0o600 });
  await writeFile(
    profilePath,
    JSON.stringify(
      { ...prepared.profile, apiKey: key, worldPrepared: true },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    "Prepared three bound NPCs and a controlled 0.9 / 0.7 trust chain. HTTP key saved privately. No database calls made.",
  );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main().catch(() => {
    console.error(
      "Preparation failed. Check bindings, paths and private connection settings.",
    );
    process.exitCode = 1;
  });
