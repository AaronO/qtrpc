export * from "./client";
export * from "./server";
export * from "./types";

// Aliases qtrpc => q
export { qtrpcHandler as qHandler } from "./server";
export { qtrpcClient as qClient } from "./client";
export { QTRPCMessage as QMessage } from "./types";
