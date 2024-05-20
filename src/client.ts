// Derived from createTRPCClientProxy.ts
import type {
  AnyMutationProcedure,
  AnyProcedure,
  AnyRouter,
  ProcedureArgs,
  ProcedureRouterRecord,
} from "@trpc/server";
import { createFlatProxy, createRecursiveProxy } from "@trpc/server/shared";
import { QTRPCMessage } from "./types";

// Define a Resolver types for procedures
type Resolver<TProcedure extends AnyProcedure> = (
  input: ProcedureArgs<TProcedure["_def"]>[0],
) => Promise<void>;

type BatchResolver<TProcedure extends AnyProcedure> = (
  inputs: ProcedureArgs<TProcedure["_def"]>[0][],
) => Promise<void>;

// Define a type for procedures that includes send and sendBatch methods
type DecorateProcedure<TProcedure extends AnyProcedure> =
  TProcedure extends AnyMutationProcedure
    ? {
        send: Resolver<TProcedure>;
        sendBatch: BatchResolver<TProcedure>; // Assuming sendBatch has the same signature
      }
    : never;

// Define a type for the decorated procedure record
type DecoratedProcedureRecord<
  TRouter extends AnyRouter,
  TProcedures extends ProcedureRouterRecord,
> = {
  [TKey in keyof TProcedures]: TProcedures[TKey] extends AnyRouter
    ? DecoratedProcedureRecord<TRouter, TProcedures[TKey]["_def"]["record"]>
    : TProcedures[TKey] extends AnyProcedure
      ? DecorateProcedure<TProcedures[TKey]>
      : never;
};

// Map client call types to procedure types
const clientCallTypeMap = {
  send: "send",
  sendBatch: "sendBatch",
};

// Convert a client call type to a procedure type
const clientCallTypeToProcedureType = (clientCallType: string) => {
  return clientCallTypeMap[clientCallType as keyof typeof clientCallTypeMap];
};

// Create a TRPC client proxy with send and sendBatch methods
function createTRPCClientProxyWithSend<TRouter extends AnyRouter>(
  client: QueueClient<TRouter>,
): DecoratedProcedureRecord<TRouter, TRouter["_def"]["record"]> {
  return createFlatProxy((key) => {
    if (key === "__untypedClient") {
      return client;
    }
    return createRecursiveProxy(({ path, args }) => {
      const pathCopy = [key, ...path];
      const procedureType = clientCallTypeToProcedureType(pathCopy.pop()!);
      const fullPath = pathCopy.join(".");
      // Adjust the logic here to handle send and sendBatch
      // For simplicity, this example assumes both are treated as mutations
      return (client as any)[procedureType](fullPath, ...args);
    });
  });
}

class QueueClient<TRouter extends AnyRouter> {
  constructor(private queue: Queue<QTRPCMessage>) {}

  async send<TPath extends keyof TRouter["_def"]["mutations"], TInput>(
    path: TPath,
    input: TInput,
  ): Promise<void> {
    const message: QTRPCMessage = {
      type: "mutation",
      path: path.toString(),
      input,
    };
    await this.queue.send(message);
  }

  async sendBatch<TPath extends keyof TRouter["_def"]["mutations"], TInput>(
    path: TPath,
    inputs: TInput[],
  ): Promise<void> {
    if (inputs.length === 0) {
      return;
    }
    const messages: MessageSendRequest<QTRPCMessage>[] = inputs.map(
      (input) => ({
        body: {
          type: "mutation",
          path: path.toString(),
          input,
        },
        contentType: "json",
      }),
    );

    await this.queue.sendBatch(messages);
  }
}

export function qtrpcClient<TRouter extends AnyRouter>(
  queue: Queue<QTRPCMessage>,
) {
  return createTRPCClientProxyWithSend<TRouter>(
    new QueueClient<TRouter>(queue) as any,
  );
}
