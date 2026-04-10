import { Effect } from "effect";
import { PublishAppRequest, parseBody, runAuthHandler } from "@/lib/effect";
import { publishApp, unpublishApp } from "@/lib/services/feed";

/**
 * POST /api/apps/[id]/publish - Publish or unpublish an app to/from the feed
 *
 * Body: { published: boolean }
 */
export const POST = (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) =>
  runAuthHandler(
    (session) =>
      Effect.gen(function* () {
        const { id: appId } = yield* Effect.promise(() => params);
        const body = yield* parseBody(PublishAppRequest, req);

        if (body.published) {
          const updated = yield* publishApp(appId, session.user.id);
          return { published: true, app: updated };
        }

        const updated = yield* unpublishApp(appId, session.user.id);
        return { published: false, app: updated };
      }),
    "api-app-publish",
  );
