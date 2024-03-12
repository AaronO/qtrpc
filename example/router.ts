import z from "zod";
import { initTRPC } from "@trpc/server";
import { Queue } from "@cloudflare/workers-types";
import { QTRPCMessage } from "../src";

interface Env {
  QUEUE: Queue<QTRPCMessage>;
}

const t = initTRPC.context<{ env: Env }>().create();

export const users = t.router({
  boom: t.procedure.mutation(({ ctx }) => {
    console.log("boom", ctx);
  }),
  sendEmail: t.procedure
    .input(
      z.object({
        email: z.string(),
      }),
    )
    .mutation(({ input }) => {
      console.log("sendEmail", input);
    }),
});

export const projects = t.router({
  checkUsage: t.procedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(({ input }) => {
      console.log("checkUsage", input);
    }),
});

export const appRouter = t.router({
  users,
  projects,
});

export type AppRouter = typeof appRouter;
