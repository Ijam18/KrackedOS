/**
 * Model pricing configuration
 *
 * Pricing in dollars per million tokens
 */

export const MODEL_PRICING: Record<string, { input: number; output: number }> =
  {
    "claude-opus-4-5": { input: 5.0, output: 25.0 },
  };

const DEFAULT_PRICING = MODEL_PRICING["claude-opus-4-5"];

/**
 * Calculate cost in dollars for token usage
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): number {
  // Try exact match first, then prefix match (e.g., "claude-opus-4-5-20250101" → "claude-opus-4-5")
  const pricing =
    MODEL_PRICING[modelId] ??
    Object.entries(MODEL_PRICING).find(([key]) =>
      modelId.startsWith(key),
    )?.[1] ??
    DEFAULT_PRICING;

  return (
    (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000
  );
}
