import { Effect } from "effect";
import { headers } from "next/headers";
import { auth, type Session } from "@/lib/core/auth/server";
import { getGuestIdFromCookie } from "@/lib/services/guest";
import { AuthError, UnauthenticatedError } from "./errors";

export type { Session };

/**
 * Get the current session (may be null if not authenticated)
 * Checks Better Auth session first, then falls back to guest cookie.
 */
export const getSession: Effect.Effect<Session | null, AuthError> =
  Effect.tryPromise({
    try: async () => {
      // Try Better Auth session first
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (session) return session;

      // Fall back to guest cookie
      const guestId = await getGuestIdFromCookie();
      if (guestId) {
        // Construct a minimal session-like object for guest users
        return {
          session: {
            id: `guest-session-${guestId}`,
            userId: guestId,
            token: "",
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
            ipAddress: null,
            userAgent: null,
          },
          user: {
            id: guestId,
            name: "Guest",
            email: `${guestId}@guest.local`,
            emailVerified: false,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isGuest: true,
          },
        } as Session;
      }

      return null;
    },
    catch: (error) =>
      new AuthError({
        message: "Failed to get session",
        cause: error,
      }),
  });

/**
 * Require authentication - fails with UnauthenticatedError if no session
 */
export const requireAuth: Effect.Effect<
  Session,
  AuthError | UnauthenticatedError
> = Effect.gen(function* () {
  const session = yield* getSession;
  if (!session) {
    return yield* Effect.fail(new UnauthenticatedError());
  }
  return session;
});

/**
 * Get the current user from session (requires authentication)
 */
export const requireUser = Effect.map(requireAuth, (session) => session.user);
