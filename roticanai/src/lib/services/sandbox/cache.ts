/**
 * Sandbox cache - Redis-backed cache for sandbox state
 *
 * Stores sandbox info in Redis for cross-request persistence.
 * Replaces in-memory Maps that don't work in serverless/Next.js dev mode.
 */

import { Effect } from "effect";
import { buildKey, getRedis } from "@/lib/core/redis";
import { logger } from "@/lib/telemetry";
import type { SandboxInfo, SandboxStatus } from "./types";

const KEY_PREFIX = "sandbox";
const SANDBOX_TTL_SECONDS = 55 * 60; // 55 minutes (E2B max is 1h)

const sandboxKey = (sessionId: string) =>
  buildKey(KEY_PREFIX, sessionId, "info");

const instanceKey = (sessionId: string) =>
  buildKey(KEY_PREFIX, sessionId, "instance");

export const getCachedSandbox = async (
  sessionId: string,
): Promise<SandboxInfo | null> => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(sandboxKey(sessionId));
    if (!data) return null;
    return JSON.parse(data) as SandboxInfo;
  } catch (error) {
    logger.error("Failed to get cached sandbox", error, { sessionId });
    return null;
  }
};

export const setCachedSandbox = async (
  sessionId: string,
  sandbox: SandboxInfo,
): Promise<void> => {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(
      sandboxKey(sessionId),
      JSON.stringify(sandbox),
      "EX",
      SANDBOX_TTL_SECONDS,
    );
  } catch (error) {
    logger.error("Failed to cache sandbox", error, { sessionId });
  }
};

export const removeCachedSandbox = async (sessionId: string): Promise<void> => {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(sandboxKey(sessionId));
    await redis.del(instanceKey(sessionId));
  } catch (error) {
    logger.error("Failed to remove cached sandbox", error, { sessionId });
  }
};

export const getCachedSandboxStatus = async (
  sessionId: string,
): Promise<SandboxStatus | null> => {
  const cached = await getCachedSandbox(sessionId);
  return cached?.status ?? null;
};

export const updateCachedSandboxStatus = async (
  sessionId: string,
  status: SandboxStatus,
): Promise<void> => {
  const cached = await getCachedSandbox(sessionId);
  if (cached) {
    await setCachedSandbox(sessionId, { ...cached, status });
  }
};

export const getCachedSandboxEffect = (
  sessionId: string,
): Effect.Effect<SandboxInfo | null, never, never> =>
  Effect.tryPromise({
    try: () => getCachedSandbox(sessionId),
    catch: () => null,
  }).pipe(Effect.catchAll(() => Effect.succeed(null)));

export const setCachedSandboxEffect = (
  sessionId: string,
  sandbox: SandboxInfo,
): Effect.Effect<void, never, never> =>
  Effect.tryPromise({
    try: () => setCachedSandbox(sessionId, sandbox),
    catch: () => null,
  }).pipe(Effect.catchAll(() => Effect.void));

export const removeCachedSandboxEffect = (
  sessionId: string,
): Effect.Effect<void, never, never> =>
  Effect.tryPromise({
    try: () => removeCachedSandbox(sessionId),
    catch: () => null,
  }).pipe(Effect.catchAll(() => Effect.void));
