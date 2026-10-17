# 08 — Deployment and the $0 stack (DuroT owns; Goodness reviews)

Goal: the project costs $0 and is verifiable by a judge in two ways: (A) local run from the README, (B) an optional live link.

## Path A (guaranteed): local run + demo video

Judges follow the README:

```
git clone <repo> && cd hearsay
cp .env.example .env            # add GEMINI_API_KEY (or set HEARSAY_LLM=off to use templates)
docker compose up -d falkordb   # FalkorDB on 6379, Browser on 3000
pnpm i
pnpm dev                        # http://localhost:3000 is taken by FalkorDB Browser, so Next runs on 3001
```

Set the Next dev port to **3001** (`next dev -p 3001`) because the FalkorDB Docker image exposes its Browser on port 3000. Document this in the README.

`docker-compose.yml` (Goodness, task G1):

```yaml
services:
  falkordb:
    image: falkordb/falkordb:latest
    ports:
      - "6379:6379"
      - "3000:3000"
    volumes:
      - falkordb_data:/var/lib/falkordb/data
volumes:
  falkordb_data:
```

The volume path `/var/lib/falkordb/data` is from the official FalkorDB persistence guide. FalkorDB also has RDB and AOF durability settings (docs: Operations > Durability). For the restart demo:
1. Do a normal restart: `docker compose restart falkordb` (a clean shutdown writes a snapshot).
2. If you worry about data written in the last seconds, run the `SAVE` command in `redis-cli` first, or enable AOF (the docs show setting Redis args via the `REDIS_ARGS` env var; verify the exact flag in the Durability page before using it).
3. Never demo persistence with `docker kill`.

Verify in task G11: record a player's events, restart the container, call `recall`, confirm the data is still there.

Minimum FalkorDB self-hosting requirement is Redis 8.0.0 or later; the official Docker image already includes everything, so use the image.

### G11 verified local restart procedure (2026-10-17)

Run from the repository with the local Docker database. The smoke script restricts itself to localhost and unique `persist_` graph names; it never deletes the default town or other players.

```
pnpm exec tsx packages/hearsay/src/persistence-smoke.ts prepare
docker compose restart falkordb
pnpm exec tsx packages/hearsay/src/persistence-smoke.ts verify
pnpm exec tsx packages/hearsay/src/persistence-smoke.ts recover
pnpm exec tsx packages/hearsay/src/persistence-smoke.ts cleanup
```

The recorded run passed without manual SAVE or enabling AOF. CONFIG GET dir returned `/var/lib/falkordb/data`; INFO persistence showed `aof_enabled:0`. The container's StartedAt changed from 2026-10-17T02:50:24.784691855Z to 2026-10-17T05:02:46.106254569Z. A new connection recovered the theft, Garrick's Mira/0.63 knowledge, tick 2 and both saved Utterances. recover deleted only the owned template and proved ensureWorld rebuilt it from the current three-NPC seed. cleanup removed the owned graphs. Evidence: `docs/goodness/G11-results.json`.

This verifies clean container restart with the mounted local data directory, not crash/kill durability or container recreation. Local template recovery is not a Cloud result. The Cloud/app half of G11 remains pending a configured Cloud endpoint/credentials and DuroT's live application integration (R-005); no Cloud pass is claimed.

## Path B (optional): live link

Free pieces:
- **FalkorDB Cloud free tier**: sign up at https://app.falkordb.cloud/signup, no credit card. 100 MB RAM (also the max dataset size), multi-graph supported. **No persistence and no backups. Stops after 1 day unused; deleted after 7 days.** No TLS on the free tier. Create an instance, copy host/port/password into env vars.
- **Vercel** (Hobby) for the Next.js app. API routes run as serverless functions, so there is no separate backend to host.
- **Gemini free tier** for the LLM (keys from Google AI Studio; limits shown in AI Studio, they vary by model/account and change).

Day 1 spike (DuroT, 30 minutes, task D11a): deploy a hello-world route to Vercel that connects to the Cloud instance and runs `GRAPH.LIST`. If this works, continue with Path B. If it fails (TCP from serverless blocked, timeouts), **drop Path B** and spend the time elsewhere. The rules accept a demo video + complete local setup when a live deployment is not possible.

Rules for Path B:
- Every API route calls `ensureWorld()` first, so a wiped Cloud instance re-seeds itself. `newPlayer` is called automatically by the UI when it gets `UNKNOWN_PLAYER`.
- Singleton DB client per serverless instance (`getHearsay()`); do not open a connection per tool call if you can avoid it, and close idle connections cleanly.
- `maxDuration` for the `say` route may need raising on Vercel; keep LLM prompts short so replies return within a few seconds.
- Add a visible banner on the live site: "Free demo instance. Data may reset. See the demo video for the persistence demo." (honest and protective).
- Do not rely on the live site for the persistence demo or load test. Those run locally.
- A free Cloud instance can be wiped before judges look. The video and README are the primary evidence; the link is a bonus.

## Environment variables per environment

| Var | Local | Vercel |
| --- | --- | --- |
| FALKORDB_HOST / PORT / PASSWORD | localhost / 6379 / empty | Cloud values |
| GEMINI_API_KEY | personal key in `.env` | project env var |
| GEMINI_MODEL | a current Flash model | same |
| HEARSAY_LLM | `live` (or `off`) | `live` |
| NEXT_PUBLIC_HEARSAY_MODE | `live` | `live` |

Never commit `.env`. Keep `.env.example` current.

## Cost and quota guardrails

- One LLM call per NPC reply. Cache identical prompts for a short time. Exponential backoff with jitter on 429s. Template fallback if the API is unavailable (this must keep the demo alive).
- The load test runs with `HEARSAY_LLM=off`.
- A per-session limit on `say` calls in the UI (e.g. 40) with a friendly message, to protect the free quota if the link is shared.
- Free-tier Gemini inputs may be used by Google to improve its models: this is fine for our synthetic world; never put real personal data in prompts.

## Self-check before submission

- [ ] Fresh clone + README steps work on a machine that has never seen the repo
- [ ] `HEARSAY_LLM=off` run works end to end (templates)
- [ ] Persistence demo works with `docker compose restart`
- [ ] Live link (if any) loads, auto-seeds, and a full demo path works
- [ ] No secrets in git history (`git log -p | grep -i key` sanity check)
