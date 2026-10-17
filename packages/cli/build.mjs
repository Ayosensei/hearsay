import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("./", import.meta.url);
await mkdir(new URL("dist/", root), { recursive: true });
await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ["src/index.ts"],
  outfile: "dist/cli.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  external: ["falkordb", "zod", "@modelcontextprotocol/sdk/*"],
  banner: { js: "#!/usr/bin/env node" },
});
await copyFile(
  new URL("../../seed/hollowbrook.json", root),
  new URL("dist/world.json", root),
);
