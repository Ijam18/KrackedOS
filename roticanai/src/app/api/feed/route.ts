import { Effect } from "effect";
import {
  ListFeedParams,
  parseSearchParams,
  runHandler,
  tryPromise,
} from "@/lib/effect";
import { getPublishedApps } from "@/lib/services/feed";

/**
 * GET /api/feed - List published apps for the social feed
 *
 * Query params:
 *   - sort?: 'recent' | 'popular' (default: 'recent')
 *   - limit?: number (default: 20, max: 50)
 *   - offset?: number (default: 0)
 */
export const GET = (req: Request) =>
  runHandler(
    Effect.gen(function* () {
      const params = yield* parseSearchParams(ListFeedParams, req);

      const sort = params.sort ?? "recent";
      const limit = Math.min(parseInt(params.limit || "20", 10), 50);
      const offset = parseInt(params.offset || "0", 10);

      const result = yield* tryPromise({
        try: () => getPublishedApps({ sort, limit, offset }),
        message: "Failed to fetch feed",
      });

      return result;
    }),
    "api-feed-list",
  );
