/**
 * Sandbox client - E2B SDK helper
 *
 * E2B reads E2B_API_KEY from environment automatically.
 * This module just validates the key is present.
 */

import { Effect } from "effect";
import { ConfigError } from "@/lib/effect/errors";

/**
 * Validate E2B_API_KEY is configured.
 * E2B SDK picks it up from env automatically — this is just a guard.
 */
export const validateE2BConfig = (): Effect.Effect<string, ConfigError> =>
  Effect.gen(function* () {
    const key = process.env.E2B_API_KEY;
    if (!key) {
      return yield* Effect.fail(new ConfigError({ variable: "E2B_API_KEY" }));
    }
    return key;
  });
