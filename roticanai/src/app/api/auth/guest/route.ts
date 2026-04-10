import { Effect } from "effect";
import { NextResponse } from "next/server";
import { runHandler } from "@/lib/effect";
import { getOrCreateGuestUser, logoutGuest } from "@/lib/services/guest";

/**
 * POST /api/auth/guest
 *
 * Creates a guest user (or returns existing one from cookie).
 * Sets an httpOnly cookie with the guest user ID.
 */
export const POST = () =>
  runHandler(
    getOrCreateGuestUser().pipe(
      Effect.map((guest) => ({
        id: guest.id,
        name: guest.name,
        isGuest: true,
        isNew: guest.isNew,
      })),
    ),
  );

/**
 * DELETE /api/auth/guest
 *
 * Deletes the current guest user, clears guest auth cookies,
 * and preserves only the browser quota cookie.
 */
export async function DELETE() {
  await Effect.runPromise(logoutGuest());
  return new NextResponse(null, { status: 204 });
}
