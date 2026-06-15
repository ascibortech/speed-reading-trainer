// Barrel for engine/app/exercise consumers. NOTE: the storage layer must NOT
// import this barrel (it re-exports the text module); storage imports
// `@srt/contracts/metadata` directly. Enforced by check-text-boundary.mjs.
export * from "./text.js";
export * from "./metrics.js";
export * from "./exercise.js";
export * from "./metadata.js";
