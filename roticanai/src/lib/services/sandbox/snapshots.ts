/**
 * Sandbox snapshots - Filesystem state snapshots using E2B
 *
 * Creates point-in-time snapshots of the sandbox filesystem.
 * Restoring creates a new sandbox from the snapshot — setStartCmd fires again,
 * so the dev server auto-starts without any manual intervention.
 */

import { Effect } from "effect";
import {
  type ConfigError,
  InternalError,
  type NotFoundError,
} from "@/lib/effect/errors";
import { setAppSnapshotId } from "@/lib/services/app";
import { getActiveSandbox, restoreFromSnapshot } from "./lifecycle";
import type { SandboxInfo, Snapshot } from "./types";

/**
 * Create a filesystem snapshot of the current sandbox state.
 * Returns a snapshotId that can be passed to Sandbox.create() to restore.
 *
 * Note: All active connections (commands, PTY) are dropped during snapshotting.
 */
export const createSnapshot = (
  sessionId: string,
): Effect.Effect<Snapshot, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);

    yield* Effect.log(`[Sandbox] Creating snapshot...`);

    const result = yield* Effect.tryPromise({
      try: () => sandbox.createSnapshot(),
      catch: (error) =>
        new InternalError({
          message: `Failed to create snapshot: ${error}`,
          cause: error,
        }),
    });

    const snapshot: Snapshot = {
      id: result.snapshotId,
      createdAt: new Date().toISOString(),
    };

    // Persist snapshot ID to database
    yield* Effect.tryPromise({
      try: () => setAppSnapshotId(sessionId, result.snapshotId),
      catch: (error) => {
        console.error("Failed to persist snapshot ID:", error);
        return null;
      },
    }).pipe(Effect.catchAll(() => Effect.succeed(null)));

    yield* Effect.log(`[Sandbox] Snapshot created: ${result.snapshotId}`);

    return snapshot;
  });

/**
 * Restore a sandbox from a previously created snapshot.
 * Creates a new sandbox with the snapshot's filesystem.
 * Dev server auto-starts via the template's setStartCmd.
 */
export const restoreSnapshot = (
  sessionId: string,
  snapshotId: string,
): Effect.Effect<SandboxInfo, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    yield* Effect.log(`[Sandbox] Restoring from snapshot: ${snapshotId}`);

    const sandboxInfo = yield* restoreFromSnapshot(sessionId, snapshotId);

    yield* Effect.log(
      `[Sandbox] Restored to new sandbox: ${sandboxInfo.sandboxId}`,
    );

    return sandboxInfo;
  });

// Legacy aliases for backwards compatibility
export const createCheckpoint = createSnapshot;
export const restoreCheckpoint = restoreSnapshot;
