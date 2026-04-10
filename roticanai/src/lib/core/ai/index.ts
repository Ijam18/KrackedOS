/**
 * AI client module - Anthropic, OpenAI, and OpenRouter SDK setup
 *
 * Usage: import { getModel, generateText, streamText } from "@/lib/core/ai"
 *
 * Examples:
 *   getModel("anthropic", "best")   // Claude best quality model
 *   getModel("anthropic", "fast")   // Claude fast/cheaper model
 *   getModel("openai", "best")      // OpenAI best quality model (GPT-4)
 *   getModel("openai", "fast")      // OpenAI fast/cheaper model (GPT-3.5)
 *   getModel("openrouter", "best")  // OpenRouter best quality model
 *   getModel("openrouter", "fast")  // OpenRouter fast/cheaper model
 */

export type { ModelTier, Provider } from "./client";
export {
  generateObject,
  generateText,
  getModel,
  streamObject,
  streamText,
} from "./client";
export { calculateCost, MODEL_PRICING } from "./pricing";
