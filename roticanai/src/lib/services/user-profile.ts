import { and, desc, eq, or, sql } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "@/db";
import { app, user } from "@/db/schema";
import { NotFoundError, tryPromise, ValidationError } from "@/lib/effect";
import { logger } from "@/lib/telemetry";

// =============================================================================
// Types
// =============================================================================

export interface PublicProfile {
  id: string;
  username: string | null;
  name: string;
  image: string | null;
  bio: string | null;
  createdAt: Date;
  stats: {
    totalApps: number;
    totalLikes: number;
    totalViews: number;
  };
}

export interface ProfileApp {
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
}

// =============================================================================
// Username Validation
// =============================================================================

const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "app",
  "apps",
  "auth",
  "blog",
  "dashboard",
  "explore",
  "feed",
  "guest",
  "help",
  "home",
  "inspo",
  "login",
  "me",
  "new",
  "null",
  "profile",
  "root",
  "search",
  "settings",
  "signup",
  "status",
  "support",
  "system",
  "u",
  "undefined",
  "user",
  "users",
  "www",
]);

function validateUsername(
  username: string,
): { valid: true } | { valid: false; reason: string } {
  if (username.length < USERNAME_MIN) {
    return { valid: false, reason: "Too short — at least 3 characters" };
  }
  if (username.length > USERNAME_MAX) {
    return { valid: false, reason: "Too long — 30 characters max" };
  }
  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      reason:
        "Only lowercase letters, numbers, and hyphens (cannot start or end with a hyphen)",
    };
  }
  if (username.includes("--")) {
    return { valid: false, reason: "Cannot contain consecutive hyphens" };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { valid: false, reason: "This username is reserved" };
  }
  return { valid: true };
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Get a public profile by username or userId.
 * Looks up by username first, then falls back to userId.
 * Only returns non-guest users.
 */
export async function getPublicProfile(
  usernameOrId: string,
): Promise<{ profile: PublicProfile; apps: ProfileApp[] } | null> {
  // Try to find the user by username first, then by ID
  const rows = await db
    .select({
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
      bio: user.bio,
      isGuest: user.isGuest,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(
      or(
        eq(user.username, usernameOrId.toLowerCase()),
        eq(user.id, usernameOrId),
      ),
    )
    .limit(1);

  const found = rows[0];
  if (!found || found.isGuest) return null;

  // Fetch their published apps
  const publishedApps = await db
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
    })
    .from(app)
    .where(
      and(
        eq(app.userId, found.id),
        eq(app.isPublished, true),
        eq(app.status, "active"),
      ),
    )
    .orderBy(desc(app.publishedAt));

  // Aggregate stats
  const statsResult = await db
    .select({
      totalApps: sql<number>`count(*)::int`,
      totalLikes: sql<number>`coalesce(sum(${app.likeCount}), 0)::int`,
      totalViews: sql<number>`coalesce(sum(${app.viewCount}), 0)::int`,
    })
    .from(app)
    .where(
      and(
        eq(app.userId, found.id),
        eq(app.isPublished, true),
        eq(app.status, "active"),
      ),
    );

  const stats = statsResult[0] ?? {
    totalApps: 0,
    totalLikes: 0,
    totalViews: 0,
  };

  return {
    profile: {
      id: found.id,
      username: found.username,
      name: found.name,
      image: found.image,
      bio: found.bio,
      createdAt: found.createdAt,
      stats,
    },
    apps: publishedApps,
  };
}

// =============================================================================
// Username Availability
// =============================================================================

/**
 * Check if a username is available.
 */
export async function checkUsernameAvailability(
  username: string,
  currentUserId: string,
): Promise<{ available: boolean; reason?: string }> {
  const trimmed = username.trim().toLowerCase();

  const validation = validateUsername(trimmed);
  if (!validation.valid) {
    return { available: false, reason: validation.reason };
  }

  // Check if already taken by another user
  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, trimmed))
    .limit(1);

  if (existing.length > 0 && existing[0].id !== currentUserId) {
    return { available: false, reason: "Already taken" };
  }

  return { available: true };
}

// =============================================================================
// Profile Updates
// =============================================================================

/**
 * Update the current user's profile.
 */
export const updateProfile = (
  userId: string,
  data: { username?: string | null; bio?: string | null },
) =>
  Effect.gen(function* () {
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    // Validate and set username
    if (data.username !== undefined) {
      if (data.username === null || data.username === "") {
        updates.username = null;
      } else {
        const trimmed = data.username.trim().toLowerCase();
        const validation = validateUsername(trimmed);
        if (!validation.valid) {
          return yield* Effect.fail(
            new ValidationError({
              field: "username",
              message: validation.reason,
            }),
          );
        }

        // Check uniqueness
        const existing = yield* tryPromise({
          try: () =>
            db
              .select({ id: user.id })
              .from(user)
              .where(eq(user.username, trimmed))
              .limit(1),
          message: "Failed to check username",
        });

        if (existing.length > 0 && existing[0].id !== userId) {
          return yield* Effect.fail(
            new ValidationError({
              field: "username",
              message: "Already taken",
            }),
          );
        }

        updates.username = trimmed;
      }
    }

    // Validate and set bio
    if (data.bio !== undefined) {
      if (data.bio === null || data.bio === "") {
        updates.bio = null;
      } else {
        const trimmed = data.bio.trim();
        if (trimmed.length > 160) {
          return yield* Effect.fail(
            new ValidationError({
              field: "bio",
              message: "Bio must be 160 characters or less",
            }),
          );
        }
        updates.bio = trimmed;
      }
    }

    const [updated] = yield* tryPromise({
      try: () =>
        db.update(user).set(updates).where(eq(user.id, userId)).returning({
          id: user.id,
          username: user.username,
          name: user.name,
          image: user.image,
          bio: user.bio,
        }),
      message: "Failed to update profile",
    });

    if (!updated) {
      return yield* Effect.fail(
        new NotFoundError({ resource: "User", id: userId }),
      );
    }

    logger.info("Profile updated", { userId, updates: Object.keys(data) });
    return updated;
  });
