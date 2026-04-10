import { Effect } from "effect";
import {
  DeleteFileParams,
  FilePathParams,
  parseBody,
  parseSearchParams,
  runAuthHandler,
  ValidationError,
  WriteFileRequest,
} from "@/lib/effect";
import { verifyAppOwnership } from "@/lib/services";
import {
  deleteFile,
  getSandbox,
  listFiles,
  readFile,
  writeFile,
} from "@/lib/services/sandbox";

/**
 * GET /api/files - Read file or list directory
 */
export const GET = (req: Request) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const params = yield* parseSearchParams(FilePathParams, req);
      const { sessionId, path, list } = params;

      yield* verifyAppOwnership(sessionId, session.user.id);
      yield* getSandbox(sessionId);

      if (list === "true") {
        return yield* listFiles(sessionId, path || ".");
      }

      if (!path) {
        return yield* Effect.fail(
          new ValidationError({ field: "path", message: "path is required" }),
        );
      }

      const content = yield* readFile(sessionId, path);
      return { content, path };
    }),
  );

/**
 * PUT /api/files - Write file
 */
export const PUT = (req: Request) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { sessionId, path, content } = yield* parseBody(
        WriteFileRequest,
        req,
      );

      yield* verifyAppOwnership(sessionId, session.user.id);
      yield* getSandbox(sessionId);
      yield* writeFile(sessionId, path, content);

      return { success: true, path };
    }),
  );

/**
 * DELETE /api/files - Delete file
 */
export const DELETE = (req: Request) =>
  runAuthHandler((session) =>
    Effect.gen(function* () {
      const { sessionId, path } = yield* parseSearchParams(
        DeleteFileParams,
        req,
      );

      yield* verifyAppOwnership(sessionId, session.user.id);
      yield* getSandbox(sessionId);
      yield* deleteFile(sessionId, path);

      return { success: true };
    }),
  );
