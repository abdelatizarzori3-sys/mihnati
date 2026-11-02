import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const repository = vi.hoisted(() => ({
  createUserOfferTemplate: vi.fn(),
  deleteUserOfferTemplate: vi.fn(),
  listUserOfferTemplates: vi.fn(),
}));
const entitlements = vi.hoisted(() => ({
  getProAccess: vi.fn(),
  requireProAccess: vi.fn(),
}));

vi.mock("./db", () => repository);
vi.mock("./proEntitlements", () => entitlements);

import { appRouter } from "./routers";

const offer = {
  clientName: "متجر أثير",
  sector: "تجارة إلكترونية",
  tags: ["إطلاق"],
  skill: "تصميم الهوية",
  audience: "متاجر ناشئة",
  outcome: "تحسين الانطباع عند الشراء",
  model: "project" as const,
  title: "باقة هوية واضحة",
  promise: "نحوّل حضور المتجر إلى علامة منظمة وواثقة.",
  deliverables: ["لوحة هوية", "حزمة إطلاق"],
  timeline: "7 أيام عمل",
  price: "1,850 ر.س",
  priceNote: "سعر ثابت",
  outreach: "مرحبًا، أود مشاركة باقة مركزة لهوية متجركم.",
  clarityScore: 88,
};

function createContext(userId = 41): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      name: "مستخدم اختبار",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("حدود محترف وقوالب العرض", () => {
  it("يرفض القوالب والتقرير قبل الوصول إلى أي مستودع عندما لا يؤكد الخادم الاستحقاق", async () => {
    entitlements.getProAccess.mockResolvedValue({ isEntitled: false, state: "purchase_setup_required", purchaseAvailable: false });
    entitlements.requireProAccess.mockRejectedValue(new TRPCError({ code: "FORBIDDEN" }));
    const caller = appRouter.createCaller(createContext());

    await expect(caller.offerTemplates.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.reports.printDocument(offer)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repository.listUserOfferTemplates).not.toHaveBeenCalled();
  });

  it("يسمح للخادم المستحق بحفظ قالب تابع للحساب فقط ويهرب نص التقرير", async () => {
    entitlements.getProAccess.mockResolvedValue({ isEntitled: true, state: "active", purchaseAvailable: false });
    entitlements.requireProAccess.mockResolvedValue({ isEntitled: true, state: "active", purchaseAvailable: false });
    repository.createUserOfferTemplate.mockResolvedValue({ id: 7, userId: 41, name: "قالب متجر", dataJson: JSON.stringify(offer) });
    const caller = appRouter.createCaller(createContext());

    await caller.offerTemplates.create({ name: "قالب متجر", offer });
    expect(repository.createUserOfferTemplate).toHaveBeenCalledWith(41, {
      name: "قالب متجر",
      dataJson: JSON.stringify(offer),
    });

    const report = await caller.reports.printDocument({ ...offer, title: '<script>alert("x")</script>' });
    expect(report.html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(report.html).not.toContain("<script>alert");
    expect(report.html).toContain("@page { size: A4;");
  });
});
