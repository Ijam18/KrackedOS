import { Effect } from "effect";
import { NotFoundError, runAuthHandler } from "@/lib/effect";
import {
  ConflictError,
  InternalError,
  ValidationError,
} from "@/lib/effect/errors";
import { markAppGitHubPushed, verifyAppOwnership } from "@/lib/services";
import {
  getAppGitHubStatus,
  pushAppToLinkedRepo,
  requireGitHubPushAccess,
} from "@/lib/services/github";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const mapGitHubError = (error: unknown) => {
  if (
    error instanceof ConflictError ||
    error instanceof ValidationError ||
    error instanceof NotFoundError
  ) {
    return error;
  }

  return new InternalError({
    message: error instanceof Error ? error.message : "GitHub push failed",
    cause: error,
  });
};

export const POST = (_req: Request, context: RouteContext) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { id: appId } = yield* Effect.promise(() => context.params);
      const ownedApp = yield* verifyAppOwnership(appId, session.user.id);
      const token = yield* Effect.tryPromise({
        try: () => requireGitHubPushAccess(session.user.id),
        catch: mapGitHubError,
      });

      const pushResult = yield* Effect.tryPromise({
        try: () => pushAppToLinkedRepo(token, ownedApp),
        catch: mapGitHubError,
      });

      const updated = yield* Effect.tryPromise({
        try: () =>
          markAppGitHubPushed(
            appId,
            session.user.id,
            new Date(pushResult.pushedAt),
          ),
        catch: (error) =>
          new InternalError({
            message: "Failed to update app push timestamp",
            cause: error,
          }),
      });

      if (!updated) {
        return yield* Effect.fail(
          new NotFoundError({ resource: "App", id: ownedApp.id }),
        );
      }

      const status = yield* Effect.tryPromise({
        try: () => getAppGitHubStatus(updated, session.user.id),
        catch: mapGitHubError,
      });

      return {
        ...status,
        pushResult,
      };
    }),
  );
