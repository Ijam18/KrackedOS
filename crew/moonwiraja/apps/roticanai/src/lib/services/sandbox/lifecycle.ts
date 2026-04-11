/**
 * Sandbox lifecycle - Create, get, delete E2B sandboxes
 *
 * Manages sandbox creation, status checking, and cleanup.
 * Uses Redis for cross-request state persistence.
 * Resilient: auto-reconnects, restores from snapshot, or creates fresh on failure.
 */

import { Sandbox } from "e2b";
import { Effect } from "effect";
import {
  type ConfigError,
  InternalError,
  NotFoundError,
} from "@/lib/effect/errors";
import { getApp, updateAppSandbox } from "@/lib/services/app";
import { appMetrics, logger } from "@/lib/telemetry";
import {
  getCachedSandbox,
  getCachedSandboxEffect,
  removeCachedSandboxEffect,
  setCachedSandboxEffect,
} from "./cache";
import { validateE2BConfig } from "./client";
import { getTemplateId } from "./images";
import type { SandboxInfo, SandboxStatus } from "./types";
import { DEFAULT_SANDBOX_CONFIG } from "./types";

const activeSandboxInstances = new Map<string, Sandbox>();

const buildPreviewUrl = (sandbox: Sandbox): string =>
  `https://${sandbox.getHost(8080)}`;

export const getCachedSandboxInfo = getCachedSandbox;

