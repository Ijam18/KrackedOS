import { isStorageConfigured, storage } from "./client";

/**
 * Get the storage key for an app's thumbnail
 */
export function getThumbnailKey(appId: string): string {
  return `thumbnails/${appId}.png`;
}

/**
 * Upload a screenshot buffer to storage
 * @param appId - The app ID to use as the filename
 * @param buffer - The screenshot image buffer (PNG)
 * @returns The storage key (not a URL - use getPresignedUrl to generate URLs)
 */
export async function uploadScreenshot(
  appId: string,
  buffer: Buffer | Uint8Array,
): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error("Storage is not configured");
  }

  const key = getThumbnailKey(appId);
  const file = storage.file(key);

  await file.write(buffer, {
    type: "image/png",
  });

  // Return the key, not a URL (presigned URLs are generated on-demand)
  return key;
}

/**
 * Delete a screenshot from storage
 * @param appId - The app ID whose screenshot to delete
 */
export async function deleteScreenshot(appId: string): Promise<void> {
  if (!isStorageConfigured()) {
    return; // Silently skip if storage not configured
  }

  const key = getThumbnailKey(appId);
  const file = storage.file(key);

  try {
    await file.delete();
  } catch {
    // Ignore errors if file doesn't exist
  }
}

/**
 * Check if a screenshot exists for an app
 * @param appId - The app ID to check
 */
export async function screenshotExists(appId: string): Promise<boolean> {
  if (!isStorageConfigured()) {
    return false;
  }

  const key = getThumbnailKey(appId);
  const file = storage.file(key);

  return file.exists();
}
