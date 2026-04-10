/**
 * Dev server logs stream - Streams logs from the dev server
 *
 * The E2B template's setStartCmd pipes dev server output to /tmp/dev.log via tee.
 * This stream tails that file as a background command, firing onStdout callbacks.
 */

import { Effect, Fiber, Stream } from "effect";
import type { SseEvent } from "@/lib/effect/sse";
import { sseError, sseEvent } from "@/lib/effect/sse";
import { getActiveSandbox } from "./lifecycle";

/**
 * Run the log streaming process and emit SSE events.
 * Tails /tmp/dev.log inside the sandbox via a background command.
 */
const runLogStream = (
  emit: { single: (event: SseEvent) => void; end: () => void },
  sessionId: string,
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    const sandboxResult = yield* getActiveSandbox(sessionId).pipe(
      Effect.either,
    );

    if (sandboxResult._tag === "Left") {
      emit.single(sseError("Sandbox not found"));
      emit.end();
      return;
    }

    const sandbox = sandboxResult.right;

    emit.single(
      sseEvent("connected", { message: "Connected to dev server logs" }),
    );

    // Start `tail -f /tmp/dev.log` as a background command.
    // onStdout fires for each chunk of output. We use acquireUseRelease so
    // the tail process is killed when the stream closes (fiber interrupted).
    yield* Effect.acquireUseRelease(
      // Acquire: start the background tail command
      Effect.tryPromise({
        try: () =>
          sandbox.commands.run("tail -f /tmp/dev.log 2>/dev/null || true", {
            background: true,
            onStdout: (data: string) => {
              emit.single(sseEvent("log", { type: "stdout", data }));
            },
          }),
        catch: (error) => {
          emit.single(sseError(`Failed to start log stream: ${error}`));
          emit.end();
          return null;
        },
      }),
      // Use: wait forever (tail -f runs until killed)
      (_handle) => Effect.never,
      // Release: kill the tail command when stream closes
      (handle) =>
        handle
          ? Effect.promise(() => handle.kill().catch(() => {}))
          : Effect.void,
    );

    emit.single(sseEvent("done", {}));
    emit.end();
  }).pipe(
    Effect.catchAllCause((cause) =>
      Effect.sync(() => {
        if (!cause.toString().includes("Interrupt")) {
          emit.single(sseError("Failed to connect to logs"));
        }
        emit.end();
      }),
    ),
  );

/**
 * Create a stream of SSE events for dev server logs.
 */
export const createLogsStream = (
  sessionId: string,
): Stream.Stream<SseEvent, never, never> =>
  Stream.asyncPush<SseEvent>(
    (emit) =>
      Effect.acquireRelease(
        Effect.fork(runLogStream(emit, sessionId)),
        (fiber) => Fiber.interrupt(fiber),
      ),
    { bufferSize: 16 },
  );
