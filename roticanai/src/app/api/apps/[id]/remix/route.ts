import { Effect } from "effect";
import { runAuthHandler } from "@/lib/effect";
import { remixApp } from "@/lib/services/feed";

/**
 * POST /api/apps/[id]/remix - Create a remix of a published app
 */
export const POST = (
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) =>
  runAuthHandler(
    (session) =>
      Effect.gen(function* () {
        const { id: appId } = yield* Effect.promise(() => params);
        const newApp = yield* remixApp(appId, session.user.id);
        return { app: newApp };
      }),
    "api-app-remix",
  );
