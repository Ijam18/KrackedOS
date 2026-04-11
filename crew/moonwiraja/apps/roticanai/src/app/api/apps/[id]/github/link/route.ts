import { Effect } from "effect";
import {
  LinkGitHubRepoRequest,
  NotFoundError,
  parseBody,
  runAuthHandler,
} from "@/lib/effect";
import {
  ConflictError,
  InternalError,
  ValidationError,
} from "@/lib/effect/errors";
import { setAppGitHubLink, verifyAppOwnership } from "@/lib/services";
import {
  createPersonalPublicRepo,
  getAppGitHubStatus,
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
    message: error instanceof Error ? error.message : "GitHub request failed",
    cause: error,
  });
};

export const POST = (req: Request, context: RouteContext) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { id: appId } = yield* Effect.promise(() => context.params);
      const body = yield* parseBody(LinkGitHubRepoRequest, req);
      const ownedApp = yield* verifyAppOwnership(appId, session.user.id);
      const token = yield* Effect.tryPromise({
        try: () => requireGitHubPushAccess(session.user.id),
        catch: mapGitHubError,
      });

      const link = yield* Effect.tryPromise({
        try: () =>
          createPersonalPublicRepo(token, body.repoName, body.description),
        catch: mapGitHubError,
      });

      const updated = yield* Effect.tryPromise({
        try: () => setAppGitHubLink(appId, session.user.id, link),
        catch: (error) =>
          new InternalError({
            message: "Failed to store GitHub repo linkage",
            cause: error,
          }),
      });

      if (!updated) {
        return yield* Effect.fail(
          new NotFoundError({ resource: "App", id: ownedApp.id }),
        );
      }

      return yield* Effect.tryPromise({
        try: () => getAppGitHubStatus(updated, session.user.id),
        catch: mapGitHubError,
      });
    }),
  );
