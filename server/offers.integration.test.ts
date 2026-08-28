import { inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { users } from "../drizzle/schema";
import { createUserOffer, deleteUserOffer, getDb, listUserOffers, updateUserOffer } from "./db";

const shouldRun = process.env.RUN_DB_INTEGRATION === "1";
const suite = shouldRun ? describe : describe.skip;
const testStamp = `mihnati-integration-${Date.now()}`;
const createdUserIds: number[] = [];

const payload = {
  clientName: "متجر اختبار",
  sector: "تجارة إلكترونية",
  tagsJson: JSON.stringify(["إطلاق", "رمضان"]),
  skill: "كتابة صفحات هبوط",
  audience: "متاجر إلكترونية ناشئة",
  outcome: "زيادة طلبات الاستشارة من الموقع",
  model: "project",
  title: "باقة كتابة صفحات هبوط المركّزة",
  promise: "نساعد المتاجر الناشئة على تحويل الزيارة إلى محادثة بيع أوضح.",
  deliverablesJson: JSON.stringify(["جلسة فهم سريعة", "نسخة صفحة هبوط", "مراجعة واحدة"]),
  timeline: "7 أيام عمل",
  price: "1,850 ر.س",
  priceNote: "سعر مشروع ثابت",
  outreach: "مرحباً، أود مشاركة باقة مركزة تساعدكم على رفع طلبات الاستشارة.",
  clarityScore: 88,
} as const;

suite("تكامل قاعدة بيانات عروض مِهنتي", () => {
  let ownerOneId = 0;
  let ownerTwoId = 0;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("قاعدة بيانات الاختبار غير متاحة.");

    const [ownerOne] = await db.insert(users).values({ openId: `${testStamp}-a`, name: "اختبار أ", role: "user" });
    const [ownerTwo] = await db.insert(users).values({ openId: `${testStamp}-b`, name: "اختبار ب", role: "user" });
    ownerOneId = Number(ownerOne.insertId);
    ownerTwoId = Number(ownerTwo.insertId);
    createdUserIds.push(ownerOneId, ownerTwoId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (db && createdUserIds.length) {
      await db.delete(users).where(inArray(users.id, createdUserIds));
    }
  });

  it("يحفظ العرض ويعيده لمالكه", async () => {
    const saved = await createUserOffer(ownerOneId, payload);
    expect(saved.userId).toBe(ownerOneId);
    expect(saved.title).toBe(payload.title);
    expect(saved.tagsJson).toBe(payload.tagsJson);

    const visibleToOwner = await listUserOffers(ownerOneId);
    expect(visibleToOwner.some((offer) => offer.id === saved.id)).toBe(true);
  });

  it("يعزل العروض بين الحسابات ويرفض تعديل أو حذف مستخدم لعرض مستخدم آخر", async () => {
    const privateOffer = await createUserOffer(ownerTwoId, { ...payload, title: "عرض خاص بالحساب الثاني" });
    const ownerOneOffers = await listUserOffers(ownerOneId);

    expect(ownerOneOffers.some((offer) => offer.id === privateOffer.id)).toBe(false);
    await expect(updateUserOffer(ownerOneId, privateOffer.id, { ...payload, title: "تعديل غير مصرح" })).resolves.toBeUndefined();
    await expect(deleteUserOffer(ownerOneId, privateOffer.id)).resolves.toBe(false);
    const updated = await updateUserOffer(ownerTwoId, privateOffer.id, { ...payload, title: "عرض محدّث", tagsJson: JSON.stringify(["عميل مهم", "متجر"]) });
    expect(updated?.title).toBe("عرض محدّث");
    expect(updated?.tagsJson).toBe(JSON.stringify(["عميل مهم", "متجر"]));
    await expect(deleteUserOffer(ownerTwoId, privateOffer.id)).resolves.toBe(true);
  });
});