export const createSandbox = (
  sessionId: string,
): Effect.Effect<SandboxInfo, ConfigError | InternalError> =>
  Effect.gen(function* () {
    const cached = yield* getCachedSandboxEffect(sessionId);
    if (cached) {
      yield* Effect.log(`[Sandbox] Returning cached sandbox for ${sessionId}`);
      return cached;
    }

    yield* validateE2BConfig();

    const app = yield* Effect.tryPromise({
      try: () => getApp(sessionId),
      catch: () => new InternalError({ message: "Failed to get app" }),
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    if (app?.sandboxId) {
      yield* Effect.log(`[Sandbox] Attempting reconnect to ${app.sandboxId}`);
      const reconnectResult = yield* tryReconnectSandbox(
        sessionId,
        app.sandboxId,
      ).pipe(Effect.either);

      if (reconnectResult._tag === "Right") {
        return reconnectResult.right;
      }

      appMetrics.recordSandboxOp("reconnect_failed");
      logger.warn(`[Sandbox] Reconnect failed, checking for snapshot`, {
        sessionId,
        sandboxId: app.sandboxId,
        error:
          reconnectResult.left._tag === "InternalError"
            ? reconnectResult.left.message
            : String(reconnectResult.left),
      });

      yield* Effect.tryPromise({
        try: () => updateAppSandbox(sessionId, { sandboxId: null }),
        catch: () => null,
      }).pipe(Effect.catchAll(() => Effect.succeed(null)));
    }

    if (app?.snapshotId) {
      yield* Effect.log(
        `[Sandbox] Attempting restore from snapshot ${app.snapshotId}`,
      );
      const restoreResult = yield* restoreFromSnapshot(
        sessionId,
        app.snapshotId,
      ).pipe(Effect.either);

      if (restoreResult._tag === "Right") {
        return restoreResult.right;
      }

      appMetrics.recordSandboxOp("restore_failed");
      logger.warn(`[Sandbox] Snapshot restore failed, creating fresh sandbox`, {
        sessionId,
        snapshotId: app.snapshotId,
        error:
          restoreResult.left._tag === "InternalError"
            ? restoreResult.left.message
            : String(restoreResult.left),
      });
    }

    return yield* createFreshSandbox(sessionId);
  });

const createFreshSandbox = (
  sessionId: string,
): Effect.Effect<SandboxInfo, ConfigError | InternalError> =>
  Effect.gen(function* () {
    const startTime = Date.now();
    const templateId = yield* getTemplateId();

    yield* Effect.log(
      `[Sandbox] Creating fresh sandbox from template ${templateId}`,
    );

    const sandbox = yield* Effect.tryPromise({
      try: () =>
        Sandbox.betaCreate(templateId, {
          timeoutMs: DEFAULT_SANDBOX_CONFIG.timeoutMs,
          metadata: { appId: sessionId },
          autoPause: true,
        }),
      catch: (error) =>
        new InternalError({
          message: `Failed to create sandbox: ${error}`,
          cause: error,
        }),
    }).pipe(
      Effect.timeout("5 minutes"),
      Effect.mapError(
        (e) =>
          new InternalError({
            message: `Sandbox creation timed out or failed: ${e}`,
            cause: e,
          }),
      ),
    );

    const previewUrl = buildPreviewUrl(sandbox);

    yield* Effect.tryPromise({
      try: () => sandbox.setTimeout(DEFAULT_SANDBOX_CONFIG.timeoutMs),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    yield* Effect.tryPromise({
      try: () =>
        updateAppSandbox(sessionId, {
          sandboxId: sandbox.sandboxId,
          previewUrl,
        }),
      catch: (error) => {
        console.error("Failed to persist sandbox ID:", error);
        return null;
      },
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info("Sandbox created", {
      sessionId,
      sandboxId: sandbox.sandboxId,
      previewUrl,
      elapsedSeconds: elapsed,
      source: "fresh",
    });
    appMetrics.recordSandboxOp("create");

    const sandboxInfo: SandboxInfo = {
      id: sessionId,
      sandboxId: sandbox.sandboxId,
      status: "running",
      previewUrl,
      createdAt: new Date().toISOString(),
    };

    yield* setCachedSandboxEffect(sessionId, sandboxInfo);
    activeSandboxInstances.set(sessionId, sandbox);

    return sandboxInfo;
  });

const tryReconnectSandbox = (
  sessionId: string,
  sandboxId: string,
): Effect.Effect<SandboxInfo, InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* Effect.tryPromise({
      try: () =>
        Sandbox.connect(sandboxId, {
          timeoutMs: DEFAULT_SANDBOX_CONFIG.idleTimeoutMs,
        }),
      catch: (error) =>
        new InternalError({
          message: `Failed to connect to sandbox ${sandboxId}: ${error}`,
          cause: error,
        }),
    });

    const previewUrl = buildPreviewUrl(sandbox);

    yield* Effect.tryPromise({
      try: () => sandbox.setTimeout(DEFAULT_SANDBOX_CONFIG.timeoutMs),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    logger.info("Sandbox reconnected", {
      sessionId,
      sandboxId: sandbox.sandboxId,
      previewUrl,
      source: "reconnect",
    });
    appMetrics.recordSandboxOp("reconnect");

    const sandboxInfo: SandboxInfo = {
      id: sessionId,
      sandboxId: sandbox.sandboxId,
      status: "running",
      previewUrl,
      createdAt: new Date().toISOString(),
    };

    yield* setCachedSandboxEffect(sessionId, sandboxInfo);
    activeSandboxInstances.set(sessionId, sandbox);

    yield* Effect.tryPromise({
      try: () =>
        updateAppSandbox(sessionId, {
          sandboxId: sandbox.sandboxId,
          previewUrl,
        }),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    return sandboxInfo;
  });

export const restoreFromSnapshot = (
  sessionId: string,
  snapshotId: string,
): Effect.Effect<SandboxInfo, ConfigError | InternalError> =>
  Effect.gen(function* () {
    yield* validateE2BConfig();

    const startTime = Date.now();

    const sandbox = yield* Effect.tryPromise({
      try: () =>
        Sandbox.create(snapshotId, {
          timeoutMs: DEFAULT_SANDBOX_CONFIG.timeoutMs,
          metadata: { appId: sessionId },
        }),
      catch: (error) =>
        new InternalError({
          message: `Failed to restore from snapshot: ${error}`,
          cause: error,
        }),
    }).pipe(
      Effect.timeout("5 minutes"),
      Effect.mapError(
        (e) =>
          new InternalError({
            message: `Snapshot restore timed out or failed: ${e}`,
            cause: e,
          }),
      ),
    );

    const previewUrl = buildPreviewUrl(sandbox);

    yield* Effect.tryPromise({
      try: () => sandbox.setTimeout(DEFAULT_SANDBOX_CONFIG.timeoutMs),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    yield* Effect.tryPromise({
      try: () =>
        updateAppSandbox(sessionId, {
          sandboxId: sandbox.sandboxId,
          previewUrl,
        }),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    logger.info("Sandbox restored from snapshot", {
      sessionId,
      snapshotId,
      sandboxId: sandbox.sandboxId,
      previewUrl,
      elapsedSeconds: elapsed,
      source: "restore",
    });
    appMetrics.recordSandboxOp("restore");

    const sandboxInfo: SandboxInfo = {
      id: sessionId,
      sandboxId: sandbox.sandboxId,
      status: "running",
      previewUrl,
      createdAt: new Date().toISOString(),
    };

    yield* setCachedSandboxEffect(sessionId, sandboxInfo);
    activeSandboxInstances.set(sessionId, sandbox);

    return sandboxInfo;
  });

export const getSandbox = (
  sessionId: string,
): Effect.Effect<SandboxInfo, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const cached = yield* getCachedSandboxEffect(sessionId);
    if (cached) {
      return cached;
    }

    const app = yield* Effect.tryPromise({
      try: () => getApp(sessionId),
      catch: () => new InternalError({ message: "Failed to get app" }),
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    if (!app) {
      return yield* Effect.fail(
        new NotFoundError({ resource: "App", id: sessionId }),
      );
    }

    if (app.sandboxId) {
      yield* Effect.log(
        `[Sandbox] getSandbox: attempting reconnect to ${app.sandboxId}`,
      );
      const reconnectResult = yield* tryReconnectSandbox(
        sessionId,
        app.sandboxId,
      ).pipe(Effect.either);

      if (reconnectResult._tag === "Right") {
        return reconnectResult.right;
      }

      appMetrics.recordSandboxOp("reconnect_failed");
      logger.warn(
        `[Sandbox] getSandbox: reconnect failed, trying snapshot or fresh`,
        {
          sessionId,
          sandboxId: app.sandboxId,
          error:
            reconnectResult.left._tag === "InternalError"
              ? reconnectResult.left.message
              : String(reconnectResult.left),
        },
      );
    }

    if (app.snapshotId) {
      yield* Effect.log(
        `[Sandbox] getSandbox: attempting restore from snapshot ${app.snapshotId}`,
      );
      const restoreResult = yield* restoreFromSnapshot(
        sessionId,
        app.snapshotId,
      ).pipe(Effect.either);

      if (restoreResult._tag === "Right") {
        return restoreResult.right;
      }

      appMetrics.recordSandboxOp("restore_failed");
      logger.warn(`[Sandbox] getSandbox: restore failed, creating fresh`, {
        sessionId,
        snapshotId: app.snapshotId,
        error:
          restoreResult.left._tag === "InternalError"
            ? restoreResult.left.message
            : String(restoreResult.left),
      });
    }

    yield* Effect.log(
      `[Sandbox] getSandbox: creating fresh sandbox as last resort`,
    );
    return yield* createFreshSandbox(sessionId);
  });

export const getActiveSandbox = (
  sessionId: string,
): Effect.Effect<Sandbox, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const cachedInstance = activeSandboxInstances.get(sessionId);
    if (cachedInstance) {
      return cachedInstance;
    }

    const sandboxInfo = yield* getSandbox(sessionId);

    const sandbox = yield* Effect.tryPromise({
      try: () =>
        Sandbox.connect(sandboxInfo.sandboxId, {
          timeoutMs: DEFAULT_SANDBOX_CONFIG.idleTimeoutMs,
        }),
      catch: (error) =>
        new InternalError({
          message: `Failed to connect to active sandbox ${sandboxInfo.sandboxId}: ${error}`,
          cause: error,
        }),
    });

    yield* Effect.tryPromise({
      try: () => sandbox.setTimeout(DEFAULT_SANDBOX_CONFIG.timeoutMs),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    activeSandboxInstances.set(sessionId, sandbox);

    return sandbox;
  });

export const deleteSandbox = (
  sessionId: string,
): Effect.Effect<void, ConfigError | InternalError> =>
  Effect.gen(function* () {
    const cached = yield* getCachedSandboxEffect(sessionId);

    if (cached?.sandboxId) {
      const sandboxId = cached.sandboxId;
      yield* Effect.log(`[Sandbox] Terminating sandbox ${sandboxId}`);

      yield* Effect.tryPromise({
        try: () => Sandbox.connect(sandboxId).then((s) => s.kill()),
        catch: (error) =>
          new InternalError({
            message: `Failed to terminate sandbox: ${error}`,
            cause: error,
          }),
      }).pipe(
        Effect.tapError((error) =>
          Effect.log(`Failed to terminate sandbox: ${error.message}`),
        ),
        Effect.catchAll(() => Effect.void),
      );

      logger.info("Sandbox terminated", {
        sessionId,
        sandboxId,
      });
      appMetrics.recordSandboxOp("terminate");
    }

    activeSandboxInstances.delete(sessionId);
    yield* removeCachedSandboxEffect(sessionId);

    yield* Effect.tryPromise({
      try: () => updateAppSandbox(sessionId, { sandboxId: null }),
      catch: () => null,
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));
  });

export const getSandboxStatus = (
  sessionId: string,
): Effect.Effect<SandboxStatus, never> =>
  Effect.gen(function* () {
    const cached = yield* getCachedSandboxEffect(sessionId);
    if (!cached) {
      return "unknown" as SandboxStatus;
    }

    const alive = yield* Effect.tryPromise({
      try: async () => {
        const sandbox = await Sandbox.connect(cached.sandboxId, {
          timeoutMs: 5000,
        });
        await sandbox.commands.run("echo status");
        return true;
      },
      catch: () => false,
    }).pipe(
      Effect.timeout("10 seconds"),
      Effect.catchAll(() => Effect.succeed(false)),
    );

    return alive
      ? ("running" as SandboxStatus)
      : ("terminated" as SandboxStatus);
  });
