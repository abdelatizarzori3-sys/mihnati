import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import {
  createUserOffer,
  createUserOfferTemplate,
  deleteUserOffer,
  deleteUserOfferTemplate,
  listUserOfferTemplates,
  listUserOffers,
  updateUserOffer,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { renderOfferPrintDocument } from "./offerReport";
import { getProAccess, requireProAccess } from "./proEntitlements";

const offerInput = z.object({
  clientName: z.string().trim().max(160).default(""),
  sector: z.string().trim().max(120).default(""),
  tags: z.array(z.string().trim().min(1).max(60)).max(16).default([]),
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

function toSavedOffer(input: z.infer<typeof offerInput>) {
  return {
    clientName: input.clientName,
    sector: input.sector,
    tagsJson: JSON.stringify(Array.from(new Set(input.tags))),
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
  };
}

/** يحرس كل إجراء Pro بخدمة خادمية لا تقبل أي علامة قادمة من العميل. */
const proProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  await requireProAccess(ctx.user.id);
  return next();
});

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  offers: router({
    list: protectedProcedure.query(({ ctx }) => listUserOffers(ctx.user.id)),
    create: protectedProcedure.input(offerInput).mutation(({ ctx, input }) => createUserOffer(ctx.user.id, toSavedOffer(input))),
    update: protectedProcedure.input(offerInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({
      offer: await updateUserOffer(ctx.user.id, input.id, toSavedOffer(input)),
    })),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({
      deleted: await deleteUserOffer(ctx.user.id, input.id),
    })),
  }),
  pro: router({
    // لا يوجد checkout هنا قبل اختيار المزود والقناة؛ الحالة لا تدّعي أن الشراء مكتمل.
    status: protectedProcedure.query(({ ctx }) => getProAccess(ctx.user.id)),
  }),
  offerTemplates: router({
    list: proProcedure.query(({ ctx }) => listUserOfferTemplates(ctx.user.id)),
    create: proProcedure
      .input(z.object({ name: z.string().trim().min(2).max(80), offer: offerInput }))
      .mutation(({ ctx, input }) => createUserOfferTemplate(ctx.user.id, { name: input.name, dataJson: JSON.stringify(input.offer) })),
    delete: proProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => ({
      deleted: await deleteUserOfferTemplate(ctx.user.id, input.id),
    })),
  }),
  reports: router({
    printDocument: proProcedure.input(offerInput).mutation(({ input }) => ({
      html: renderOfferPrintDocument(input),
    })),
  }),
});

export type AppRouter = typeof appRouter;
