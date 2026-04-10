import { Effect } from "effect";
import { NextResponse } from "next/server";
import {
  LogsParams,
  parseSearchParams,
  requireAuth,
  streamToSseResponse,
} from "@/lib/effect";
import { verifyAppOwnership } from "@/lib/services";
import { createLogsStream } from "@/lib/services/sandbox";

export async function GET(req: Request) {
  // Validate auth and params
  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const session = yield* requireAuth;
      const params = yield* parseSearchParams(LogsParams, req);
      yield* verifyAppOwnership(params.sessionId, session.user.id);

      return params;
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

  const { sessionId } = result.right;

  // Create and return the SSE stream
  return streamToSseResponse(createLogsStream(sessionId));
}
