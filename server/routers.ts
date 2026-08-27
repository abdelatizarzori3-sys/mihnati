import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { createUserOffer, deleteUserOffer, listUserOffers } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const offerInput = z.object({
  skill: z.string().trim().min(2).max(255),
  audience: z.string().trim().min(2).max(255),
  outcome: z.string().trim().min(4).max(4000),
  model: z.enum(["sprint", "project", "retainer"]),
  title: z.string().trim().min(2).max(255),
  promise: z.string().trim().min(4).max(4000),
  deliverables: z.array(z.string().trim().min(1).max(500)).min(1).max(12),
  timeline: z.string().trim().min(1).max(120),
  price: z.string().trim().min(1).max(80),
  priceNote: z.string().trim().min(1).max(160),
  outreach: z.string().trim().min(4).max(4000),
  clarityScore: z.number().int().min(0).max(100),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  offers: router({
    list: protectedProcedure.query(({ ctx }) => listUserOffers(ctx.user.id)),
    create: protectedProcedure.input(offerInput).mutation(({ ctx, input }) =>
      createUserOffer(ctx.user.id, {
        skill: input.skill,
        audience: input.audience,
        outcome: input.outcome,
        model: input.model,
        title: input.title,
        promise: input.promise,
        deliverablesJson: JSON.stringify(input.deliverables),
        timeline: input.timeline,
        price: input.price,
        priceNote: input.priceNote,
        outreach: input.outreach,
        clarityScore: input.clarityScore,
      }),
    ),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({
      deleted: await deleteUserOffer(ctx.user.id, input.id),
    })),
  }),
});

export type AppRouter = typeof appRouter;
