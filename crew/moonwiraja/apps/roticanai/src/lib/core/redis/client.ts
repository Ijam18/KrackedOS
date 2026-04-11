import { RedisClient } from "bun";

/**
 * Redis client singleton using Bun's native Redis API.
 * Reads from REDIS_URL environment variable.
 */
let redis: RedisClient | null = null;

/**
 * Get the Redis client singleton.
 * Returns null if REDIS_URL is not configured.
 */
export function getRedis(): RedisClient | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    redis = new RedisClient(process.env.REDIS_URL);
  }

  return redis;
}

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

/**
 * Key prefix for all myvibe Redis keys
 */
export const KEY_PREFIX = "myvibe";

/**
 * Build a namespaced Redis key
 */
export function buildKey(...parts: string[]): string {
  return [KEY_PREFIX, ...parts].join(":");
}
