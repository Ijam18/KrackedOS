import { S3Client } from "bun";
import { buildKey, getRedis } from "@/lib/core/redis";

/**
 * S3-compatible storage client using Bun's native S3 API.
 * Works with Railway Buckets, Cloudflare R2, AWS S3, and other S3-compatible services.
 *
 * For Railway, set these env vars (auto-injected when using Bun preset):
 * - S3_ENDPOINT (e.g., https://storage.railway.app)
 * - S3_ACCESS_KEY_ID
 * - S3_SECRET_ACCESS_KEY
 * - S3_BUCKET
 */
export const storage = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  bucket: process.env.S3_BUCKET,
});

// Cache TTL: 6 days (slightly less than 7-day URL expiry)
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 6;

/**
 * Generate a presigned URL for reading a file.
 * URLs are cached in Redis to avoid regenerating on every request.
 *
 * @param key - The file key/path in the bucket
 * @param expiresIn - Expiration time in seconds (default: 7 days)
 */
export function getPresignedUrl(
  key: string,
  expiresIn = 60 * 60 * 24 * 7,
): string {
  return storage.presign(key, {
    expiresIn,
    method: "GET",
  });
}

/**
 * Get a presigned URL with Redis caching.
 * Falls back to generating a new URL if Redis is unavailable.
 *
 * @param key - The file key/path in the bucket
 */
export async function getCachedPresignedUrl(key: string): Promise<string> {
  const redisClient = getRedis();

  if (redisClient) {
    try {
      const cacheKey = buildKey("presigned", key);
      const cached = await redisClient.get(cacheKey);

      if (cached) {
        return cached;
      }

      // Generate new presigned URL
      const url = getPresignedUrl(key);

      // Cache it with TTL (fire-and-forget)
      redisClient.set(cacheKey, url, "EX", CACHE_TTL_SECONDS).catch(() => {
        // Ignore cache write errors
      });

      return url;
    } catch {
      // Fall back to non-cached on Redis error
    }
  }

  // No Redis or Redis error - generate without caching
  return getPresignedUrl(key);
}

/**
 * Check if storage is configured
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET
  );
}
