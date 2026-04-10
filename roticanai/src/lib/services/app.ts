import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { Effect } from "effect";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { type App, app, type NewApp } from "@/db/schema";
import { NotFoundError, tryPromise, ValidationError } from "@/lib/effect";
import { appMetrics, logger } from "@/lib/telemetry";

// Reserved slugs that cannot be used
const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "preview",
  "help",
  "support",
  "mail",
  "ftp",
  "static",
  "assets",
  "cdn",
  "status",
  "blog",
  "docs",
]);

// Slug validation: alphanumeric and hyphens, 3-32 chars, can't start/end with hyphen
const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?$/;

/**
 * Validate slug format.
 * Returns null if valid, or an error message if invalid.
 */
export function validateSlugFormat(slug: string): string | null {
  const normalized = slug.toLowerCase();

  if (normalized.length < 3) {
    return "Too short - use at least 3 characters";
  }

  if (normalized.length > 32) {
    return "Too long - keep it under 32 characters";
  }

  if (!SLUG_PATTERN.test(normalized)) {
    return "Only letters, numbers, and hyphens allowed";
  }

  if (RESERVED_SLUGS.has(normalized)) {
    return "This name is reserved";
  }

  return null;
}

/**
 * Create a new app for a user.
 * Returns the created app with its generated ID.
 */
export async function createApp(
  userId: string,
  options?: {
    title?: string;
    description?: string;
  },
): Promise<App> {
  const id = nanoid(12); // Short but collision-resistant ID for URLs

  const newApp: NewApp = {
    id,
    userId,
    title: options?.title ?? null,
    description: options?.description ?? null,
    status: "active",
  };

  const [created] = await db.insert(app).values(newApp).returning();
  logger.info("App created", { appId: id, userId });
  appMetrics.recordAppOp("create");
  return created;
}

/**
 * Get an app by ID, optionally verifying ownership.
 * Returns null if the app doesn't exist or the user doesn't own it.
 */
export async function getApp(
  appId: string,
  userId?: string,
): Promise<App | null> {
  const conditions = userId
    ? and(eq(app.id, appId), eq(app.userId, userId))
    : eq(app.id, appId);

  const result = await db.query.app.findFirst({
    where: conditions,
  });

  return result ?? null;
}

/**
 * Get an app by ID or slug (for public preview access).
 * Case-insensitive lookup since URLs lowercase the subdomain.
 * Returns null if the app doesn't exist.
 */
export async function getAppByIdOrSlug(idOrSlug: string): Promise<App | null> {
  const lowered = idOrSlug.toLowerCase();
  const result = await db.query.app.findFirst({
    where: or(
      sql`lower(${app.id}) = ${lowered}`,
      sql`lower(${app.slug}) = ${lowered}`,
    ),
  });

  return result ?? null;
}

/**
 * Get all apps for a user, ordered by creation date (newest first).
 * Optionally filter by status.
 */
export async function getAppsForUser(
  userId: string,
  options?: {
    status?: "active" | "archived";
    limit?: number;
    offset?: number;
  },
): Promise<App[]> {
  const conditions = options?.status
    ? and(eq(app.userId, userId), eq(app.status, options.status))
    : eq(app.userId, userId);

  return db.query.app.findMany({
    where: conditions,
    orderBy: [desc(app.createdAt)],
    limit: options?.limit,
    offset: options?.offset,
  });
}

/**
 * Update an app's metadata.
 */
export async function updateApp(
  appId: string,
  userId: string,
  updates: {
    title?: string;
    description?: string;
    status?: "active" | "archived";
    sandboxId?: string | null;
  },
): Promise<App | null> {
  const [updated] = await db
    .update(app)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(app.id, appId), eq(app.userId, userId)))
    .returning();

  return updated ?? null;
}

export interface AppGitHubLinkInput {
  repoId: string;
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
}

