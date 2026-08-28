import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const repository = vi.hoisted(() => ({
  listUserOffers: vi.fn(),
  createUserOffer: vi.fn(),
  updateUserOffer: vi.fn(),
  deleteUserOffer: vi.fn(),
}));

vi.mock("./db", () => repository);

import { appRouter } from "./routers";

const sampleOffer = {
  clientName: "متجر أثير",
  sector: "تجارة إلكترونية",
  tags: ["إطلاق", "متجر"],
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
  outreach: "مرحباً، أود مشاركة باقة مركزة لهوية متجركم.",
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

describe("عروض مِهنتي المحفوظة", () => {
  it("يحفظ العرض تحت هوية المستخدم في السياق ولا يقبل هوية من العميل", async () => {
    repository.createUserOffer.mockResolvedValue({ id: 9, userId: 41, ...sampleOffer });
    const caller = appRouter.createCaller(createContext(41));

    await caller.offers.create(sampleOffer);

    expect(repository.createUserOffer).toHaveBeenCalledWith(41, expect.objectContaining({
      title: sampleOffer.title,
      deliverablesJson: JSON.stringify(sampleOffer.deliverables),
      tagsJson: JSON.stringify(sampleOffer.tags),
    }));
  });

  it("يقرأ ويعدل ويحذف السجلات ضمن صاحب الجلسة نفسه", async () => {
    repository.listUserOffers.mockResolvedValue([{ id: 9, userId: 41, title: sampleOffer.title }]);
    repository.updateUserOffer.mockResolvedValue({ id: 9, userId: 41, title: "باقة محدّثة" });
    repository.deleteUserOffer.mockResolvedValue(true);
    const caller = appRouter.createCaller(createContext(41));

    await expect(caller.offers.list()).resolves.toEqual([{ id: 9, userId: 41, title: sampleOffer.title }]);
    await expect(caller.offers.update({ ...sampleOffer, id: 9, title: "باقة محدّثة" })).resolves.toEqual({ offer: { id: 9, userId: 41, title: "باقة محدّثة" } });
    await expect(caller.offers.delete({ id: 9 })).resolves.toEqual({ deleted: true });
    expect(repository.listUserOffers).toHaveBeenCalledWith(41);
    expect(repository.updateUserOffer).toHaveBeenCalledWith(41, 9, expect.objectContaining({ tagsJson: JSON.stringify(sampleOffer.tags), title: "باقة محدّثة" }));
    expect(repository.deleteUserOffer).toHaveBeenCalledWith(41, 9);
  });
});
