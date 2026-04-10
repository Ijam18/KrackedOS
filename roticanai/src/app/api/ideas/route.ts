import { Effect, Match, Schema } from "effect";
import {
  BuildGuidedPromptRequest,
  GenerateIdeasRequest,
  InternalError,
  parseBody,
  runHandler,
} from "@/lib/effect";
import { buildGuidedPrompt, generateGuidedIdeas } from "@/lib/services/ai";

const GuidedIdeasRequest = Schema.Union(
  GenerateIdeasRequest,
  BuildGuidedPromptRequest,
);

export const POST = (req: Request) =>
  runHandler(
    Effect.gen(function* () {
      const body = yield* parseBody(GuidedIdeasRequest, req);

      return yield* Match.value(body).pipe(
        Match.when({ mode: "suggest" }, (input) =>
          generateGuidedIdeas(input).pipe(
            Effect.mapError(
              (error) =>
                new InternalError({
                  message: error.message,
                  cause: error,
                }),
            ),
            Effect.map((ideas) => ({
              mode: "suggest" as const,
              ideas,
            })),
          ),
        ),
        Match.when({ mode: "prompt" }, (input) =>
          buildGuidedPrompt(input).pipe(
            Effect.mapError(
              (error) =>
                new InternalError({
                  message: error.message,
                  cause: error,
                }),
            ),
            Effect.map((prompt) => ({
              mode: "prompt" as const,
              prompt,
            })),
          ),
        ),
        Match.exhaustive,
      );
    }),
    "api-guided-ideas",
  );
