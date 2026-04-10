/**
 * Backfill thumbnails for existing apps in the database.
 *
 * This script:
 * 1. Finds all apps without a thumbnailKey
 * 2. For each app, gets the sandbox info (if available)
 * 3. Captures a screenshot of the preview
 * 4. Uploads to storage and updates the app record
 *
 * Note: Sandboxes must be running for screenshots to work.
 * Cold sandboxes will be skipped.
 *
 * Usage:
 *   bun run scripts/backfill-thumbnails.ts
 *
 * Options:
 *   --all         Regenerate thumbnails for ALL apps (not just missing)
 *   --limit=N     Process only N apps (default: all)
 *   --dry-run     Show what would be done without making changes
 */

import { eq, isNull } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "@/db";
import { app } from "@/db/schema";
import { isStorageConfigured, uploadScreenshot } from "@/lib/core/storage";
import { updateAppThumbnail } from "@/lib/services/app";
import {
  getSandbox,
  isDevServerReady,
  type SandboxInfo,
} from "@/lib/services/sandbox";
import { captureScreenshotWithRetry } from "@/lib/services/screenshot";

// Parse CLI arguments
const args = process.argv.slice(2);
const flags = {
  all: args.includes("--all"),
  dryRun: args.includes("--dry-run"),
  limit: (() => {
    const limitArg = args.find((a) => a.startsWith("--limit="));
    return limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;
  })(),
};

async function main() {
  console.log("🖼️  Thumbnail Backfill Script");
  console.log("================================\n");

  // Check storage configuration
  if (!isStorageConfigured()) {
    console.error(
      "❌ Storage is not configured. Set S3_* environment variables.",
    );
    process.exit(1);
  }

  // Find apps that need thumbnails
  const query = flags.all
    ? db.select().from(app).where(eq(app.status, "active"))
    : db.select().from(app).where(isNull(app.thumbnailKey));

  let apps = await query;

  if (flags.limit) {
    apps = apps.slice(0, flags.limit);
  }

  console.log(`📊 Found ${apps.length} apps to process`);
  if (flags.all) {
    console.log("   (--all flag: regenerating all thumbnails)");
  }
  if (flags.dryRun) {
    console.log("   (--dry-run: no changes will be made)\n");
  }
  console.log("");

  if (apps.length === 0) {
    console.log("✅ No apps need thumbnails. Done!");
    return;
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const appRecord of apps) {
    const appId = appRecord.id;
    const title =
      appRecord.title || appRecord.description?.slice(0, 30) || appId;

    process.stdout.write(
      `[${success + skipped + failed + 1}/${apps.length}] ${title}... `,
    );

    if (flags.dryRun) {
      console.log("(dry-run, skipped)");
      skipped++;
      continue;
    }

    // Check if app has a sandbox
    if (!appRecord.sandboxId) {
      console.log("⏭️  No sandbox, skipping");
      skipped++;
      continue;
    }

    try {
      // Get sandbox info
      const sandboxResult = await Effect.runPromise(
        getSandbox(appId).pipe(
          Effect.catchAll((error) => {
            console.log(`⏭️  Sandbox not available: ${error._tag}`);
            return Effect.succeed(null as SandboxInfo | null);
          }),
        ),
      );

      if (!sandboxResult?.previewUrl) {
        skipped++;
        continue;
      }

      // Check if dev server is ready
      const isReady = await Effect.runPromise(isDevServerReady(appId));

      if (!isReady) {
        // Dev server auto-starts via E2B template setStartCmd.
        // If it's not ready, the sandbox may be stale — skip.
        console.log("⏭️  Dev server not ready, skipping");
        skipped++;
        continue;
      }

      // Capture screenshot using the public preview URL
      // This goes through the preview proxy which handles wake-up
      const publicPreviewUrl = `https://${appId}.rotican.ai`;
      const screenshot = await captureScreenshotWithRetry(
        publicPreviewUrl,
        3,
        2000,
      );

      // Upload to storage
      const thumbnailKey = await uploadScreenshot(appId, screenshot);

      // Update app record
      await updateAppThumbnail(appId, thumbnailKey);

      console.log("✅");
      success++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${message}`);
      failed++;
    }

    // Small delay between apps to avoid overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n================================");
  console.log(`📊 Results:`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log("================================\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