export async function getAppGitHubLink(
  appId: string,
  userId: string,
): Promise<Pick<
  App,
  | "githubRepoId"
  | "githubRepoOwner"
  | "githubRepoName"
  | "githubRepoUrl"
  | "githubDefaultBranch"
  | "githubLinkedAt"
  | "githubLastPushedAt"
> | null> {
  const result = await db.query.app.findFirst({
    where: and(eq(app.id, appId), eq(app.userId, userId)),
    columns: {
      githubRepoId: true,
      githubRepoOwner: true,
      githubRepoName: true,
      githubRepoUrl: true,
      githubDefaultBranch: true,
      githubLinkedAt: true,
      githubLastPushedAt: true,
    },
  });

  return result ?? null;
}

export async function setAppGitHubLink(
  appId: string,
  userId: string,
  link: AppGitHubLinkInput,
): Promise<App | null> {
  const now = new Date();

  const [updated] = await db
    .update(app)
    .set({
      githubRepoId: link.repoId,
      githubRepoOwner: link.owner,
      githubRepoName: link.name,
      githubRepoUrl: link.url,
      githubDefaultBranch: link.defaultBranch,
      githubLinkedAt: now,
      updatedAt: now,
    })
    .where(and(eq(app.id, appId), eq(app.userId, userId)))
    .returning();

  return updated ?? null;
}

export async function clearAppGitHubLink(
  appId: string,
  userId: string,
): Promise<App | null> {
  const [updated] = await db
    .update(app)
    .set({
      githubRepoId: null,
      githubRepoOwner: null,
      githubRepoName: null,
      githubRepoUrl: null,
      githubDefaultBranch: null,
      githubLinkedAt: null,
      githubLastPushedAt: null,
      updatedAt: new Date(),
    })
    .where(and(eq(app.id, appId), eq(app.userId, userId)))
    .returning();

  return updated ?? null;
}

export async function markAppGitHubPushed(
  appId: string,
  userId: string,
  pushedAt = new Date(),
): Promise<App | null> {
  const [updated] = await db
    .update(app)
    .set({
      githubLastPushedAt: pushedAt,
      updatedAt: pushedAt,
    })
    .where(and(eq(app.id, appId), eq(app.userId, userId)))
    .returning();

  return updated ?? null;
}

/**
 * Update an app's usage statistics.
 * This is called after each assistant message to aggregate token counts.
 */
export async function updateAppUsage(
  appId: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost?: number;
  },
): Promise<void> {
  // Use sql template for atomic increment
  await db.execute(sql`
    UPDATE app
    SET
      total_input_tokens = total_input_tokens + ${usage.inputTokens},
      total_output_tokens = total_output_tokens + ${usage.outputTokens},
      total_cost = total_cost + ${usage.cost ?? 0},
      updated_at = NOW()
    WHERE id = ${appId}
  `);
}

/**
 * Set the sandbox ID for an app.
 * Called when a sandbox is created or reconnected.
 */
export async function setAppSandboxId(
  appId: string,
  sandboxId: string | null,
): Promise<void> {
  await db
    .update(app)
    .set({
      sandboxId,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId));
}

/**
 * Update sandbox-related fields for an app.
 * Called when a Modal sandbox is created or restored.
 */
export async function updateAppSandbox(
  appId: string,
  updates: {
    sandboxId?: string | null;
    snapshotId?: string | null;
    previewUrl?: string | null;
  },
): Promise<void> {
  await db
    .update(app)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId));
}

/**
 * Set the snapshot ID for an app.
 * Called when a filesystem snapshot is created.
 */
export async function setAppSnapshotId(
  appId: string,
  snapshotId: string | null,
): Promise<void> {
  await db
    .update(app)
    .set({
      snapshotId,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId));
}

/**
 * Update an app's thumbnail storage key.
 * Called after capturing a screenshot of the app preview.
 */
export async function updateAppThumbnail(
  appId: string,
  thumbnailKey: string | null,
): Promise<void> {
  await db
    .update(app)
    .set({
      thumbnailKey,
      updatedAt: new Date(),
    })
    .where(eq(app.id, appId));
}

