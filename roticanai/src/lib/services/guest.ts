import { and, eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { db } from "@/db";
import { app, dailyUsage, user } from "@/db/schema";
import { GUEST_FLAG_COOKIE_NAME } from "@/features/auth/constants";
import { InternalError } from "@/lib/effect";
import { logger } from "@/lib/telemetry";

// =============================================================================
// Constants
// =============================================================================

export const GUEST_COOKIE_NAME = "guest_id";
export const GUEST_QUOTA_COOKIE_NAME = "guest_quota_id";
/** Guest cookie expires in 7 days */
const GUEST_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
/** Guest quota cookie persists across guest logouts */
const GUEST_QUOTA_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

const BASE_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// =============================================================================
// Cookie Operations (Effect-wrapped)
// =============================================================================

const getGuestCookie = Effect.tryPromise({
  try: async () => {
    const cookieStore = await cookies();
    return cookieStore.get(GUEST_COOKIE_NAME)?.value ?? null;
  },
  catch: (cause) =>
    new InternalError({ message: "Failed to read guest cookie", cause }),
});

const getGuestQuotaCookie = Effect.tryPromise({
  try: async () => {
    const cookieStore = await cookies();
    return cookieStore.get(GUEST_QUOTA_COOKIE_NAME)?.value ?? null;
  },
  catch: (cause) =>
    new InternalError({ message: "Failed to read guest quota cookie", cause }),
});

const setGuestCookie = (guestId: string) =>
  Effect.tryPromise({
    try: async () => {
      const cookieStore = await cookies();
      cookieStore.set(GUEST_COOKIE_NAME, guestId, {
        ...BASE_COOKIE_OPTIONS,
        httpOnly: true,
        maxAge: GUEST_COOKIE_MAX_AGE,
      });
    },
    catch: (cause) =>
      new InternalError({ message: "Failed to set guest cookie", cause }),
  });

const setGuestQuotaCookie = (quotaKey: string) =>
  Effect.tryPromise({
    try: async () => {
      const cookieStore = await cookies();
      cookieStore.set(GUEST_QUOTA_COOKIE_NAME, quotaKey, {
        ...BASE_COOKIE_OPTIONS,
        httpOnly: true,
        maxAge: GUEST_QUOTA_COOKIE_MAX_AGE,
      });
    },
    catch: (cause) =>
      new InternalError({
        message: "Failed to set guest quota cookie",
        cause,
      }),
  });

const deleteGuestCookie = Effect.tryPromise({
  try: async () => {
    const cookieStore = await cookies();
    cookieStore.set(GUEST_COOKIE_NAME, "", {
      ...BASE_COOKIE_OPTIONS,
      httpOnly: true,
      maxAge: 0,
    });
  },
  catch: (cause) =>
    new InternalError({ message: "Failed to clear guest cookie", cause }),
});

const deleteGuestFlagCookie = Effect.tryPromise({
  try: async () => {
    const cookieStore = await cookies();
    cookieStore.set(GUEST_FLAG_COOKIE_NAME, "", {
      ...BASE_COOKIE_OPTIONS,
      maxAge: 0,
    });
  },
  catch: (cause) =>
    new InternalError({ message: "Failed to clear guest flag cookie", cause }),
});

// =============================================================================
// Public API (for use outside Effect pipelines)
// =============================================================================

/**
 * Get the guest user ID from the cookie.
 * Used in server components and route handlers that don't use Effect.
 */
export const getGuestIdFromCookie = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE_NAME)?.value ?? null;
};

export const getGuestQuotaIdFromCookie = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_QUOTA_COOKIE_NAME)?.value ?? null;
};

/**
 * Clear the guest cookie (non-Effect version for auth hooks).
 */
export const clearGuestCookie = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(GUEST_COOKIE_NAME, "", {
    ...BASE_COOKIE_OPTIONS,
    httpOnly: true,
    maxAge: 0,
  });
};

// =============================================================================
// Guest User Management
// =============================================================================

const getOrCreateGuestQuotaId = (): Effect.Effect<string, InternalError> =>
  Effect.gen(function* () {
    const existingQuotaKey = yield* getGuestQuotaCookie;

    if (existingQuotaKey) {
      return existingQuotaKey;
    }

    const quotaKey = `gq_${nanoid(16)}`;
    yield* setGuestQuotaCookie(quotaKey);
    return quotaKey;
  });

/**
 * Create a new guest user in the database.
 */
