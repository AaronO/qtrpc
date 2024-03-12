import { qClient, qHandler, QMessage } from "../src/index"; // "qtrpc"
import { type AppRouter, appRouter } from "./router";
import type { Queue, MessageBatch } from "@cloudflare/workers-types";

interface Env {
  QUEUE: Queue<QMessage>;
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const q = qClient<AppRouter>(env.QUEUE);
    await q.projects.checkUsage.send({ projectId: "" });
    await q.users.sendEmail.send({ email: "john@gmail.com" });
    await q.users.sendEmail.sendBatch([
      { email: "john1@gmail.com" },
      { email: "john2@gmail.com" },
    ]);
    await q.users.boom.send();
    return new Response("Success");
  },
  async queue(batch: MessageBatch<QMessage>, env: Env): Promise<void> {
    await qHandler(appRouter)(batch, { env });
  },
};
