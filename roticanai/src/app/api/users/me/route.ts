import { Effect } from "effect";
import { parseBody, runAuthHandler, UpdateProfileRequest } from "@/lib/effect";
import { updateProfile } from "@/lib/services/user-profile";

/**
 * PATCH /api/users/me - Update the current user's profile
 *
 * Body: { username?: string | null, bio?: string | null }
 */
export const PATCH = (req: Request) =>
  runAuthHandler(
    (session) =>
      Effect.gen(function* () {
        const data = yield* parseBody(UpdateProfileRequest, req);
        return yield* updateProfile(session.user.id, data);
      }),
    "api-users-me-update",
  );
