# Canonical Cypher queries for reviewers

Run `pnpm queries:generate` after editing production query constants, then `pnpm queries:check`. Files are generated from literal exported Q-number constants in packages/hearsay/src/queries plus the four literal index DDL entries. Test-only QG queries and reexport aliases are excluded. The script never executes queries or evaluates arbitrary TypeScript.

Each .cypher file contains the exact runtime query text plus generated source attribution. manifest.json records canonical source paths and SHA-256 hashes. The check normalizes Windows CRLF to LF, then checks all contents and rejects missing, edited or stale query files. It does not silently delete unknown files.

Q40 reads eligible teller/listener candidates through KNOWS and reverse TRUSTS. Q41 writes one selected knowledge/telling pair per listener/event with a write-time already-known guard. Q61 returns an event/root-specific actual TOLD path; its WITH sorts and limits before projecting path lists. See docs/shared/05-queries.md and the Goodness judge notes for parameters, verification and limitations.
