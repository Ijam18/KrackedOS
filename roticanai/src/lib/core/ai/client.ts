import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel, TelemetrySettings } from "ai";

export type Provider = "anthropic" | "openai" | "openrouter";
export type ModelTier = "fast" | "best" | "chat";

// Provider instances
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Telemetry configuration for AI SDK
 * Pass this to generateText/streamText to enable OpenTelemetry tracing
 *
 * @example
 * ```ts
 * await generateText({
 *   model: getModel("anthropic", "best"),
 *   prompt: "Hello",
 *   experimental_telemetry: getAITelemetry("chat"),
 * });
 * ```
 */
export const getAITelemetry = (functionId: string): TelemetrySettings => ({
  isEnabled: process.env.OTEL_ENABLED !== "false",
  functionId,
  metadata: {
    service: "myvibe",
  },
});

// Model configuration per provider and tier
const models = {
  anthropic: {
    best: process.env.ANTHROPIC_BEST_MODEL as string,
    fast: process.env.ANTHROPIC_FAST_MODEL as string,
    chat: process.env.ANTHROPIC_CHAT_MODEL as string,
  },
  openai: {
    best: process.env.OPENAI_BEST_MODEL as string,
    fast: process.env.OPENAI_FAST_MODEL as string,
    chat: process.env.OPENAI_CHAT_MODEL as string,
  },
  openrouter: {
    best: process.env.OPENROUTER_BEST_MODEL as string,
    fast: process.env.OPENROUTER_FAST_MODEL as string,
    chat: process.env.OPENROUTER_CHAT_MODEL as string,
  },
};

/**
 * Get an AI model by provider and tier
 * @param provider - "anthropic", "openai", or "openrouter"
 * @param tier - "fast" (smaller/cheaper) or "best" (larger/smarter)
 */
export function getModel(provider: Provider, tier: ModelTier): LanguageModel {
  const modelId = models[provider][tier];

  switch (provider) {
    case "anthropic":
      return anthropic(modelId);
    case "openai":
      return openai.chat(modelId);
    case "openrouter":
      return openrouter(modelId);
  }
}

export { generateObject, generateText, streamObject, streamText } from "ai";
