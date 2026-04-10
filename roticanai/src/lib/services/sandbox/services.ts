/**
 * Sandbox services - Preview URL and process management
 *
 * With E2B, preview URLs are derived from sandbox.getHost(port) — no async
 * tunnel lookup needed. The dev server auto-starts via the template's setStartCmd.
 */

import { Effect } from "effect";
import type {
  ConfigError,
  InternalError,
  NotFoundError,
} from "@/lib/effect/errors";
import { getCachedSandbox } from "./cache";
import { getActiveSandbox, getSandbox } from "./lifecycle";
import type { TunnelInfo } from "./types";

export const getTunnels = (
  sessionId: string,
): Effect.Effect<
  Record<number, TunnelInfo>,
  NotFoundError | ConfigError | InternalError
> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);
    const url = `https://${sandbox.getHost(8080)}`;
    return { 8080: { port: 8080, url } };
  });

export const getPreviewUrl = (
  sessionId: string,
): Effect.Effect<string | null, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const cached = yield* Effect.tryPromise({
      try: () => getCachedSandbox(sessionId),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    if (cached?.previewUrl) {
      return cached.previewUrl;
    }

    const sandbox = yield* getActiveSandbox(sessionId);
    return `https://${sandbox.getHost(8080)}`;
  });

export const isDevServerReady = (
  sessionId: string,
): Effect.Effect<boolean, never> =>
  Effect.gen(function* () {
    const cached = yield* Effect.tryPromise({
      try: () => getCachedSandbox(sessionId),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    if (!cached?.previewUrl) return false;

    return yield* Effect.tryPromise({
      try: async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const response = await fetch(cached.previewUrl, {
            method: "HEAD",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response.status > 0;
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof TypeError && error.message.includes("CORS")) {
            return true;
          }
          return false;
        }
      },
      catch: () => false,
    }).pipe(Effect.catchAll(() => Effect.succeed(false)));
  });

export const stopProcess = (
  sessionId: string,
  pattern: string,
): Effect.Effect<void, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);

    yield* Effect.tryPromise({
      try: () => sandbox.commands.run(`pkill -f "${pattern}" || true`),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    yield* Effect.log(`[Sandbox] Stopped processes matching: ${pattern}`);
  });

export const getDevServerLogsInfo = (
  sessionId: string,
): Effect.Effect<
  { sandboxId: string; hasProcess: boolean } | null,
  NotFoundError | ConfigError | InternalError
> =>
  Effect.gen(function* () {
    const sandboxInfo = yield* getSandbox(sessionId);

    return {
      sandboxId: sandboxInfo.sandboxId,
      hasProcess: true,
    };
  });

export const debugDevServerStatus = (
  sessionId: string,
): Effect.Effect<
  {
    hasCachedSandbox: boolean;
    hasActiveSandbox: boolean;
    runningProcesses: string | null;
    previewUrl: string | null;
    tunnelAccessible: boolean;
  },
  never
> =>
  Effect.gen(function* () {
    const cached = yield* Effect.tryPromise({
      try: () => getCachedSandbox(sessionId),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    const result = {
      hasCachedSandbox: !!cached,
      hasActiveSandbox: false,
      runningProcesses: null as string | null,
      previewUrl: cached?.previewUrl ?? null,
      tunnelAccessible: false,
    };

    const sandboxResult = yield* getActiveSandbox(sessionId).pipe(
      Effect.either,
    );

    if (sandboxResult._tag === "Right") {
      result.hasActiveSandbox = true;
      result.runningProcesses = yield* Effect.tryPromise({
        try: () =>
          sandboxResult.right.commands.run("ps aux").then((r) => r.stdout),
        catch: () => "Failed to list processes",
      }).pipe(
        Effect.catchAll(() => Effect.succeed("Failed to list processes")),
      );
    }

    if (cached?.previewUrl) {
      result.tunnelAccessible = yield* Effect.tryPromise({
        try: async () => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          try {
            const response = await fetch(cached.previewUrl, {
              method: "HEAD",
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response.status > 0;
          } catch {
            clearTimeout(timeoutId);
            return false;
          }
        },
        catch: () => false,
      }).pipe(Effect.catchAll(() => Effect.succeed(false)));
    }

    return result;
  });

export const createService = () => Effect.void;
export const startService = () => Effect.succeed(new Response());
export const stopService = () => Effect.void;
export const getDevServerSession = getDevServerLogsInfo;
