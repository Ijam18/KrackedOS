import { Effect } from "effect";
import { runAuthHandler, tryPromise } from "@/lib/effect";
import { checkUserLike, toggleLike } from "@/lib/services/feed";

/**
 * POST /api/apps/[id]/like - Toggle like on an app
 */
export const POST = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) =>
  runAuthHandler(
    (session) =>
      Effect.gen(function* () {
        const { id: appId } = yield* Effect.promise(() => params);
        const result = yield* toggleLike(appId, session.user.id);
        return result;
      }),
    "api-app-like-toggle",
  );

/**
 * GET /api/apps/[id]/like - Check if current user liked this app
 */
export const GET = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) =>
  runAuthHandler(
    (session) =>
      Effect.gen(function* () {
        const { id: appId } = yield* Effect.promise(() => params);
        const liked = yield* tryPromise({
          try: () => checkUserLike(appId, session.user.id),
          message: "Failed to check like status",
        });
        return { liked };
      }),
    "api-app-like-check",
  );
