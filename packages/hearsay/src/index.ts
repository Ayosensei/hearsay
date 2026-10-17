// The database helper and real tools land in G2–G7, behind this shared interface.
export type { HearsayClient } from "@hearsay/contract";
export { connectDatabase } from "./db";
export type { Database, DatabaseConfig, QueryParams, Row } from "./db";
