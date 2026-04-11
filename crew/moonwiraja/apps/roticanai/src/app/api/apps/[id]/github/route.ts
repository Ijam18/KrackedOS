import { Effect } from "effect";
import { NotFoundError, runAuthHandler } from "@/lib/effect";
import {
  ConflictError,
  InternalError,
  ValidationError,
} from "@/lib/effect/errors";
import { clearAppGitHubLink, verifyAppOwnership } from "@/lib/services";
import { getAppGitHubStatus } from "@/lib/services/github";

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
    message: error instanceof Error ? error.message : "GitHub request failed",
    cause: error,
  });
};

export const GET = (_req: Request, context: RouteContext) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { id: appId } = yield* Effect.promise(() => context.params);
      const ownedApp = yield* verifyAppOwnership(appId, session.user.id);

      return yield* Effect.tryPromise({
        try: () => getAppGitHubStatus(ownedApp, session.user.id),
        catch: mapGitHubError,
      });
    }),
  );

export const DELETE = (_req: Request, context: RouteContext) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { id: appId } = yield* Effect.promise(() => context.params);
      yield* verifyAppOwnership(appId, session.user.id);

      const updated = yield* Effect.tryPromise({
        try: () => clearAppGitHubLink(appId, session.user.id),
        catch: (error) =>
          new InternalError({
            message: "Failed to unlink GitHub repository",
            cause: error,
          }),
      });

      if (!updated) {
        return yield* Effect.fail(
          new NotFoundError({ resource: "App", id: appId }),
        );
      }

      return {
        success: true,
      };
    }),
  );
