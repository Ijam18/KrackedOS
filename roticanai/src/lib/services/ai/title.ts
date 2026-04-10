/**
 * AI title generation
 *
 * Generates titles for apps using AI
 */

import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "@/db";
import { app } from "@/db/schema";
import { generateText, getModel } from "@/lib/core/ai";
import { logger } from "@/lib/telemetry";
import { titlePrompt } from "./prompts";

/**
 * Generate a title for an app using AI.
 * Returns an Effect that resolves to the generated title.
 */
export const generateTitle = (
  description: string,
): Effect.Effect<string, Error> =>
  Effect.tryPromise({
    try: async () => {
      const result = await generateText({
        model: getModel("openai", "fast"),
        prompt: titlePrompt.replace("{description}", description),
        maxOutputTokens: 50,
      });

      // Clean up the title - remove quotes, extra whitespace, etc.
      const title = result.text
        .trim()
        .replace(/^["']|["']$/g, "") // Remove surrounding quotes
        .replace(/[.!?]$/, ""); // Remove trailing punctuation

      return title;
    },
    catch: (error) =>
      new Error(
        `Title generation failed: ${error instanceof Error ? error.message : String(error)}`,
      ),
  });

/**
 * Update an app's title in the database.
 */
const updateAppTitle = (
  appId: string,
  title: string,
): Effect.Effect<void, Error> =>
  Effect.tryPromise({
    try: async () => {
      await db
        .update(app)
        .set({ title, updatedAt: new Date() })
        .where(eq(app.id, appId));
    },
    catch: (error) =>
      new Error(
        `Failed to update app title: ${error instanceof Error ? error.message : String(error)}`,
      ),
  });

/**
 * Generate and save a title for an app.
 * This is the main Effect program that combines generation and persistence.
 */
const generateAndSaveTitle = (
  appId: string,
  description: string,
): Effect.Effect<string, Error> =>
  Effect.gen(function* () {
    const title = yield* generateTitle(description);
    yield* updateAppTitle(appId, title);
    return title;
  });

/**
 * Schedule title generation for an app (fire-and-forget).
 * This function returns immediately and generates the title in the background.
 * Errors are logged but don't affect the caller.
 */
export function scheduleGenerateTitle(
  appId: string,
  description: string,
): void {
  // Skip if no description provided
  if (!description?.trim()) {
    return;
  }

  // Fire-and-forget: run the effect and ignore the result
  Effect.runPromise(
    generateAndSaveTitle(appId, description).pipe(
      Effect.tap((title) =>
        Effect.sync(() => {
          logger.info("Title generated", { appId, title });
        }),
      ),
      Effect.catchAll((error) =>
        Effect.sync(() => {
          logger.error("Title generation failed", error, { appId });
        }),
      ),
    ),
  );
}
