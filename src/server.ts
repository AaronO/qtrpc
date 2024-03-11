import { type AnyRouter, createCallerFactory } from "@trpc/server";
import { type MessageBatch } from "@cloudflare/workers-types";
import { QTRPCMessage } from "./types";

export type QTRPCRouter = Record<string, (...args: any[]) => any>;
export type QTRPCRouterInput<TProcedure> = TProcedure extends (
  ...args: infer TArgs
) => any
  ? TArgs[0]
  : undefined;

export type QTRPCHandler<TRouter extends QTRPCRouter> = {
  [TProcedure in keyof TRouter]: (
    input: QTRPCRouterInput<TRouter[TProcedure]>,
  ) => Promise<void>;
};

export function qtrpcHandler<TRouter extends AnyRouter>(
  router: TRouter,
): (
  batch: MessageBatch<QTRPCMessage>,
  ctx: TRouter["_def"]["_config"]["$types"]["ctx"],
) => Promise<void> {
  return async function (batch, ctx) {
    const createCaller = createCallerFactory()(router);
    const caller = createCaller(ctx);
    for (const message of batch.messages) {
      const { path, input } = message.body;
      const procedureFn = path
        .split(".")
        .reduce((acc, part) => (acc as any)?.[part], caller);
      if (!procedureFn) {
        throw new Error(`Procedure not found: ${path}`);
      } else if (typeof procedureFn !== "function") {
        throw new Error(`Procedure not a function: ${path}`);
      }
      await (procedureFn as (input: any) => Promise<void>)(input);
      message.ack();
    }
  };
}
