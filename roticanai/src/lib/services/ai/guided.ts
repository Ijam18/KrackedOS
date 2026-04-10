import { Effect } from "effect";
import { z } from "zod";
import { generateObject, generateText, getModel } from "@/lib/core/ai/client";
import { logger } from "@/lib/telemetry";
import {
  buildGuidedIdeasPrompt,
  buildGuidedPromptPrompt,
} from "./prompts/guided";

const guidedIdeaOptionSchema = z.object({
  title: z.string().min(1).max(60),
  description: z.string().min(1).max(160),
  starter: z.string().min(1).max(100),
});

const guidedIdeasResponseSchema = z.object({
  ideas: z.array(guidedIdeaOptionSchema).min(3).max(5),
});

export type WizardIdeaOption = z.infer<typeof guidedIdeaOptionSchema>;

export interface GuidedIdeaRequest {
  locale: "en" | "ms";
  category: string;
  categoryLabel: string;
  preference: string;
  preferenceLabel: string;
  refreshCount?: number;
}

export interface GuidedPromptRequest extends GuidedIdeaRequest {
  ideaTitle: string;
  ideaDescription: string;
  ideaStarter: string;
}

export const generateGuidedIdeas = (
  input: GuidedIdeaRequest,
): Effect.Effect<WizardIdeaOption[], Error> =>
  Effect.tryPromise({
    try: async () => {
      const result = await generateObject({
        model: getModel("openai", "fast"),
        schema: guidedIdeasResponseSchema,
        prompt: buildGuidedIdeasPrompt({
          locale: input.locale,
          categoryLabel: input.categoryLabel,
          preferenceLabel: input.preferenceLabel,
          refreshCount: input.refreshCount ?? 0,
        }),
      });

      return result.object.ideas;
    },
    catch: (error) =>
      new Error(
        `Guided ideas generation failed: ${error instanceof Error ? error.message : String(error)}`,
      ),
  }).pipe(
    Effect.tap((ideas) =>
      Effect.sync(() => {
        logger.info("Guided ideas generated", {
          category: input.category,
          preference: input.preference,
          locale: input.locale,
          count: ideas.length,
        });
      }),
    ),
  );

export const buildGuidedPrompt = (
  input: GuidedPromptRequest,
): Effect.Effect<string, Error> =>
  Effect.tryPromise({
    try: async () => {
      const result = await generateText({
        model: getModel("openai", "fast"),
        prompt: buildGuidedPromptPrompt(input),
        maxOutputTokens: 180,
      });

      return result.text.trim();
    },
    catch: (error) =>
      new Error(
        `Guided prompt generation failed: ${error instanceof Error ? error.message : String(error)}`,
      ),
  }).pipe(
    Effect.tap((prompt) =>
      Effect.sync(() => {
        logger.info("Guided prompt built", {
          category: input.category,
          preference: input.preference,
          locale: input.locale,
          promptLength: prompt.length,
        });
      }),
    ),
  );
