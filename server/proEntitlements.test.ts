import { describe, expect, it } from "vitest";
import { resolveProAccess } from "./proEntitlements";

describe("سياسة استحقاق محترف", () => {
  const now = new Date("2026-10-31T08:45:00.000Z");

  it("تفشل مغلقة عند غياب سجل الاشتراك أو انتهاء الفترة أو إلغائها", () => {
    expect(resolveProAccess(undefined, now)).toMatchObject({ isEntitled: false, state: "purchase_setup_required", purchaseAvailable: false });
    expect(resolveProAccess({ status: "active", currentPeriodEndsAt: new Date("2026-10-31T08:44:59.999Z") }, now)).toMatchObject({ isEntitled: false, state: "expired" });
    expect(resolveProAccess({ status: "cancelled", currentPeriodEndsAt: new Date("2026-11-30T00:00:00.000Z") }, now)).toMatchObject({ isEntitled: false, state: "cancelled" });
  });

  it("لا يسمح إلا باشتراك نشط لم تنته فترته وفق توقيت UTC", () => {
    expect(resolveProAccess({ status: "active", currentPeriodEndsAt: new Date("2026-10-31T08:45:00.001Z") }, now)).toMatchObject({ isEntitled: true, state: "active", purchaseAvailable: false });
  });
});
