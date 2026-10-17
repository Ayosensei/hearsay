# G1 foundation and handoff

## What exists

- `@hearsay/contract`: contract v1.0.0 copied unchanged from `../shared/04-tool-contract.md`, exported from `src/index.ts`.
- `@hearsay/core`: strict TypeScript scaffold for G2–G7.
- `@hearsay/mcp`: strict TypeScript scaffold for G9; its public tool-name type excludes `sayNaive`.
- Existing `apps/web` is preserved. It still uses its browser mock.
- Root scripts cover typecheck, tests, development, MCP and load tests.
- MCP and load-test commands deliberately exit with a pending-task message until G9/G10.

Packages expose TypeScript source for workspace consumers. Publishing compiled SDK artifacts is outside G1.
Zod is required by the agreed contract; Vitest is the existing test framework. No database or MCP SDK is installed before its implementation task.

## Local setup

Use Node 24 LTS (validated here with 24.16.0) and pnpm 11.14.0.
The Node requirement follows the already-installed Vitest 5 engine range; Node 20 cannot run this test stack.
Docker Desktop with Linux containers and Compose is required for FalkorDB.

```sh
pnpm install --frozen-lockfile
cp .env.example .env
docker compose up -d falkordb
pnpm typecheck
pnpm test
pnpm check:design
pnpm dev
```

In PowerShell, use `Copy-Item .env.example .env` instead of `cp` if preferred.
FalkorDB Browser uses http://localhost:3000; the root `pnpm dev` command starts Next on http://localhost:3001.
The database stores data in a named volume, mounted at `/var/lib/falkordb/data` per the agreed deployment specification.
Do not run `docker compose down -v` if you want to retain that data.
The sample environment selects templates and the mock UI; enabling live mode requires later engine and UI integration.

`pnpm install` configures `core.hooksPath=.githooks`. DuroT should run it once after pulling these changes.
The pre-commit hook typechecks and runs the design checker when web files are staged; staging `DESIGN.md` also runs its lint command.
The commit-message hook requires `area(task): summary`, at most 72 characters.

## DuroT handoff

Import shared types and schemas from `@hearsay/contract` after adding it as a `workspace:*` dependency.
Implement fixtures and `MockHearsay` against `HearsayClient.call(name, input)` (D2).
Do not change the contract to fit the provisional UI types. The migration request is in `../requests.md`.
The root development script reserves port 3000 for the database without changing web-owned files.

## Verification on 2026-10-17

- Frozen-lockfile install: passed in both the working checkout and a fresh local clone of the committed branch (no copied node_modules).
- Typecheck: passed in all four application/library packages.
- Tests: 18 passed (5 contract boundary tests, 13 existing mock-engine tests). These are not live database tests.
- Design checker: passed.
- Fresh-clone typecheck, all 18 tests and design check: passed; installation activated `.githooks` and left the clone clean.
- Root `pnpm dev`: Next.js became ready on port 3001 and served `/` with HTTP 200; the temporary smoke-test server was then stopped.
- Hooks: shell syntax passed; valid title accepted, invalid and overlong titles rejected; actual commits ran pre-commit checks.
- Environment ignores: `.env`, `.env.local`, `.env.production.local` confirmed ignored.
- MCP/load-test placeholders: correctly exit nonzero and identify G9/G10.
- Docker startup: blocked, `docker` is not installed or on PATH. No database startup, Browser, volume durability or real Cypher validation is claimed.
- Repository: origin has `duro/bootstrap` as its default branch and no `main`; no merge to an invented main branch is performed.

G1's code is delivered, but its full acceptance remains pending the Docker startup check and agreed integration branch.
