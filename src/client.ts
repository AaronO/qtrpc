import { AnyRouter } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import {
  CreateTRPCClientOptions,
  TRPCLink,
  createTRPCProxyClient,
} from "@trpc/client";
import { Queue } from "@cloudflare/workers-types";
import { QTRPCMessage } from "./types";

export function queueLink<TRouter extends AnyRouter>(
  queue: Queue,
): TRPCLink<TRouter> {
  return () =>
    ({ op }) => {
      return observable((observer) => {
        const payload = {
          path: op.path,
          input: op.input,
          type: op.type as "mutation",
        } satisfies QTRPCMessage;
        queue.send(payload).then(
          () => {
            observer.next({ result: { type: "stopped" }, context: op.context });
            observer.complete();
          },
          (err) => {
            observer.error(err);
          },
        );
      });
    };
}

export function qtrpcClient<TRouter extends AnyRouter>(queue: Queue) {
  return createTRPCProxyClient<TRouter>({
    links: [queueLink<TRouter>(queue)],
  } as CreateTRPCClientOptions<TRouter>);
}
