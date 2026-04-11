/**
 * Cleanup stale guest users that never converted to real accounts.
 * Deletes guest users (and their cascading apps/messages) older than 7 days.
 *
 * Usage: bun run scripts/cleanup-guests.ts
 */

import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

const STALE_DAYS = 7;

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - STALE_DAYS);

  console.log(
    `[cleanup-guests] Deleting guest users created before ${cutoff.toISOString()}...`,
  );

  const deleted = await db
    .delete(user)
    .where(and(eq(user.isGuest, true), lt(user.createdAt, cutoff)))
    .returning({ id: user.id });

  console.log(`[cleanup-guests] Deleted ${deleted.length} stale guest users`);

  for (const row of deleted) {
    console.log(`  - ${row.id}`);
  }
}

main().catch((err) => {
  console.error("[cleanup-guests] Fatal error:", err);
  process.exit(1);
});
