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

Registry inspection found an unrelated `hearsay@3.0.0`; we must not direct developers to install that package. Goodness supplied the npm username `goodynessdev` and explicitly selected MIT. The package is now `@goodynessdev/hearsay`, its MIT license is included, the private publication guard is removed and public registry metadata is configured. `npm whoami` subsequently confirmed `goodynessdev`.

The exact public release archive passed a fresh-cache npm/npx invocation and `npm publish --dry-run`. Its five files and shasum are recorded in CLI-release.json. On 2026-10-17 at 11:44 WAT, actual publication was rejected by npm with E403: the account must enable 2FA or use an authorized token that bypasses 2FA. No token workaround was configured. A subsequent version lookup returned 404; **0.1.0 is not published**. Goodness must complete 2FA setup in their own browser before retrying.

Current typecheck and all 49 mirrors pass. The last complete suite passed 133 tests. A fresh full database rerun is delayed because Docker Desktop's Linux engine is not available; restarting Desktop has not exposed its pipe yet. The release changes since the green suite concern packaging and documentation, not engine behavior. Do not claim a fresh full suite or successful public-registry npx check until those run. No npm account secrets are needed in chat.

This does not claim an existing Unity game integration or website integration. It supplies the local transport a future native game adapter can call.
