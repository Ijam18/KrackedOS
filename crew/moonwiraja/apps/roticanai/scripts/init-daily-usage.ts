/**
 * Initialize daily usage records for all existing users.
 *
 * This script:
 * 1. Finds all users in the database
 * 2. Creates a daily_usage record for today (KL timezone) with count = 0
 * 3. Skips users who already have a record for today
 *
 * Usage:
 *   bun run scripts/init-daily-usage.ts
 *
 * Options:
 *   --dry-run     Show what would be done without making changes
 */

import { nanoid } from "nanoid";
import { db } from "@/db";
import { dailyUsage, user } from "@/db/schema";
import { getKLDate } from "@/lib/services/usage";

// Parse CLI arguments
const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes("--dry-run"),
};

async function main() {
  console.log("📊 Initialize Daily Usage Script");
  console.log("================================\n");

  const today = getKLDate();
  console.log(`📅 Today (KL timezone): ${today}\n`);

  if (flags.dryRun) {
    console.log("   (--dry-run: no changes will be made)\n");
  }

  // Get all users
  const users = await db.select({ id: user.id, email: user.email }).from(user);
  console.log(`👥 Found ${users.length} users\n`);

  if (users.length === 0) {
    console.log("✅ No users found. Done!");
    return;
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const userRecord of users) {
    process.stdout.write(
      `[${created + skipped + failed + 1}/${users.length}] ${userRecord.email}... `,
    );

    if (flags.dryRun) {
      console.log("(dry-run) would create record");
      skipped++;
      continue;
    }

    try {
      // Insert with ON CONFLICT DO NOTHING to skip existing records
      const result = await db
        .insert(dailyUsage)
        .values({
          id: nanoid(12),
          userId: userRecord.id,
          date: today,
          messageCount: 0,
        })
        .onConflictDoNothing()
        .returning({ id: dailyUsage.id });

      if (result.length > 0) {
        console.log("✅ Created");
        created++;
      } else {
        console.log("⏭️  Already exists");
        skipped++;
      }
    } catch (error) {
      console.log(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown"}`,
      );
      failed++;
    }
  }

  console.log("\n================================");
  console.log("📊 Results:");
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log("================================\n");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
