import z from "zod";
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const users = t.router({
  boom: t.procedure.mutation(() => {
    console.log("boom");
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
