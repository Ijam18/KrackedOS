import { Effect } from "effect";
import {
  DeleteExecParams,
  ExecRequest,
  parseBody,
  parseSearchParams,
  runAuthHandler,
  SessionIdParam,
} from "@/lib/effect";
import { verifyAppOwnership } from "@/lib/services";
import {
  exec,
  getSandbox,
  killSession,
  listSessions,
} from "@/lib/services/sandbox";

/**
 * POST /api/exec - Execute command
 */
export const POST = (req: Request) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { sessionId, command } = yield* parseBody(ExecRequest, req);
      yield* verifyAppOwnership(sessionId, session.user.id);
      yield* getSandbox(sessionId);
      return yield* exec(sessionId, command);
    }),
  );

/**
 * GET /api/exec - List sessions
 */
export const GET = (req: Request) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { sessionId } = yield* parseSearchParams(SessionIdParam, req);
      yield* verifyAppOwnership(sessionId, session.user.id);
      yield* getSandbox(sessionId);
      return yield* listSessions(sessionId);
    }),
  );

/**
 * DELETE /api/exec - Kill session
 */
export const DELETE = (req: Request) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { sessionId, execSessionId } = yield* parseSearchParams(
        DeleteExecParams,
        req,
      );
      yield* verifyAppOwnership(sessionId, session.user.id);
      yield* getSandbox(sessionId);
      yield* killSession(sessionId, execSessionId);
      return { success: true };
    }),
  );
