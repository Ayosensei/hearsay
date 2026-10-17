// Tools added in G3–G7 will use this shared interface and the traced database helper.
export type { HearsayClient } from "@hearsay/contract";
export { connectDatabase } from "./db";
export type { Database, DatabaseConfig, QueryParams, Row } from "./db";
export { createWorld } from "./world";
export type { WorldOptions, WorldTemplate } from "./world";
export { createMemory } from "./memory";
export { createGossip } from "./gossip";
export { createOpinion } from "./opinion-tools";
export { createDialogue } from "./dialogue";
export type { DialogueOptions } from "./dialogue";
export { createLlm } from "./llm";
export type { Llm, LlmOptions, LlmInput, LlmResult } from "./llm";
