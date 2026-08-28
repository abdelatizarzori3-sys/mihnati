import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertOffer, InsertUser, offers, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/** بيانات إدخال العرض بعد التحقق في الموجّه. */
export type SavedOfferInput = Omit<InsertOffer, "id" | "userId" | "createdAt" | "updatedAt">;

function requireDatabase<T>(database: T | null): T {
  if (!database) {
    throw new Error("قاعدة بيانات مِهنتي غير متاحة حالياً. حاول مرة أخرى لاحقاً.");
  }
  return database;
}

/** يعيد آخر عروض المستخدم فقط؛ لا يملك هذا الاستعلام مساراً لقبول هوية مستخدم آخر. */
export async function listUserOffers(userId: number) {
  const db = requireDatabase(await getDb());
  return db
    .select()
    .from(offers)
    .where(eq(offers.userId, userId))
    .orderBy(desc(offers.updatedAt), desc(offers.id))
    .limit(50);
}

/** ينشئ عرضاً ويعيد السجل الذي ينتمي لصاحبه فقط. */
export async function createUserOffer(userId: number, input: SavedOfferInput) {
  const db = requireDatabase(await getDb());
  const result = await db.insert(offers).values({ ...input, userId });
  const insertId = Number(result[0].insertId);
  const saved = await db
    .select()
    .from(offers)
    .where(and(eq(offers.id, insertId), eq(offers.userId, userId)))
    .limit(1);

  if (!saved[0]) {
    throw new Error("تعذر تأكيد حفظ العرض.");
  }
  return saved[0];
}

/** يعدّل العرض ضمن حساب مالكه فقط؛ يعيد undefined عند عدم ملكية السجل أو غيابه. */
export async function updateUserOffer(userId: number, offerId: number, input: SavedOfferInput) {
  const db = requireDatabase(await getDb());
  const result = await db.update(offers).set(input).where(and(eq(offers.id, offerId), eq(offers.userId, userId)));
  if (Number(result[0].affectedRows) === 0) return undefined;

  const updated = await db
    .select()
    .from(offers)
    .where(and(eq(offers.id, offerId), eq(offers.userId, userId)))
    .limit(1);

  return updated[0];
}

/** يحذف عرضاً إذا وفقط إذا كان معرّف المستخدم يطابق مالك السجل. */
export async function deleteUserOffer(userId: number, offerId: number) {
  const db = requireDatabase(await getDb());
  const result = await db.delete(offers).where(and(eq(offers.id, offerId), eq(offers.userId, userId)));
  return Number(result[0].affectedRows) > 0;
}
