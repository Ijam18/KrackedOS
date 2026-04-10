import { Effect } from "effect";
import { NextResponse } from "next/server";
import { parseSearchParams, requireAuth, SessionIdParam } from "@/lib/effect";
import { verifyAppOwnership } from "@/lib/services";
import { debugDevServerStatus } from "@/lib/services/sandbox";

export async function GET(req: Request) {
  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const session = yield* requireAuth;
      const params = yield* parseSearchParams(SessionIdParam, req);
      yield* verifyAppOwnership(params.sessionId, session.user.id);

      const status = yield* debugDevServerStatus(params.sessionId);
      return status;
    }).pipe(Effect.either),
  );

  if (result._tag === "Left") {
    const error = result.left;
    const status =
      error._tag === "UnauthenticatedError" || error._tag === "AuthError"
        ? 401
        : error._tag === "NotFoundError"
          ? 404
          : 400;

    return NextResponse.json({ error: error._tag }, { status });
  }

  return NextResponse.json(result.right);
}
