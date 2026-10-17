// Tools added in G3–G7 will use this shared interface and the traced database helper.
export type { HearsayClient } from "@hearsay/contract";
export { connectDatabase } from "./db";
export type { Database, DatabaseConfig, QueryParams, Row } from "./db";