/**
 * Archive an app (soft delete).
 */
export async function archiveApp(
  appId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .update(app)
    .set({
      status: "archived",
      updatedAt: new Date(),
    })
    .where(and(eq(app.id, appId), eq(app.userId, userId)))
    .returning({ id: app.id });

  if (result.length > 0) {
    logger.info("App archived", { appId, userId });
    appMetrics.recordAppOp("archive");
  }
  return result.length > 0;
}

/**
 * Permanently delete an app and all its messages.
 * Messages are deleted via cascade.
 */
export async function deleteApp(
  appId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(app)
    .where(and(eq(app.id, appId), eq(app.userId, userId)))
    .returning({ id: app.id });

  if (result.length > 0) {
    logger.info("App deleted", { appId, userId });
    appMetrics.recordAppOp("delete");
  }
  return result.length > 0;
}

/**
 * Verify user owns the app.
 * Returns the app if found and owned, fails with NotFoundError otherwise.
 */
export const verifyAppOwnership = (appId: string, userId: string) =>
  tryPromise({
    try: () => getApp(appId, userId),
    message: "Failed to verify app ownership",
  }).pipe(
    Effect.flatMap((result) =>
      result
        ? Effect.succeed(result)
        : Effect.fail(new NotFoundError({ resource: "App", id: appId })),
    ),
  );

/**
 * Check if a slug is available (not used by another app).
 * Optionally exclude a specific app ID (for editing existing app's slug).
 */
export async function checkSlugAvailability(
  slug: string,
  excludeAppId?: string,
): Promise<{ available: boolean; reason?: string }> {
  // First validate format
  const formatError = validateSlugFormat(slug);
  if (formatError) {
    return { available: false, reason: formatError };
  }

  const normalized = slug.toLowerCase();

  // Check if slug exists in database
  const conditions = excludeAppId
    ? and(sql`lower(${app.slug}) = ${normalized}`, ne(app.id, excludeAppId))
    : sql`lower(${app.slug}) = ${normalized}`;

  const existing = await db.query.app.findFirst({
    where: conditions,
    columns: { id: true },
  });

  if (existing) {
    return { available: false, reason: "Already taken - try another name" };
  }

  return { available: true };
}

/**
 * Check slug availability as an Effect.
 */
export const checkSlugAvailabilityEffect = (
  slug: string,
  excludeAppId?: string,
) =>
  tryPromise({
    try: () => checkSlugAvailability(slug, excludeAppId),
    message: "Failed to check slug availability",
  });

/**
 * Update an app's slug.
 * Validates format and availability before updating.
 */
export const updateAppSlug = (
  appId: string,
  userId: string,
  slug: string | null,
) =>
  Effect.gen(function* () {
    // If clearing the slug, just update
    if (slug === null || slug === "") {
      const updated = yield* tryPromise({
        try: () =>
          db
            .update(app)
            .set({ slug: null, updatedAt: new Date() })
            .where(and(eq(app.id, appId), eq(app.userId, userId)))
            .returning(),
        message: "Failed to update app slug",
      });

      if (updated.length === 0) {
        return yield* Effect.fail(
          new NotFoundError({ resource: "App", id: appId }),
        );
      }

      return updated[0];
    }

    const normalized = slug.toLowerCase();

    // Check availability (which also validates format)
    const availability = yield* checkSlugAvailabilityEffect(normalized, appId);

    if (!availability.available) {
      return yield* Effect.fail(
        new ValidationError({
          field: "slug",
          message: availability.reason ?? "Slug is not available",
        }),
      );
    }

    // Update the slug
    const updated = yield* tryPromise({
      try: () =>
        db
          .update(app)
          .set({ slug: normalized, updatedAt: new Date() })
          .where(and(eq(app.id, appId), eq(app.userId, userId)))
          .returning(),
      message: "Failed to update app slug",
    });

    if (updated.length === 0) {
      return yield* Effect.fail(
        new NotFoundError({ resource: "App", id: appId }),
      );
    }

    return updated[0];
  });
