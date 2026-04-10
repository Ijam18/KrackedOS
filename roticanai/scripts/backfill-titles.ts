/**
 * Backfill titles for existing apps in the database.
 *
 * This script:
 * 1. Finds all apps without a title (but with a description)
 * 2. Uses AI to generate a title from the description
 * 3. Updates the app record with the generated title
 *
 * Usage:
 *   bun run scripts/backfill-titles.ts
 *
 * Options:
 *   --all         Regenerate titles for ALL apps (not just missing)
 *   --limit=N     Process only N apps (default: all)
 *   --dry-run     Show what would be done without making changes
 */

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "@/db";
import { app } from "@/db/schema";
import { generateTitle } from "@/lib/services/ai/title";

// Parse CLI arguments
const args = process.argv.slice(2);
const flags = {
  all: args.includes("--all"),
  dryRun: args.includes("--dry-run"),
  limit: (() => {
    const limitArg = args.find((a) => a.startsWith("--limit="));
    return limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : undefined;
  })(),
};

async function main() {
  console.log("📝 Title Backfill Script");
  console.log("================================\n");

  // Find apps that need titles
  const query = flags.all
    ? db
        .select()
        .from(app)
        .where(and(eq(app.status, "active"), isNotNull(app.description)))
    : db
        .select()
        .from(app)
        .where(and(isNull(app.title), isNotNull(app.description)));

  let apps = await query;

  if (flags.limit) {
    apps = apps.slice(0, flags.limit);
  }

  console.log(`📊 Found ${apps.length} apps to process`);
  if (flags.all) {
    console.log("   (--all flag: regenerating all titles)");
  }
  if (flags.dryRun) {
    console.log("   (--dry-run: no changes will be made)");
  }
  console.log("");

  if (apps.length === 0) {
    console.log("✅ No apps need titles. Done!");
    return;
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const appRecord of apps) {
    const appId = appRecord.id;
    const description = appRecord.description;

    process.stdout.write(
      `[${success + skipped + failed + 1}/${apps.length}] ${appId}... `,
    );

    if (!description?.trim()) {
      console.log("⏭️  No description, skipping");
      skipped++;
      continue;
    }

    if (flags.dryRun) {
      console.log(`(dry-run) "${description.slice(0, 50)}..."`);
      skipped++;
      continue;
    }

    try {
      // Generate title using AI
      const title = await Effect.runPromise(
        generateTitle(description).pipe(
          Effect.catchAll((error) => {
            console.log(`❌ ${error.message}`);
            return Effect.fail(error);
          }),
        ),
      );

      // Update app record
      await db
        .update(app)
        .set({ title, updatedAt: new Date() })
        .where(eq(app.id, appId));

      console.log(`✅ "${title}"`);
      success++;
    } catch {
      failed++;
    }

    // Small delay between apps to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("\n================================");
  console.log("📊 Results:");
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log("================================\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
