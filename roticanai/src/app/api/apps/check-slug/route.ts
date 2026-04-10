import { Effect } from "effect";
import {
  CheckSlugParams,
  parseSearchParams,
  runAuthHandler,
} from "@/lib/effect";
import { checkSlugAvailabilityEffect } from "@/lib/services";

/**
 * GET /api/apps/check-slug - Check if a slug is available
 * Query params: ?slug=xxx&appId=xxx (appId to exclude current app when editing)
 */
export const GET = (req: Request) =>
  runAuthHandler(() =>
    Effect.gen(function* () {
      const params = yield* parseSearchParams(CheckSlugParams, req);

      const result = yield* checkSlugAvailabilityEffect(
        params.slug,
        params.appId,
      );

      return result;
    }),
  );
