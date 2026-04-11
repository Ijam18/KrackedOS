import { Effect } from "effect";
import {
  ListInsposParams,
  parseSearchParams,
  runHandler,
  ValidationError,
} from "@/lib/effect";
import {
  getInspos,
  type InspoCategory,
  isValidCategory,
} from "@/lib/services/inspo";

/**
 * GET /api/inspo - List inspos with optional category filter
 *
 * Query params:
 *   - category?: 'games' | 'productivity' | 'utilities' | 'creative'
 */
export const GET = (req: Request) =>
  runHandler(
    Effect.gen(function* () {
      const params = yield* parseSearchParams(ListInsposParams, req);

      // Validate category if provided
      let category: InspoCategory | undefined;
      if (params.category) {
        if (!isValidCategory(params.category)) {
          return yield* Effect.fail(
            new ValidationError({
              field: "category",
              message: `Invalid category. Must be one of: games, productivity, utilities, creative`,
            }),
          );
        }
        category = params.category;
      }

      const inspos = yield* getInspos(category);

      return { inspos };
    }),
  );
