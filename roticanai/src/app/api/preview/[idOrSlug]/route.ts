import { Effect } from "effect";
import { NotFoundError, runHandler, tryPromise } from "@/lib/effect";
import { getAppByIdOrSlug } from "@/lib/services/app";

type RouteContext = {
  params: Promise<{ idOrSlug: string }>;
};

/**
 * GET /api/preview/[idOrSlug] - Get preview info for an app (public, no auth)
 * Used by Cloudflare Worker to lookup Modal tunnel URL.
 *
 * This endpoint is optimistic - it returns the previewUrl without health checking.
 * The Worker will try to proxy and handle failures by showing the loading page.
 * This removes ~3s latency from the health check on every request.
 */
export const GET = (_req: Request, context: RouteContext) =>
  runHandler(
    Effect.gen(function* () {
      const { idOrSlug } = yield* Effect.promise(() => context.params);

      const app = yield* tryPromise({
        try: () => getAppByIdOrSlug(idOrSlug),
        message: "Failed to fetch app",
      });

      if (!app) {
        return yield* Effect.fail(
          new NotFoundError({ resource: "App", id: idOrSlug }),
        );
      }

      // Determine status optimistically based on DB state
      // We don't health-check here - the Worker will handle proxy failures
      let status: "live" | "dead" | "no-snapshot";

      if (app.sandboxId && app.previewUrl) {
        // Assume live if we have sandbox data - Worker will verify by proxying
        status = "live";
      } else if (app.snapshotId) {
        // No sandbox but has snapshot - can be woken
        status = "dead";
      } else {
        // No snapshot - cannot be started
        status = "no-snapshot";
      }

      return {
        appId: app.id,
        previewUrl: app.previewUrl,
        sandboxId: app.sandboxId,
        snapshotId: app.snapshotId,
        status,
      };
    }),
  );
