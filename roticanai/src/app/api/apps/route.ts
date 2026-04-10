import { Effect } from "effect";
import {
  CreateAppRequest,
  ListAppsParams,
  parseBody,
  parseSearchParams,
  runAuthHandler,
  tryPromise,
  ValidationError,
} from "@/lib/effect";
import { scheduleEnhancePrompt } from "@/lib/services/ai/enhance";
import { scheduleGenerateTitle } from "@/lib/services/ai/title";
import { createApp, getAppsForUser } from "@/lib/services/app";
import { checkDailyLimitForActor, getUsageActor } from "@/lib/services/usage";
import { validatePrompt } from "@/lib/validation/prompt";

/**
 * POST /api/apps - Create a new app
 */
export const POST = (req: Request) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      // Check daily message limit
      const usageActor = yield* getUsageActor(session.user.id);
      yield* checkDailyLimitForActor(usageActor);

      const body = yield* parseBody(CreateAppRequest, req);
      const initialPrompt = body.initialPrompt?.trim();

      if (initialPrompt) {
        const validationError = validatePrompt(initialPrompt);
        if (validationError) {
          return yield* Effect.fail(
            new ValidationError({
              field: "body.initialPrompt",
              message: validationError,
            }),
          );
        }
      }

      const app = yield* tryPromise({
        try: () =>
          createApp(session.user.id, {
            title: body.title,
            description: initialPrompt,
          }),
        message: "Failed to create app",
      });

      // Schedule AI tasks in background (fire-and-forget)
      if (initialPrompt) {
        if (!body.title) {
          scheduleGenerateTitle(app.id, initialPrompt);
        }
        scheduleEnhancePrompt(app.id, initialPrompt);
      }

      return app;
    }),
  );

/**
 * GET /api/apps - List user's apps
 */
export const GET = (req: Request) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const params = yield* parseSearchParams(ListAppsParams, req);

      const status = params.status as "active" | "archived" | undefined;
      const limit = Math.min(parseInt(params.limit || "50", 10), 100);
      const offset = parseInt(params.offset || "0", 10);

      const apps = yield* tryPromise({
        try: () => getAppsForUser(session.user.id, { status, limit, offset }),
        message: "Failed to fetch apps",
      });

      return { apps };
    }),
  );
