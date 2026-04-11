/**
 * Wake state - Redis-backed state for public preview wake flow
 *
 * Tracks the status of sandbox wake operations for public previews.
 * Used by the Cloudflare worker to show loading states.
 */

import { buildKey, getRedis } from "@/lib/core/redis";
import { logger } from "@/lib/telemetry";

export type WakeStatus = "waking" | "live" | "error";

interface WakeEntry {
  status: WakeStatus;
  previewUrl?: string;
  error?: string;
}

const KEY_PREFIX = "wake";
const WAKE_TTL_SECONDS = 5 * 60; // 5 minutes

const wakeKey = (appId: string) => buildKey(KEY_PREFIX, appId);

export const getWakeEntry = async (
  appId: string,
): Promise<WakeEntry | null> => {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get(wakeKey(appId));
    if (!data) return null;
    return JSON.parse(data) as WakeEntry;
  } catch (error) {
    logger.error("Failed to get wake entry", error, { appId });
    return null;
  }
};

export const setWakeEntry = async (
  appId: string,
  entry: WakeEntry,
): Promise<void> => {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(
      wakeKey(appId),
      JSON.stringify(entry),
      "EX",
      WAKE_TTL_SECONDS,
    );
  } catch (error) {
    logger.error("Failed to set wake entry", error, { appId });
  }
};

export const clearWakeEntry = async (appId: string): Promise<void> => {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(wakeKey(appId));
  } catch (error) {
    logger.error("Failed to clear wake entry", error, { appId });
  }
};
