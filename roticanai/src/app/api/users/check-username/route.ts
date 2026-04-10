import { Effect } from "effect";
import {
  CheckUsernameParams,
  parseSearchParams,
  runAuthHandler,
  tryPromise,
} from "@/lib/effect";
import { checkUsernameAvailability } from "@/lib/services/user-profile";

/**
 * GET /api/users/check-username?username=x - Check username availability
 *
 * Requires authentication (need userId to exclude current user).
 */
export const GET = (req: Request) =>
  runAuthHandler(
    (session) =>
      Effect.gen(function* () {
        const { username } = yield* parseSearchParams(CheckUsernameParams, req);
        const result = yield* tryPromise({
          try: () => checkUsernameAvailability(username, session.user.id),
          message: "Failed to check username",
        });
        return result;
      }),
    "api-users-check-username",
  );
