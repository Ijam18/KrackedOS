"use client";

import { Effect } from "effect";
import { useMemo } from "react";
import type { SandboxInfo } from "@/lib/services/sandbox/types";

export type SandboxStatus =
  | "idle"
  | "reconnecting"
  | "creating"
  | "bootstrapping"
  | "starting-server"
  | "ready"
  | "error";

export interface SandboxCreationState {
  status: SandboxStatus;
  message: string;
  sandbox: SandboxInfo | null;
  error: string | null;
}

const statusMessages: Record<SandboxStatus, string> = {
  idle: "Preparing...",
  reconnecting: "Reconnecting...",
  creating: "Creating sandbox...",
  bootstrapping: "Setting up project...",
  "starting-server": "Starting dev server...",
  ready: "Ready",
  error: "Error",
};

/**
 * Creates a sandbox via SSE stream and returns the final SandboxInfo.
 * This is an Effect program that can be run with Effect.runPromise.
 */
export const createSandboxEffect = (
  sessionId: string,
  onStatusChange?: (state: SandboxCreationState) => void,
): Effect.Effect<SandboxInfo, Error> =>
  Effect.async<SandboxInfo, Error>((resume) => {
    const controller = new AbortController();
    let currentState: SandboxCreationState = {
      status: "idle",
      message: statusMessages.idle,
      sandbox: null,
      error: null,
    };

    const updateStatus = (status: SandboxStatus, sandbox?: SandboxInfo) => {
      currentState = {
        status,
        message: statusMessages[status],
        sandbox: sandbox ?? currentState.sandbox,
        error: null,
      };
      onStatusChange?.(currentState);
    };

    const handleError = (error: string) => {
      currentState = {
        status: "error",
        message: statusMessages.error,
        sandbox: null,
        error,
      };
      onStatusChange?.(currentState);
    };

    (async () => {
      try {
        updateStatus("creating");

        const response = await fetch("/api/sandbox/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to create sandbox");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7);
            } else if (line.startsWith("data: ") && currentEvent) {
              const data = JSON.parse(line.slice(6));

              if (currentEvent === "status") {
                // Update status based on step
                if (
                  data.step === "reconnecting" ||
                  data.step === "reconnected"
                ) {
                  updateStatus("reconnecting", data.sandbox);
                } else if (
                  data.step === "creating" ||
                  data.step === "created"
                ) {
                  updateStatus("creating", data.sandbox);
                } else if (
                  data.step === "bootstrapping" ||
                  data.step === "bootstrapped"
                ) {
                  updateStatus("bootstrapping", data.sandbox);
                } else if (
                  data.step === "starting-server" ||
                  data.step === "waiting-for-server"
                ) {
                  updateStatus("starting-server", data.sandbox);
                } else if (data.step === "ready") {
                  updateStatus("ready", data.sandbox);
                }
              } else if (currentEvent === "done") {
                const sandbox = data.sandbox as SandboxInfo;
                updateStatus("ready", sandbox);
                resume(Effect.succeed(sandbox));
                return;
              } else if (currentEvent === "error") {
                handleError(data.message);
                resume(Effect.fail(new Error(data.message)));
                return;
              }
              currentEvent = "";
            }
          }
        }

        // If we exit the loop without a done event, fail
        resume(Effect.fail(new Error("Stream ended unexpectedly")));
      } catch (err) {
        if (controller.signal.aborted) {
          resume(Effect.fail(new Error("Sandbox creation aborted")));
        } else {
          const message =
            err instanceof Error ? err.message : "Failed to create sandbox";
          handleError(message);
          resume(Effect.fail(new Error(message)));
        }
      }
    })();

    // Return cleanup effect
    return Effect.sync(() => {
      controller.abort();
    });
  });

/**
 * Creates a memoized promise that creates a sandbox.
 * Use this with React's `use()` hook for Suspense-based loading.
 *
 * @example
 * ```tsx
 * function MyComponent({ sessionId }: { sessionId: string }) {
 *   const sandboxPromise = useSandboxPromise(sessionId);
 *   const sandbox = use(sandboxPromise); // Suspends until ready
 *   return <div>Sandbox ready: {sandbox.previewUrl}</div>;
 * }
 * ```
 */
export function useSandboxPromise(sessionId: string): Promise<SandboxInfo> {
  return useMemo(
    () => Effect.runPromise(createSandboxEffect(sessionId)),
    [sessionId],
  );
}

/**
 * Creates a sandbox promise with status tracking via an external callback.
 * This variant allows status updates to flow to parent components.
 */
export function createSandboxPromiseWithStatus(
  sessionId: string,
  onStatusChange: (state: SandboxCreationState) => void,
): Promise<SandboxInfo> {
  return Effect.runPromise(createSandboxEffect(sessionId, onStatusChange));
}

// Cache for sandbox promises - only used to prevent duplicate requests during the same render cycle
// We track whether the promise is still pending to decide if we should reuse it
const sandboxPromiseCache = new Map<
  string,
  {
    promise: Promise<SandboxInfo>;
    statusCallback: (state: SandboxCreationState) => void;
    isPending: boolean;
  }
>();

export function getOrCreateSandboxPromise(
  sessionId: string,
  onStatusChange: (state: SandboxCreationState) => void,
): Promise<SandboxInfo> {
  const cached = sandboxPromiseCache.get(sessionId);

  // Only reuse if the promise is still pending (in-flight request)
  // If it's resolved/rejected, we should create a new one to re-verify sandbox status
  if (cached?.isPending) {
    cached.statusCallback = onStatusChange;
    return cached.promise;
  }

  // Create a wrapper that forwards to the current callback
  const wrapper = (state: SandboxCreationState) => {
    const entry = sandboxPromiseCache.get(sessionId);
    entry?.statusCallback(state);
  };

  const promise = Effect.runPromise(createSandboxEffect(sessionId, wrapper));

  const cacheEntry = {
    promise,
    statusCallback: onStatusChange,
    isPending: true,
  };

  sandboxPromiseCache.set(sessionId, cacheEntry);

  // Mark as not pending when it settles
  promise.finally(() => {
    cacheEntry.isPending = false;
  });

  return promise;
}
