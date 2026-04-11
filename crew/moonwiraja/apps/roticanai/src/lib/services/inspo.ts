import { asc, desc, eq } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "@/db";
import { type Inspo, inspo } from "@/db/schema";
import { tryPromise } from "@/lib/effect";

/**
 * Valid inspo categories
 */
export const INSPO_CATEGORIES = [
  "games",
  "productivity",
  "utilities",
  "creative",
] as const;

export type InspoCategory = (typeof INSPO_CATEGORIES)[number];

/**
 * Check if a string is a valid inspo category
 */
export const isValidCategory = (value: string): value is InspoCategory =>
  INSPO_CATEGORIES.includes(value as InspoCategory);

/**
 * Get all inspos, optionally filtered by category.
 * Returns inspos ordered by sortOrder (asc), then createdAt (desc).
 */
export const getInspos = (category?: InspoCategory) =>
  tryPromise({
    try: async (): Promise<Inspo[]> => {
      const conditions = category ? eq(inspo.category, category) : undefined;

      return db.query.inspo.findMany({
        where: conditions,
        orderBy: [asc(inspo.sortOrder), desc(inspo.createdAt)],
      });
    },
    message: "Failed to fetch inspos",
  });

/**
 * Get featured inspos only.
 * Useful for displaying on the home page.
 */
export const getFeaturedInspos = (limit = 6) =>
  tryPromise({
    try: async (): Promise<Inspo[]> =>
      db.query.inspo.findMany({
        where: eq(inspo.featured, true),
        orderBy: [asc(inspo.sortOrder), desc(inspo.createdAt)],
        limit,
      }),
    message: "Failed to fetch featured inspos",
  });

/**
 * Get a single inspo by ID.
 * Returns null if not found.
 */
export const getInspo = (id: string) =>
  tryPromise({
    try: async (): Promise<Inspo | null> => {
      const result = await db.query.inspo.findFirst({
        where: eq(inspo.id, id),
      });
      return result ?? null;
    },
    message: "Failed to fetch inspo",
  });

/**
 * Get inspo by ID, failing with NotFoundError if not found.
 */
export const getInspoOrFail = (id: string) =>
  Effect.gen(function* () {
    const result = yield* getInspo(id);
    if (!result) {
      return yield* Effect.fail({
        _tag: "NotFoundError" as const,
        resource: "Inspo",
        id,
      });
    }
    return result;
  });
