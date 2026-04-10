import { and, eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { dailyUsage, guestDailyUsage } from "@/db/schema";
import { InternalError, RateLimitError } from "@/lib/effect";
import { getSession } from "@/lib/effect/auth";
import { getGuestQuotaIdFromCookie } from "@/lib/services/guest";
import { appMetrics, logger } from "@/lib/telemetry";

// =============================================================================
// Configuration
// =============================================================================

const DAILY_MESSAGE_LIMIT_AUTHENTICATED = 10;
const DAILY_MESSAGE_LIMIT_GUEST = 3;
const TIMEZONE = "Asia/Kuala_Lumpur";

/**
 * Get the daily message limit for a user.
 * Guest users (id starts with "guest_") get a lower limit.
 */
export const getDailyMessageLimit = (userId: string): number =>
  userId.startsWith("guest_")
    ? DAILY_MESSAGE_LIMIT_GUEST
    : DAILY_MESSAGE_LIMIT_AUTHENTICATED;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get current date string in KL timezone.
 * Format: "2026-01-28"
 */
export const getKLDate = (): string =>
  new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });

/**
 * Get the start of the next day in KL timezone as a UTC Date.
 * This is used to tell users when their limit resets.
 */
export const getNextKLMidnight = (): Date => {
  const klDate = getKLDate();
  const [year, month, day] = klDate.split("-").map(Number);
  // Create date at midnight KL time next day (UTC+8)
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
  // Adjust for KL timezone (UTC+8) - subtract 8 hours to get UTC time
  nextDay.setUTCHours(nextDay.getUTCHours() - 8);
  return nextDay;
};

type UsageActor =
  | {
      type: "user";
      userId: string;
    }
  | {
      type: "guest";
      userId: string;
      quotaKey: string;
    };

// =============================================================================
// Effect-based Database Operations
// =============================================================================

export const getUsageActor = (
  userId: string,
): Effect.Effect<UsageActor, InternalError> =>
  userId.startsWith("guest_")
    ? Effect.tryPromise({
        try: async () => ({
          type: "guest" as const,
          userId,
          quotaKey: (await getGuestQuotaIdFromCookie()) ?? userId,
        }),
        catch: (cause) =>
          new InternalError({
            message: "Failed to resolve guest usage actor",
            cause,
          }),
      })
    : Effect.succeed({
        type: "user",
        userId,
      });

/**
 * Get today's usage record for a user.
 * Returns null if no record exists for today.
 */
export const getDailyUsageRecord = (
  actor: UsageActor,
): Effect.Effect<{ messageCount: number } | null, InternalError> =>
  Effect.tryPromise({
    try: async () => {
      const today = getKLDate();

      if (actor.type === "guest") {
        const result = await db.query.guestDailyUsage.findFirst({
          where: and(
            eq(guestDailyUsage.quotaKey, actor.quotaKey),
            eq(guestDailyUsage.date, today),
          ),
        });
        return result ?? null;
      }

      const result = await db.query.dailyUsage.findFirst({
        where: and(
          eq(dailyUsage.userId, actor.userId),
          eq(dailyUsage.date, today),
        ),
      });
      return result ?? null;
    },
    catch: (cause) =>
      new InternalError({ message: "Failed to fetch daily usage", cause }),
  });

/**
 * Get today's usage stats for a user.
 * Returns count, limit, and remaining messages.
 */
export const getDailyUsageForActor = (
  actor: UsageActor,
): Effect.Effect<
  { used: number; limit: number; remaining: number; resetsAt: Date },
  InternalError
> =>
  getDailyUsageRecord(actor).pipe(
    Effect.map((record) => {
      const used = record?.messageCount ?? 0;
      const limit = getDailyMessageLimit(actor.userId);
      return {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        resetsAt: getNextKLMidnight(),
      };
    }),
  );

