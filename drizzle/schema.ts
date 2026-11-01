import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * عروض مِهنتي المحفوظة. كل سجل مقيد بـ userId ويُقرأ/يُحذف دائماً عبر
 * إجراءات محمية تضيف نفس المعرف إلى شرط الاستعلام، فلا تنتقل العروض بين الحسابات.
 */
export const offers = mysqlTable(
  "offers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    clientName: varchar("clientName", { length: 160 }).notNull().default(""),
    sector: varchar("sector", { length: 120 }).notNull().default(""),
    tagsJson: varchar("tagsJson", { length: 1024 }).notNull().default("[]"),
    skill: varchar("skill", { length: 255 }).notNull(),
    audience: varchar("audience", { length: 255 }).notNull(),
    outcome: text("outcome").notNull(),
    model: varchar("model", { length: 24 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    promise: text("promise").notNull(),
    deliverablesJson: text("deliverablesJson").notNull(),
    timeline: varchar("timeline", { length: 120 }).notNull(),
    price: varchar("price", { length: 80 }).notNull(),
    priceNote: varchar("priceNote", { length: 160 }).notNull(),
    outreach: text("outreach").notNull(),
    clarityScore: int("clarityScore").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("offers_user_updated_idx").on(table.userId, table.updatedAt)],
);

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

/**
 * سجل الاستحقاق الذي يحدّثه موصل دفع موثوق مستقبلاً فقط. لا تقرأ الواجهة
 * هذا الجدول مباشرة ولا يوجد إجراء tRPC يمنح أو يعدّل حالته.
 */
export const subscriptionEntitlements = mysqlTable(
  "subscriptionEntitlements",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 64 }).notNull(),
    externalCustomerId: varchar("externalCustomerId", { length: 255 }),
    externalSubscriptionId: varchar("externalSubscriptionId", { length: 255 }).unique(),
    status: mysqlEnum("status", ["active", "past_due", "cancelled", "expired"]).notNull(),
    currentPeriodEndsAt: timestamp("currentPeriodEndsAt"),
    cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("subscription_entitlements_status_idx").on(table.status, table.currentPeriodEndsAt)],
);

export type SubscriptionEntitlement = typeof subscriptionEntitlements.$inferSelect;

/** قوالب شخصية قابلة لإعادة الاستخدام، لا تظهر ولا تعدّل إلا داخل حساب مالكها. */
export const offerTemplates = mysqlTable(
  "offerTemplates",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    dataJson: text("dataJson").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("offer_templates_user_updated_idx").on(table.userId, table.updatedAt)],
);

export type OfferTemplate = typeof offerTemplates.$inferSelect;
export type InsertOfferTemplate = typeof offerTemplates.$inferInsert;
