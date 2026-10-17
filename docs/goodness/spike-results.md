# G2 live FalkorDB spike — 2026-10-17

Goodness approved using the official Node client/CLI against the live local database instead of the Browser-first workflow after both browser automation paths timed out. These are real database checks, not mocked or Browser UI checks.

## Client and helper

- Official client: `falkordb@6.8.0`, selected from the [official client list](https://docs.falkordb.com/getting-started/clients) and inspected in the installed package.
- Connection: `FalkorDB.connect({socket: {host, port, connectTimeout, reconnectStrategy: false}, password?})`. Host, port and password default to `FALKORDB_*` environment variables.
- Queries: `selectGraph(name).query(query, {params, TIMEOUT})`; reads use `roQuery`.
- Results: the client already returns `data: [{alias: value}]`; write-only replies omit `data`, normalized to `[]` by the helper. No second row decoder is needed.
- Entity shapes from installed source (live snapshot validation follows): nodes have internal `id`, `labels`, `properties`; edges have internal `id`, `sourceId`, `destinationId`, `relationshipType`, `properties`. Application IDs must come from `properties.id`.
- Entity decoding may issue internal client metadata reads (`db.labels`, `db.relationshipTypes`, `db.propertyKeys`). A helper trace measures the whole explicit operation, not each internal metadata command.
- Graph operations use the official `list()`, `selectGraph(source).copy(destination)` and `selectGraph(name).delete()` methods; none needs raw Cypher interpolation.
- Six live helper tests pass: bound strings containing quotes/newlines, trace fields/timing, empty reads, read-only write rejection without mutation, sanitized server errors and nested credential redaction, closed/refused connection handling. Write-only setup is also verified.
- No automatic write retries. Errors return the shared envelope with `DB_UNAVAILABLE` or `INTERNAL`, including failure traces; raw driver messages/Cypher are not returned.

Run: `pnpm --filter @hearsay/core test`. Tests create uniquely named `test_*` graphs and delete only their own graphs on completion. They require the real Compose database.

## Query results

Query spike results will be recorded here after the executable checks complete.
