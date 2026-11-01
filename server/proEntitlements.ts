import { TRPCError } from "@trpc/server";
import { getUserSubscriptionEntitlement } from "./db";

export type ProAccessState = "active" | "past_due" | "cancelled" | "expired" | "purchase_setup_required";

export type ProAccess = {
  isEntitled: boolean;
  state: ProAccessState;
  purchaseAvailable: false;
};

type SubscriptionRecord = {
  status: "active" | "past_due" | "cancelled" | "expired";
  currentPeriodEndsAt: Date | null;
};

/**
 * المصدر الوحيد لاستحقاق Pro هو سجل اشتراك محفوظ على الخادم ومربوط بالحساب.
 * لا توجد حالة عميل أو معلمة رابط أو دور إداري يمكن أن تغير هذه النتيجة.
 */
export function resolveProAccess(subscription: SubscriptionRecord | undefined, now = new Date()): ProAccess {
  if (!subscription) {
    return { isEntitled: false, state: "purchase_setup_required", purchaseAvailable: false };
  }

  if (subscription.status === "active") {
    if (subscription.currentPeriodEndsAt && subscription.currentPeriodEndsAt.getTime() > now.getTime()) {
      return { isEntitled: true, state: "active", purchaseAvailable: false };
    }
    return { isEntitled: false, state: "expired", purchaseAvailable: false };
  }

  return { isEntitled: false, state: subscription.status, purchaseAvailable: false };
}

/**
 * لا يكفي نجاح تسجيل الدخول: تُقرأ صلاحية الاشتراك من الخادم في كل طلب Pro.
 * عند غياب قاعدة البيانات أو الموصل أو السجل، تعود النتيجة غير مستحقة افتراضياً.
 */
export async function getProAccess(userId: number): Promise<ProAccess> {
  const subscription = await getUserSubscriptionEntitlement(userId);
  return resolveProAccess(subscription);
}

export async function requireProAccess(userId: number): Promise<ProAccess> {
  const access = await getProAccess(userId);
  if (!access.isEntitled) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "تتطلب هذه الميزة اشتراك محترف نشطًا تم التحقق منه عبر الخادم.",
    });
  }
  return access;
}
