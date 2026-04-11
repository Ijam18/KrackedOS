import { and, desc, eq, sql } from "drizzle-orm";
import { Effect } from "effect";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { app, appLike, user } from "@/db/schema";
import { NotFoundError, tryPromise, ValidationError } from "@/lib/effect";
import { logger } from "@/lib/telemetry";

// =============================================================================
// Types
// =============================================================================

export interface FeedApp {
  id: string;
  title: string | null;
  description: string | null;
  slug: string | null;
  thumbnailKey: string | null;
  likeCount: number;
  viewCount: number;
  remixCount: number;
  remixedFromId: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  author: {
    id: string;
    username: string | null;
    name: string;
    image: string | null;
  };
}

export interface FeedResult {
  apps: FeedApp[];
  total: number;
  hasMore: boolean;
}

// =============================================================================
// Feed Queries
// =============================================================================

/**
 * Get published apps for the social feed.
 * Supports sorting by recent or popular.
 */
export async function getPublishedApps(options: {
  sort?: "recent" | "popular";
  limit?: number;
  offset?: number;
}): Promise<FeedResult> {
  const { sort = "recent", limit = 20, offset = 0 } = options;

  const orderBy =
    sort === "popular"
      ? [desc(app.likeCount), desc(app.publishedAt)]
      : [desc(app.publishedAt)];

  const conditions = and(eq(app.isPublished, true), eq(app.status, "active"));

  const [apps, countResult] = await Promise.all([
    db
      .select({
        id: app.id,
        title: app.title,
        description: app.description,
        slug: app.slug,
        thumbnailKey: app.thumbnailKey,
        likeCount: app.likeCount,
        viewCount: app.viewCount,
        remixCount: app.remixCount,
        remixedFromId: app.remixedFromId,
        publishedAt: app.publishedAt,
        createdAt: app.createdAt,
        authorId: user.id,
        authorUsername: user.username,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(app)
      .innerJoin(user, eq(app.userId, user.id))
      .where(conditions)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(app)
      .where(conditions),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    apps: apps.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      slug: row.slug,
      thumbnailKey: row.thumbnailKey,
      likeCount: row.likeCount,
      viewCount: row.viewCount,
      remixCount: row.remixCount,
      remixedFromId: row.remixedFromId,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      author: {
        id: row.authorId,
        username: row.authorUsername,
        name: row.authorName,
        image: row.authorImage,
      },
    })),
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Get a single published app by ID, with author info.
 * Returns null if not found or not published.
 */
export async function getPublishedAppById(
  appId: string,
): Promise<FeedApp | null> {
  const rows = await db
    .select({
      id: app.id,
      title: app.title,
      description: app.description,
      slug: app.slug,
      thumbnailKey: app.thumbnailKey,
      likeCount: app.likeCount,
      viewCount: app.viewCount,
      remixCount: app.remixCount,
      remixedFromId: app.remixedFromId,
      publishedAt: app.publishedAt,
      createdAt: app.createdAt,
      authorId: user.id,
      authorUsername: user.username,
      authorName: user.name,
      authorImage: user.image,
    })
    .from(app)
    .innerJoin(user, eq(app.userId, user.id))
    .where(
      and(
        eq(app.id, appId),
        eq(app.isPublished, true),
        eq(app.status, "active"),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    slug: row.slug,
    thumbnailKey: row.thumbnailKey,
    likeCount: row.likeCount,
    viewCount: row.viewCount,
    remixCount: row.remixCount,
    remixedFromId: row.remixedFromId,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    author: {
      id: row.authorId,
      username: row.authorUsername,
      name: row.authorName,
      image: row.authorImage,
    },
  };
}

/**
 * Get published apps by a specific author, excluding a specific app ID.
 * Used for "More from author" sections.
 */
export async function getPublishedAppsByAuthor(
  authorId: string,
  excludeAppId: string,
  limit: number = 6,
): Promise<FeedApp[]> {
  const rows = await db
    .select({
      id: app.id,
      title: app.title,
      description: app.description,
      slug: app.slug,
      thumbnailKey: app.thumbnailKey,
      likeCount: app.likeCount,
      viewCount: app.viewCount,
      remixCount: app.remixCount,
      remixedFromId: app.remixedFromId,
      publishedAt: app.publishedAt,
      createdAt: app.createdAt,
      authorId: user.id,
      authorUsername: user.username,
      authorName: user.name,
      authorImage: user.image,
    })
    .from(app)
    .innerJoin(user, eq(app.userId, user.id))
    .where(
      and(
        eq(app.userId, authorId),
        eq(app.isPublished, true),
        eq(app.status, "active"),
        sql`${app.id} != ${excludeAppId}`,
      ),
    )
    .orderBy(desc(app.publishedAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    slug: row.slug,
    thumbnailKey: row.thumbnailKey,
    likeCount: row.likeCount,
    viewCount: row.viewCount,
    remixCount: row.remixCount,
    remixedFromId: row.remixedFromId,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    author: {
      id: row.authorId,
      username: row.authorUsername,
      name: row.authorName,
      image: row.authorImage,
    },
  }));
}

// =============================================================================
// Publish / Unpublish
// =============================================================================

/**
 * Publish an app to the social feed.
 * Requires ownership. App must have a title and thumbnail to be published.
 */
export const publishApp = (appId: string, userId: string) =>
  Effect.gen(function* () {
    // Verify ownership
    const existing = yield* tryPromise({
      try: () =>
        db.query.app.findFirst({
          where: and(eq(app.id, appId), eq(app.userId, userId)),
        }),
      message: "Failed to fetch app",
    });

    if (!existing) {
      return yield* Effect.fail(
        new NotFoundError({ resource: "App", id: appId }),
      );
    }

    if (!existing.title) {
      return yield* Effect.fail(
        new ValidationError({
          field: "title",
          message: "App must have a title before publishing",
        }),
      );
    }

    const [updated] = yield* tryPromise({
      try: () =>
        db
          .update(app)
          .set({
            isPublished: true,
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(app.id, appId), eq(app.userId, userId)))
          .returning(),
      message: "Failed to publish app",
    });

    logger.info("App published to feed", { appId, userId });
    return updated;
  });

/**
 * Unpublish an app from the social feed.
 */
export const unpublishApp = (appId: string, userId: string) =>
  Effect.gen(function* () {
    const [updated] = yield* tryPromise({
      try: () =>
        db
          .update(app)
          .set({
            isPublished: false,
            publishedAt: null,
            updatedAt: new Date(),
          })
          .where(and(eq(app.id, appId), eq(app.userId, userId)))
          .returning(),
      message: "Failed to unpublish app",
    });

    if (!updated) {
      return yield* Effect.fail(
        new NotFoundError({ resource: "App", id: appId }),
      );
    }

    logger.info("App unpublished from feed", { appId, userId });
    return updated;
  });

// =============================================================================
// Likes
// =============================================================================

/**
 * Toggle like on an app. Returns the new like state.
 */
export const toggleLike = (appId: string, userId: string) =>
  Effect.gen(function* () {
    // Check if already liked
    const existing = yield* tryPromise({
      try: () =>
        db.query.appLike.findFirst({
          where: and(eq(appLike.appId, appId), eq(appLike.userId, userId)),
        }),
      message: "Failed to check like status",
    });

    if (existing) {
      // Unlike: delete the like and decrement count
      yield* tryPromise({
        try: () => db.delete(appLike).where(eq(appLike.id, existing.id)),
        message: "Failed to remove like",
      });

      yield* tryPromise({
        try: () =>
          db.execute(sql`
            UPDATE app
            SET like_count = GREATEST(like_count - 1, 0), updated_at = NOW()
            WHERE id = ${appId}
          `),
        message: "Failed to update like count",
      });

      logger.info("App unliked", { appId, userId });
      return { liked: false };
    }

    // Like: insert a new like and increment count
    yield* tryPromise({
      try: () =>
        db.insert(appLike).values({
          id: nanoid(12),
          appId,
          userId,
        }),
      message: "Failed to add like",
    });

    yield* tryPromise({
      try: () =>
        db.execute(sql`
          UPDATE app
          SET like_count = like_count + 1, updated_at = NOW()
          WHERE id = ${appId}
        `),
      message: "Failed to update like count",
    });

    logger.info("App liked", { appId, userId });
    return { liked: true };
  });

/**
 * Check if a user has liked an app.
 */
export async function checkUserLike(
  appId: string,
  userId: string,
): Promise<boolean> {
  const existing = await db.query.appLike.findFirst({
    where: and(eq(appLike.appId, appId), eq(appLike.userId, userId)),
    columns: { id: true },
  });
  return !!existing;
}

/**
 * Check likes for multiple apps at once (for feed rendering).
 */
export async function checkUserLikes(
  appIds: string[],
  userId: string,
): Promise<Set<string>> {
  if (appIds.length === 0) return new Set();

  const likes = await db
    .select({ appId: appLike.appId })
    .from(appLike)
    .where(and(sql`${appLike.appId} IN ${appIds}`, eq(appLike.userId, userId)));

  return new Set(likes.map((l) => l.appId));
}

// =============================================================================
// View Count
// =============================================================================

/**
 * Increment view count for a published app.
 * Fire-and-forget, no error propagation.
 */
export async function incrementViewCount(appId: string): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE app
      SET view_count = view_count + 1
      WHERE id = ${appId} AND is_published = true
    `);
  } catch (error) {
    // Silently fail - view count is not critical
    logger.error("Failed to increment view count", { appId, error });
  }
}

// =============================================================================
// Remix
// =============================================================================

/**
 * Create a remix (copy) of a published app.
 * Copies the description/prompt, links back to the original via remixed_from_id,
 * and increments the original's remix count.
 */
export const remixApp = (appId: string, userId: string) =>
  Effect.gen(function* () {
    // Fetch the source app (must be published)
    const source = yield* tryPromise({
      try: () =>
        db.query.app.findFirst({
          where: and(eq(app.id, appId), eq(app.isPublished, true)),
        }),
      message: "Failed to fetch source app",
    });

    if (!source) {
      return yield* Effect.fail(
        new NotFoundError({ resource: "App", id: appId }),
      );
    }

    const newId = nanoid(12);

    // Create the remixed app
    const [created] = yield* tryPromise({
      try: () =>
        db
          .insert(app)
          .values({
            id: newId,
            userId,
            title: source.title ? `Remix of ${source.title}` : null,
            description: source.description,
            enhancedPrompt: source.enhancedPrompt,
            remixedFromId: appId,
            status: "active",
          })
          .returning(),
      message: "Failed to create remixed app",
    });

    // Increment the source app's remix count
    yield* tryPromise({
      try: () =>
        db.execute(sql`
          UPDATE app
          SET remix_count = remix_count + 1, updated_at = NOW()
          WHERE id = ${appId}
        `),
      message: "Failed to update remix count",
    });

    logger.info("App remixed", {
      sourceAppId: appId,
      newAppId: newId,
      userId,
    });

    return created;
  });
