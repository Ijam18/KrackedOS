import { Effect } from "effect";
import { NextResponse } from "next/server";
import {
  parseBody,
  requireAuth,
  StreamRequest,
  streamToSseResponse,
} from "@/lib/effect";
import { verifyAppOwnership } from "@/lib/services";
import { createSetupStream } from "@/lib/services/sandbox";

export async function POST(req: Request) {
  // Validate auth and params
  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const session = yield* requireAuth;
      const body = yield* parseBody(StreamRequest, req);
      const app = yield* verifyAppOwnership(body.sessionId, session.user.id);

      return { sessionId: body.sessionId, isReconnect: !!app.sandboxId };
    }).pipe(Effect.either),
  );

  if (result._tag === "Left") {
    const error = result.left;
    const status =
      error._tag === "UnauthenticatedError" || error._tag === "AuthError"
        ? 401
        : error._tag === "NotFoundError"
          ? 404
          : error._tag === "ValidationError"
            ? 400
            : 500;

    return NextResponse.json(
      { error: error._tag, field: "field" in error ? error.field : undefined },
      { status },
    );
  }

  const { sessionId, isReconnect } = result.right;

  // Create and return the SSE stream
  return streamToSseResponse(createSetupStream({ sessionId, isReconnect }));
}
