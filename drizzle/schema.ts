import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
