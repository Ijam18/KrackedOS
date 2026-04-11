/**
 * Prompt enhancement for first user message
 *
 * Expands brief app ideas into detailed specifications using a fast LLM.
 */

import { eq } from "drizzle-orm";
import { Effect, Schedule } from "effect";
import { db } from "@/db";
import { app } from "@/db/schema";
import { generateText, getModel } from "@/lib/core/ai";
import { logger } from "@/lib/telemetry";
import { buildEnhancePrompt } from "./prompts";

/**
 * Enhance a user's initial app description into a detailed spec.
 * Retries up to 2 times on failure with exponential backoff.
 * Falls back to original message if all retries fail.
 */
export const enhanceUserPrompt = (
  userMessage: string,
): Effect.Effect<string, never> =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: () =>
        generateText({
          model: getModel("openai", "best"),
          prompt: buildEnhancePrompt(userMessage),
          maxOutputTokens: 2000,
        }),
      catch: (error) =>
        new Error(
          `Prompt enhancement failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
    });

    return result.text.trim();
  }).pipe(
    Effect.retry(
      Schedule.exponential("100 millis").pipe(
        Schedule.compose(Schedule.recurs(2)),
      ),
    ),
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        yield* Effect.sync(() => {
          logger.warn("Prompt enhancement failed, using original", {
            error: error.message,
            promptLength: userMessage.length,
          });
        });
        return userMessage;
      }),
    ),
  );

/**
 * Enhance and save the prompt for an app.
 */
const enhanceAndSavePrompt = (
  appId: string,
  originalPrompt: string,
): Effect.Effect<string, never> =>
  Effect.gen(function* () {
    const enhanced = yield* enhanceUserPrompt(originalPrompt);

    yield* Effect.tryPromise({
      try: () =>
        db
          .update(app)
          .set({ enhancedPrompt: enhanced, updatedAt: new Date() })
          .where(eq(app.id, appId)),
      catch: () => new Error("Failed to save enhanced prompt"),
    }).pipe(Effect.catchAll(() => Effect.void));

    return enhanced;
  });

/**
 * Schedule prompt enhancement for an app (fire-and-forget).
 * This function returns immediately and enhances the prompt in the background.
 */
export function scheduleEnhancePrompt(
  appId: string,
  originalPrompt: string,
): void {
  if (!originalPrompt?.trim()) {
    return;
  }

  Effect.runPromise(
    enhanceAndSavePrompt(appId, originalPrompt).pipe(
      Effect.tap((enhanced) =>
        Effect.sync(() => {
          logger.info("Prompt enhanced", {
            appId,
            originalLength: originalPrompt.length,
            enhancedLength: enhanced.length,
          });
        }),
      ),
    ),
  );
}
