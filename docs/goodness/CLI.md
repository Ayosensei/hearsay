# Developer CLI — 2026-10-17

User-requested distribution work: run Hearsay from another codebase through npm/npx commands, independent of the demo website. This extends Goodness's engine/MCP scope; no website or production world content was changed.

## Implemented

`packages/cli` builds a standalone Node executable with `hearsay` as its binary name. Commands: `init`, `doctor`, `tools`, `call`, `serve`, `mcp`, `help` and `--version`. Run `pnpm cli help` from this repository. The [package README](../../packages/cli/README.md) contains project setup, exact inputs and local HTTP integration details.

Initialization preserves existing files and writes an ignored private environment file, editable starter world, config and optional Compose file. Tool calls use the existing shared schemas and actual engine. `serve` binds to loopback and uses a generated bearer token; it is a native local developer bridge, not public multiplayer infrastructure. MCP reuses the existing official SDK server and excludes `sayNaive`. The world remains the three-NPC stub and generation defaults off.

The build bundles private workspace modules so an installation does not need this repository. Runtime dependencies are the already-used FalkorDB, Zod and MCP SDK versions. Direct build dependency esbuild 0.28.2 reuses the existing cached/approved version; no new third-party versions were fetched. Offline pnpm resolution rewired some optional peer snapshots without upgrading their versions.

## Verification

- Typecheck and all **133** workspace tests pass: 105 core, 5 contract, 13 website mock, 2 original MCP and 8 CLI tests. All 49 query mirrors still match.
- CLI tests use real FalkorDB, real Node subprocesses, real HTTP and the official MCP client/server. HTTP verifies the Brom → Mira → Garrick explanation after two rounds, authentication, browser-origin rejection and bounded bad requests. Project tests verify no-overwrite initialization and ignored credentials. Subprocess tests verify direct tool calls, argument failures and MCP protocol output.
- `npm pack` produced `hearsay-cli-0.1.0.tgz`, containing only package.json, README, bundled executable and starter world. No environment files or workspace source folders are packaged.
- The actual archive was installed with production dependencies into `C:/Users/DELL/Documents/Codex/work/hearsay-cli-package-check`, outside the repository, using pnpm's offline cache.
- From that folder, **`npx --offline --no -- hearsay`** ran initialization, doctor, getWorld, player creation, event recording and recall. The repeat check confirmed all four project files were preserved, the town had three NPCs, all 15 tool schemas were listed and the version was 0.1.0. Only this verification's player/template graphs were deleted at cleanup. The audit folder retains `verification.json` and the archive for review; its private environment file is not copied into the repository.

The first archive verification's cleanup helper resolved a pnpm junction as a synthetic filename and could not import FalkorDB. Resolving the installed executable with `realpathSync` fixed the audit helper; the package command itself worked. The owned test graphs were then cleaned successfully. An HTTP test initially expected chain `id` rather than contract `npcId`; it now parses the shared output schema. Type errors around untyped HTTP JSON were fixed with schema parsing.

## Publication remains pending

Registry inspection found an unrelated `hearsay@3.0.0`; we must not direct developers to install that package. The initial `@hearsay/cli` name was provisional. Goodness supplied the npm username `goodynessdev` and explicitly selected MIT, so the package is now named `@goodynessdev/hearsay` with its MIT license included in the archive. A public registry read returned 404 for that package name; authenticated publication rights are not established by that alone. This machine's `npm whoami` reported ENEEDAUTH. `private:true` remains until authentication and the release step are ready. No npm account secrets are needed in chat, and no publication was attempted.

This does not claim an existing Unity game integration or website integration. It supplies the local transport a future native game adapter can call.
