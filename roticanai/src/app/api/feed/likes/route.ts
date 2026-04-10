import { Effect } from "effect";
import {
  BatchLikesRequest,
  getSession,
  parseBody,
  runHandler,
  tryPromise,
} from "@/lib/effect";
import { checkUserLikes } from "@/lib/services/feed";

/**
 * POST /api/feed/likes - Batch check which apps the current user has liked
 *
 * Body: { appIds: string[] }
 * Returns: { liked: Record<string, boolean> }
 *
 * If the user is not authenticated, returns all false.
 */
export const POST = (req: Request) =>
  runHandler(
    Effect.gen(function* () {
      const { appIds } = yield* parseBody(BatchLikesRequest, req);

      // Cap at 50 to prevent abuse
      const ids = appIds.slice(0, 50);

      const session = yield* getSession;

      if (!session) {
        // Not authenticated — nothing is liked
        const liked: Record<string, boolean> = {};
        for (const id of ids) {
          liked[id] = false;
        }
        return { liked };
      }

      const likedSet = yield* tryPromise({
        try: () => checkUserLikes(ids, session.user.id),
        message: "Failed to check likes",
      });

      const liked: Record<string, boolean> = {};
      for (const id of ids) {
        liked[id] = likedSet.has(id);
      }

      return { liked };
    }),
    "api-feed-likes-batch",
  );
