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
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Effect } from "effect";

const runWithHttp = <A, E>(
  effect: Effect.Effect<A, E, HttpClient.HttpClient>,
) => effect.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise);

// ============================================================================
// Query Keys
// ============================================================================

export const profileKeys = {
  all: ["profile"] as const,
  checkUsername: (username: string) =>
    [...profileKeys.all, "check-username", username] as const,
};

// ============================================================================
// API Functions
// ============================================================================

interface UsernameAvailability {
  available: boolean;
  reason?: string;
}

const checkUsernameAvailability = (username: string) =>
  HttpClient.get(
    `/api/users/check-username?username=${encodeURIComponent(username)}`,
  ).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
  ) as Effect.Effect<UsernameAvailability, Error, HttpClient.HttpClient>;

interface UpdateProfileData {
  username?: string | null;
  bio?: string | null;
}

interface ProfileResult {
  id: string;
  username: string | null;
  name: string;
  image: string | null;
  bio: string | null;
}

const updateProfile = (data: UpdateProfileData) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.patch("/api/users/me", {
      body: HttpBody.unsafeJson(data),
      headers: Headers.fromInput({ "content-type": "application/json" }),
    });
    yield* HttpClientResponse.filterStatusOk(response);
    return (yield* response.json) as ProfileResult;
  }) as Effect.Effect<ProfileResult, Error, HttpClient.HttpClient>;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Check if a username is available
 */
export function useCheckUsernameQuery(
  username: string,
  enabled = true,
): UseQueryResult<UsernameAvailability, Error> {
  return useQuery({
    queryKey: profileKeys.checkUsername(username),
    queryFn: () => runWithHttp(checkUsernameAvailability(username)),
    enabled: enabled && username.length >= 3,
    staleTime: 10_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Update the current user's profile (username, bio)
 */
export function useUpdateProfileMutation(): UseMutationResult<
  ProfileResult,
  Error,
  UpdateProfileData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileData) => runWithHttp(updateProfile(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
