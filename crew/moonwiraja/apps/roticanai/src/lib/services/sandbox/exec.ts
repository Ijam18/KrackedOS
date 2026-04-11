/**
 * Sandbox exec - Command execution using E2B's commands API
 */

import { Effect } from "effect";
import {
  type ConfigError,
  InternalError,
  type NotFoundError,
} from "@/lib/effect/errors";
import { getActiveSandbox } from "./lifecycle";
import type { ExecResult, Session } from "./types";
import { APP_DIR } from "./types";

/**
 * Execute a command in the sandbox
 */
export const exec = (
  sessionId: string,
  command: string,
): Effect.Effect<ExecResult, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);

    const result = yield* Effect.tryPromise({
      try: () => sandbox.commands.run(`cd ${APP_DIR} && ${command}`),
      catch: (error) =>
        new InternalError({
          message: `Failed to execute command: ${error}`,
          cause: error,
        }),
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      success: result.exitCode === 0,
    };
  });

/**
 * List active exec sessions
 */
export const listSessions = (
  _sessionId: string,
): Effect.Effect<Session[], never> => Effect.succeed([]);

/**
 * Kill a running process by pattern
 */
export const killSession = (
  sessionId: string,
  processPattern: string,
): Effect.Effect<void, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);

    yield* Effect.tryPromise({
      try: () => sandbox.commands.run(`pkill -f "${processPattern}" || true`),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));
  });

/**
 * Run a command in detached/background mode (for long-running processes)
 * Returns immediately without waiting for the command to complete.
 */
export const execDetached = (
  sessionId: string,
  command: string,
): Effect.Effect<string, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);

    yield* Effect.tryPromise({
      try: () =>
        sandbox.commands.run(`cd ${APP_DIR} && ${command}`, {
          background: true,
        }),
      catch: (error) =>
        new InternalError({
          message: `Failed to start detached command: ${error}`,
          cause: error,
        }),
    });

    return `detached-${Date.now()}`;
  });

/**
 * Execute a command with streaming stdout/stderr callbacks.
 * Useful for commands where you want incremental output.
 */
export const execStreaming = (
  sessionId: string,
  command: string[],
  opts?: {
    onStdout?: (data: string) => void;
    onStderr?: (data: string) => void;
  },
): Effect.Effect<ExecResult, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);

    const result = yield* Effect.tryPromise({
      try: () =>
        sandbox.commands.run(command.join(" "), {
          onStdout: opts?.onStdout,
          onStderr: opts?.onStderr,
        }),
      catch: (error) =>
        new InternalError({
          message: `Failed to execute streaming command: ${error}`,
          cause: error,
        }),
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      success: result.exitCode === 0,
    };
  });