export const getDailyUsage = (
  userId: string,
): Effect.Effect<
  { used: number; limit: number; remaining: number; resetsAt: Date },
  InternalError
> =>
  getUsageActor(userId).pipe(
    Effect.flatMap((actor) => getDailyUsageForActor(actor)),
  );

/**
 * Check if user has remaining daily messages.
 * Fails with RateLimitError if limit exceeded.
 */
export const checkDailyLimitForActor = (
  actor: UsageActor,
): Effect.Effect<
  { remaining: number; resetsAt: Date },
  InternalError | RateLimitError
> =>
  getDailyUsageForActor(actor).pipe(
    Effect.flatMap((usage) =>
      usage.remaining > 0
        ? Effect.succeed({
            remaining: usage.remaining,
            resetsAt: usage.resetsAt,
          })
        : Effect.tap(
            Effect.fail(
              new RateLimitError({
                message: "Daily message limit reached",
                remaining: 0,
                resetsAt: usage.resetsAt.toISOString(),
              }),
            ),
            () =>
              Effect.sync(() => {
                logger.warn("Rate limit exceeded", {
                  userId: actor.userId,
                  limit: usage.limit,
                  resetsAt: usage.resetsAt.toISOString(),
                });
                appMetrics.recordRateLimit("daily_message", actor.userId);
              }),
          ),
    ),
  );

export const checkDailyLimit = (
  userId: string,
): Effect.Effect<
  { remaining: number; resetsAt: Date },
  InternalError | RateLimitError
> =>
  getUsageActor(userId).pipe(
    Effect.flatMap((actor) => checkDailyLimitForActor(actor)),
  );

/**
 * Increment the daily message count for a user.
 * Creates a new record if one doesn't exist for today.
 * Uses upsert with atomic increment to handle race conditions.
 */
export const incrementDailyUsageForActor = (
  actor: UsageActor,
): Effect.Effect<void, InternalError> =>
  Effect.tryPromise({
    try: async () => {
      const today = getKLDate();
      const id = nanoid(12);

      if (actor.type === "guest") {
        await db.execute(sql`
          INSERT INTO guest_daily_usage (id, quota_key, date, message_count, created_at, updated_at)
          VALUES (${id}, ${actor.quotaKey}, ${today}, 1, NOW(), NOW())
          ON CONFLICT (quota_key, date)
          DO UPDATE SET
            message_count = guest_daily_usage.message_count + 1,
            updated_at = NOW()
        `);
        return;
      }

      await db.execute(sql`
        INSERT INTO daily_usage (id, user_id, date, message_count, created_at, updated_at)
        VALUES (${id}, ${actor.userId}, ${today}, 1, NOW(), NOW())
        ON CONFLICT (user_id, date)
        DO UPDATE SET
          message_count = daily_usage.message_count + 1,
          updated_at = NOW()
      `);
    },
    catch: (cause) =>
      new InternalError({ message: "Failed to increment daily usage", cause }),
  });

export const incrementDailyUsage = (
  userId: string,
): Effect.Effect<void, InternalError> =>
  getUsageActor(userId).pipe(
    Effect.flatMap((actor) => incrementDailyUsageForActor(actor)),
  );

// =============================================================================
// Server-side Helpers
// =============================================================================

export interface SerializedDailyUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}

/**
 * Get the current user's daily usage for server-side rendering.
 * Returns null if no session or on error, so the client can fall back to fetching.
 */
export const getServerDailyUsage: Effect.Effect<SerializedDailyUsage | null> =
  getSession.pipe(
    Effect.flatMap((session) =>
      session
        ? getUsageActor(session.user.id).pipe(
            Effect.flatMap((actor) => getDailyUsageForActor(actor)),
            Effect.map((usage) => ({
              ...usage,
              resetsAt: usage.resetsAt.toISOString(),
            })),
          )
        : Effect.succeed(null),
    ),
    Effect.catchAll(() => Effect.succeed(null)),
  );
