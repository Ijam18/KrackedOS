/**
 * Sandbox template - E2B template ID for sandbox creation
 *
 * Requires E2B_TEMPLATE_ID env var.
 * To build the template, run: bun run sandbox:build-template
 */

import { Effect } from "effect";
import { ConfigError } from "@/lib/effect/errors";

/**
 * Get the E2B template ID from environment.
 * Throws ConfigError if not set.
 */
export const getTemplateId = (): Effect.Effect<string, ConfigError> =>
  Effect.gen(function* () {
    const templateId = process.env.E2B_TEMPLATE_ID;

    if (!templateId) {
      return yield* Effect.fail(
        new ConfigError({ variable: "E2B_TEMPLATE_ID" }),
      );
    }

    return templateId;
  });
