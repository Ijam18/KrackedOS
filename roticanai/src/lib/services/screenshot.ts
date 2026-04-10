/**
 * Screenshot service - Capture and save app thumbnails
 *
 * Handles capturing screenshots with Puppeteer and saving to storage
 */

import puppeteer from "puppeteer";
import { isStorageConfigured, uploadScreenshot } from "@/lib/core/storage";
import { updateAppThumbnail } from "@/lib/services/app";

// Thumbnail dimensions (16:9 aspect ratio)
const THUMBNAIL_WIDTH = 1280;
const THUMBNAIL_HEIGHT = 720;

// Debounce timers for each app
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Track in-progress captures to avoid duplicates
const inProgressCaptures = new Set<string>();

// Debounce delay in milliseconds
const DEBOUNCE_DELAY_MS = 1000;

/**
 * Capture a screenshot of a URL using Puppeteer
 * @param url - The URL to capture
 * @returns A Buffer containing the PNG screenshot
 */
export async function captureScreenshot(url: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to desired thumbnail size
    await page.setViewport({
      width: THUMBNAIL_WIDTH,
      height: THUMBNAIL_HEIGHT,
    });

    // Navigate to the URL and wait for network to be idle
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Check if we're on the loading page (preview proxy loader)
    // The loader has data-loading="true" on the html element
    const isLoadingPage = await page.evaluate(() => {
      return document.documentElement.hasAttribute("data-loading");
    });

    if (isLoadingPage) {
      // Wait for navigation to the actual app
      // The proxy will redirect once the sandbox is ready
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 30000,
      });
    }

    // Take screenshot
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false, // Only capture viewport
    });

    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}

/**
 * Capture a screenshot with retry logic
 * @param url - The URL to capture
 * @param maxRetries - Maximum number of retry attempts
 * @param delayMs - Delay between retries in milliseconds
 */
export async function captureScreenshotWithRetry(
  url: string,
  maxRetries = 3,
  delayMs = 1000,
): Promise<Buffer> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await captureScreenshot(url);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(
        `Screenshot attempt ${attempt}/${maxRetries} failed:`,
        lastError.message,
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError ?? new Error("Screenshot capture failed");
}

/**
 * Build the public preview URL for an app
 * @param appId - The app ID
 * @returns The public preview URL (e.g., https://{appId}.rotican.ai)
 */
function buildPublicPreviewUrl(appId: string): string {
  // Use the public rotican.ai domain for screenshots
  // This goes through the preview proxy which handles wake-up and caching
  return `https://${appId}.rotican.ai`;
}

/**
 * Capture a screenshot and save it to storage.
 * This is called after the debounce delay.
 */
async function captureAndSaveScreenshot(appId: string): Promise<void> {
  // Skip if already in progress
  if (inProgressCaptures.has(appId)) {
    return;
  }

  inProgressCaptures.add(appId);

  try {
    // Build the public preview URL
    const previewUrl = buildPublicPreviewUrl(appId);

    // Capture the screenshot
    const screenshot = await captureScreenshotWithRetry(previewUrl);

    // Upload to storage (returns the storage key, not a URL)
    const thumbnailKey = await uploadScreenshot(appId, screenshot);

    // Update the app record with the storage key
    await updateAppThumbnail(appId, thumbnailKey);
  } catch (error) {
    console.error(
      `[Screenshot] Failed to capture screenshot for app ${appId}:`,
      error instanceof Error ? error.message : error,
    );
  } finally {
    inProgressCaptures.delete(appId);
  }
}

/**
 * Schedule a screenshot capture for an app with debouncing.
 * If called multiple times within DEBOUNCE_DELAY_MS, only the last call will execute.
 *
 * @param appId - The app ID
 */
export function scheduleScreenshotCapture(appId: string): void {
  // Skip if storage is not configured
  if (!isStorageConfigured()) {
    return;
  }

  // Clear any existing debounce timer for this app
  const existingTimer = debounceTimers.get(appId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set up new debounced capture
  const timer = setTimeout(() => {
    debounceTimers.delete(appId);
    captureAndSaveScreenshot(appId);
  }, DEBOUNCE_DELAY_MS);

  debounceTimers.set(appId, timer);
}

/**
 * Cancel any pending screenshot capture for an app.
 * Useful when an app is deleted.
 */
export function cancelScreenshotCapture(appId: string): void {
  const timer = debounceTimers.get(appId);
  if (timer) {
    clearTimeout(timer);
    debounceTimers.delete(appId);
  }
}
