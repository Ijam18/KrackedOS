import { Effect } from "effect";
import { runAuthHandler } from "@/lib/effect";
import { getDailyUsageForActor, getUsageActor } from "@/lib/services/usage";

/**
 * GET /api/usage - Get current user's usage stats
 *
 * Returns:
 * - daily: { used, limit, remaining, resetsAt }
 */
export const GET = () =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const usageActor = yield* getUsageActor(session.user.id);
      const daily = yield* getDailyUsageForActor(usageActor);

      return {
        daily: {
          ...daily,
          resetsAt: daily.resetsAt.toISOString(),
        },
      };
    }),
  );
