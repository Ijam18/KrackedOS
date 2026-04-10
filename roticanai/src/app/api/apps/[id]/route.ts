import { Effect } from "effect";
import {
  DeleteAppParams,
  NotFoundError,
  parseBody,
  parseSearchParams,
  runAuthHandler,
  tryPromise,
  UpdateAppRequest,
} from "@/lib/effect";
import {
  archiveApp,
  deleteApp,
  getApp,
  updateApp,
  updateAppSlug,
} from "@/lib/services/app";
import { getMessagesForApp } from "@/lib/services/message";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/apps/[id] - Get app with messages
 */
export const GET = (_req: Request, context: RouteContext) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { id: appId } = yield* Effect.promise(() => context.params);

      const app = yield* tryPromise({
        try: () => getApp(appId, session.user.id),
        message: "Failed to fetch app",
      });

      if (!app) {
        return yield* Effect.fail(
          new NotFoundError({ resource: "App", id: appId }),
        );
      }

      const messages = yield* tryPromise({
        try: () => getMessagesForApp(appId),
        message: "Failed to fetch messages",
      });

      return { ...app, messages };
    }),
  );

/**
 * PATCH /api/apps/[id] - Update app
 */
export const PATCH = (req: Request, context: RouteContext) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { id: appId } = yield* Effect.promise(() => context.params);
      const body = yield* parseBody(UpdateAppRequest, req);

      // Handle slug update separately (requires validation)
      if (body.slug !== undefined) {
        const updated = yield* updateAppSlug(appId, session.user.id, body.slug);
        return updated;
      }

      // Handle other updates
      const { slug: _slug, ...otherUpdates } = body;
      const updated = yield* tryPromise({
        try: () => updateApp(appId, session.user.id, otherUpdates),
        message: "Failed to update app",
      });

      if (!updated) {
        return yield* Effect.fail(
          new NotFoundError({ resource: "App", id: appId }),
        );
      }

      return updated;
    }),
  );

/**
 * DELETE /api/apps/[id] - Delete or archive app
 */
export const DELETE = (req: Request, context: RouteContext) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { id: appId } = yield* Effect.promise(() => context.params);
      const params = yield* parseSearchParams(DeleteAppParams, req);

      const permanent = params.permanent === "true";

      const success = yield* tryPromise({
        try: () =>
          permanent
            ? deleteApp(appId, session.user.id)
            : archiveApp(appId, session.user.id),
        message: permanent ? "Failed to delete app" : "Failed to archive app",
      });

      if (!success) {
        return yield* Effect.fail(
          new NotFoundError({ resource: "App", id: appId }),
        );
      }

      return { success: true, permanent };
    }),
  );
