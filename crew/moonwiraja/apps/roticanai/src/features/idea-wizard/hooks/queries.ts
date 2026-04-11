"use client";

import {
  FetchHttpClient,
  Headers,
  HttpBody,
  HttpClient,
  HttpClientResponse,
} from "@effect/platform";
import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Effect } from "effect";
import { z } from "zod";

const ideaOptionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  starter: z.string().min(1),
});

const suggestResponseSchema = z.object({
  mode: z.literal("suggest"),
  ideas: z.array(ideaOptionSchema).min(3).max(5),
});

const promptResponseSchema = z.object({
  mode: z.literal("prompt"),
  prompt: z.string().min(1),
});

export type WizardIdeaOption = z.infer<typeof ideaOptionSchema>;

export interface GuidedIdeaRequest {
  locale: "en" | "ms";
  category: string;
  categoryLabel: string;
  preference: string;
  preferenceLabel: string;
  refreshCount: number;
}

export interface GuidedPromptRequest {
  locale: "en" | "ms";
  category: string;
  categoryLabel: string;
  preference: string;
  preferenceLabel: string;
  ideaTitle: string;
  ideaDescription: string;
  ideaStarter: string;
}

export const ideaWizardKeys = {
  all: ["idea-wizard"] as const,
  suggestions: (request: GuidedIdeaRequest) =>
    [
      ...ideaWizardKeys.all,
      "suggestions",
      request.locale,
      request.category,
      request.preference,
      request.refreshCount,
    ] as const,
};

const runWithHttp = <A, E>(
  effect: Effect.Effect<A, E, HttpClient.HttpClient>,
) => effect.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise);

const suggestIdeas = (request: GuidedIdeaRequest) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.post("/api/ideas", {
      body: HttpBody.unsafeJson({
        mode: "suggest",
        ...request,
      }),
      headers: Headers.fromInput({ "content-type": "application/json" }),
    });
    yield* HttpClientResponse.filterStatusOk(response);
    const data = yield* response.json;
    return suggestResponseSchema.parse(data).ideas;
  }) as Effect.Effect<WizardIdeaOption[], Error, HttpClient.HttpClient>;

const buildPrompt = (request: GuidedPromptRequest) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.post("/api/ideas", {
      body: HttpBody.unsafeJson({
        mode: "prompt",
        ...request,
      }),
      headers: Headers.fromInput({ "content-type": "application/json" }),
    });
    yield* HttpClientResponse.filterStatusOk(response);
    const data = yield* response.json;
    return promptResponseSchema.parse(data).prompt;
  }) as Effect.Effect<string, Error, HttpClient.HttpClient>;

export function useGuidedIdeasMutation(): UseMutationResult<
  WizardIdeaOption[],
  Error,
  GuidedIdeaRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: GuidedIdeaRequest) =>
      runWithHttp(suggestIdeas(request)),
    onSuccess: (ideas, request) => {
      queryClient.setQueryData(ideaWizardKeys.suggestions(request), ideas);
    },
  });
}

export function useGuidedPromptMutation(): UseMutationResult<
  string,
  Error,
  GuidedPromptRequest
> {
  return useMutation({
    mutationFn: (request: GuidedPromptRequest) =>
      runWithHttp(buildPrompt(request)),
  });
}
