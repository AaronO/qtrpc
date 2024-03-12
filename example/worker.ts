import { qtrpcClient, qtrpcHandler, QTRPCMessage } from "../src/index";
import { type AppRouter, appRouter } from "./router";
import type { Queue, MessageBatch } from "@cloudflare/workers-types";

interface Env {
  QUEUE: Queue<QTRPCMessage>;
}

const qtrpcHandle = qtrpcHandler(appRouter);

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const qtrpc = qtrpcClient<AppRouter>(env.QUEUE);
    await qtrpc.projects.checkUsage.send({ projectId: "" });
    await qtrpc.users.sendEmail.send({ email: "john@gmail.com" });
    await qtrpc.users.sendEmail.sendBatch([
      { email: "john1@gmail.com" },
      { email: "john2@gmail.com" },
    ]);
    await qtrpc.users.boom.send();
    return new Response("Success");
  },
  async queue(batch: MessageBatch<QTRPCMessage>, env: Env): Promise<void> {
    await qtrpcHandle(batch, { env });
  },
};
