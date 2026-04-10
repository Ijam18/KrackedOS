/**
 * Sandbox setup stream - Creates and initializes a sandbox
 *
 * With E2B, createSandbox() already blocks until the dev server is ready
 * (template setStartCmd + waitForURL). Setup is a single step.
 */

import { Effect, Fiber, Stream } from "effect";
import type { SseEvent } from "@/lib/effect/sse";
import { sseDone, sseError, sseStatus } from "@/lib/effect/sse";
import { createSandbox } from "./lifecycle";
import type { SandboxInfo } from "./types";

interface SetupStreamParams {
  sessionId: string;
  isReconnect: boolean;
}

/**
 * Run the sandbox setup process and emit SSE events.
 * createSandbox() blocks until the dev server is ready — no manual bootstrap
 * or server-start steps needed.
 */
const runSetup = (
  emit: { single: (event: SseEvent) => void; end: () => void },
  sessionId: string,
  isReconnect: boolean,
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    emit.single(
      sseStatus(
        isReconnect ? "reconnecting" : "creating",
        isReconnect ? "Reconnecting..." : "Creating sandbox...",
      ),
    );

    const sandboxResult = yield* createSandbox(sessionId).pipe(Effect.either);

    if (sandboxResult._tag === "Left") {
      emit.single(sseError(sandboxResult.left.message));
      emit.end();
      return;
    }

    const sandboxInfo: SandboxInfo = sandboxResult.right;

    // createSandbox() only resolves when the dev server is ready (waitForURL).
    emit.single(sseStatus("ready", "Ready"));
    emit.single(sseDone({ sandbox: sandboxInfo }));
    emit.end();
  }).pipe(
    Effect.catchAllCause((cause) =>
      Effect.sync(() => {
        if (!cause.toString().includes("Interrupt")) {
          emit.single(sseError("Setup failed unexpectedly"));
        }
        emit.end();
      }),
    ),
  );

/**
 * Create a stream of SSE events for sandbox setup.
 */
export const createSetupStream = ({
  sessionId,
  isReconnect,
}: SetupStreamParams): Stream.Stream<SseEvent, never, never> =>
  Stream.asyncPush<SseEvent>(
    (emit) =>
      Effect.acquireRelease(
        Effect.fork(runSetup(emit, sessionId, isReconnect)),
        (fiber) => Fiber.interrupt(fiber),
      ),
    { bufferSize: 16 },
  );