const createGuestUser = Effect.tryPromise({
  try: async () => {
    const id = `guest_${nanoid(16)}`;
    const name = `Guest-${nanoid(6)}`;
    const email = `${id}@guest.local`;

    await db.insert(user).values({
      id,
      name,
      email,
      emailVerified: false,
      isGuest: true,
    });

    logger.info("Guest user created", { guestId: id });
    return { id, name };
  },
  catch: (cause) =>
    new InternalError({ message: "Failed to create guest user", cause }),
});

/**
 * Look up an existing guest user by ID.
 */
const findGuestUser = (guestId: string) =>
  Effect.tryPromise({
    try: async () => {
      const existing = await db.query.user.findFirst({
        where: eq(user.id, guestId),
      });
      return existing?.isGuest
        ? { id: existing.id, name: existing.name }
        : null;
    },
    catch: (cause) =>
      new InternalError({ message: "Failed to find guest user", cause }),
  });

/**
 * Get or create a guest user based on the cookie.
 * If a valid guest cookie exists and the user still exists, return it.
 * Otherwise, create a new guest user and set the cookie.
 */
export const getOrCreateGuestUser = (): Effect.Effect<
  { id: string; name: string; isNew: boolean },
  InternalError
> =>
  Effect.gen(function* () {
    yield* getOrCreateGuestQuotaId();

    const existingGuestId = yield* getGuestCookie;

    if (existingGuestId) {
      const existing = yield* findGuestUser(existingGuestId);
      if (existing) {
        return { ...existing, isNew: false };
      }
    }

    const guest = yield* createGuestUser;
    yield* setGuestCookie(guest.id);
    return { ...guest, isNew: true };
  });

export const logoutGuest = (): Effect.Effect<void, InternalError> =>
  Effect.gen(function* () {
    const guestId = yield* getGuestCookie;

    if (guestId) {
      yield* Effect.tryPromise({
        try: () =>
          db
            .delete(user)
            .where(and(eq(user.id, guestId), eq(user.isGuest, true))),
        catch: (cause) =>
          new InternalError({ message: "Failed to delete guest user", cause }),
      });
    }

    yield* deleteGuestCookie;
    yield* deleteGuestFlagCookie;
  });

/**
 * Merge a guest user's data into an authenticated user's account.
 * Transfers all apps, merges daily usage, then deletes the guest user.
 */
export const mergeGuestIntoUser = (
  guestId: string,
  realUserId: string,
  guestQuotaKey?: string | null,
): Effect.Effect<{ appsTransferred: number }, InternalError> =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: async () => {
        // Transfer apps
        const transferred = await db
          .update(app)
          .set({ userId: realUserId, updatedAt: new Date() })
          .where(eq(app.userId, guestId))
          .returning({ id: app.id });

        // Merge daily usage (upsert: add counts on conflict)
        await db.execute(sql`
					INSERT INTO daily_usage (id, user_id, date, message_count, created_at, updated_at)
					SELECT id, ${realUserId}, date, message_count, created_at, NOW()
					FROM daily_usage
					WHERE user_id = ${guestId}
					ON CONFLICT (user_id, date)
					DO UPDATE SET
						message_count = daily_usage.message_count + EXCLUDED.message_count,
						updated_at = NOW()
				`);

        if (guestQuotaKey) {
          await db.execute(sql`
						INSERT INTO daily_usage (id, user_id, date, message_count, created_at, updated_at)
						SELECT id, ${realUserId}, date, message_count, created_at, NOW()
						FROM guest_daily_usage
						WHERE quota_key = ${guestQuotaKey}
						ON CONFLICT (user_id, date)
						DO UPDATE SET
							message_count = daily_usage.message_count + EXCLUDED.message_count,
							updated_at = NOW()
					`);
        }

        // Clean up guest daily_usage rows
        await db.delete(dailyUsage).where(eq(dailyUsage.userId, guestId));

        // Delete the guest user (cascades sessions)
        await db.delete(user).where(eq(user.id, guestId));

        logger.info("Guest merged into user", {
          guestId,
          realUserId,
          appsTransferred: transferred.length,
        });
        return { appsTransferred: transferred.length };
      },
      catch: (cause) =>
        new InternalError({
          message: "Failed to merge guest into user",
          cause,
        }),
    });

    yield* deleteGuestCookie;
    yield* deleteGuestFlagCookie;
    return result;
  });
