# Hearsay docs — index

Copy this `docs/` folder and `AGENTS.md` into the repo root. Agents read `AGENTS.md` first.

## Who reads what

| Doc | Goodness | DuroT | Coding agents |
| --- | :-: | :-: | :-: |
| `AGENTS.md` (root) | yes | yes | **always** |
| `shared/01-product-and-rules.md` | yes | yes | yes |
| `shared/02-architecture.md` | yes | yes | yes |
| `shared/03-graph-model.md` | yes | yes | yes |
| `shared/04-tool-contract.md` | yes | yes | yes |
| `shared/05-queries.md` | **owner** | skim | when touching queries |
| `shared/06-behaviour-specs.md` | **owner** | yes | yes |
| `shared/07-workflow.md` | yes | yes | yes |
| `shared/08-deployment.md` | yes | **owner** | when deploying |
| `shared/09-demo-and-submission.md` | yes | **owner** | yes |
| `DESIGN.md` (repo root; **the design system**) | skim | **yes** | DuroT's agent, before any UI work |
| `duro/ui-spec.md` (layout, components, copy, states) | no | **yes** | DuroT's agent |
| `goodness/README.md` | **yes** | no | Goodness's agent only |
| `duro/README.md` | no | **yes** | DuroT's agent only |
| `requests.md` | yes | yes | yes |

## Ownership map

| Path | Owner | Notes |
| --- | --- | --- |
| `packages/contract/src/schemas.ts` | Goodness | Source of truth. Changes via `requests.md` |
| `packages/contract/src/fixtures.ts`, `mock.ts` | DuroT | Scripted happy-path mock for the UI |
| `packages/hearsay/**` | Goodness | Core library |
| `packages/mcp/**` | Goodness | MCP server |
| `loadtest/**`, `docker-compose.yml` | Goodness | |
| `seed/hollowbrook.json` | DuroT (content) | Goodness writes the loader |
| `apps/web/**` | DuroT | UI and API route wrapper |
| `README.md` (repo), blog post, demo video | DuroT drafts, Goodness reviews | |
| `.githooks/`, root `package.json` scripts | Goodness | hooks per `shared/07-workflow.md` |
| `DESIGN.md`, `scripts/check-design.mjs`, `/styleguide`, `docs/duro/screens/` | DuroT | tokens in `DESIGN.md`; enforcement per `duro/ui-spec.md` section 14 |
| `queries/` folder and `shared/05-queries.md` | Goodness | |

## Project lead

Ayo is the project lead. Scope decisions (what to cut) go to Ayo. Ayo is also building a separate project in the same hackathon and may be slow to reply; when blocked on a scope call, follow the "Must / Should / Stretch" list in `01-product-and-rules.md` and keep going.
