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
} from "@tanstack/react-query";
import { Effect } from "effect";
import { setGuestFlag } from "@/features/auth/hooks/use-auth";

const runWithHttp = <A, E>(
  effect: Effect.Effect<A, E, HttpClient.HttpClient>,
) => effect.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise);

// ============================================================================
// Guest Session
// ============================================================================

interface GuestSession {
  id: string;
  name: string;
  isGuest: boolean;
  isNew: boolean;
}

export const createGuestSession = () =>
  HttpClient.post("/api/auth/guest").pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
    Effect.map((data) => data as GuestSession),
  ) as Effect.Effect<GuestSession, Error, HttpClient.HttpClient>;

export const ensureGuestSession = async () => {
  const guestSession = await runWithHttp(createGuestSession());
  setGuestFlag();
  return guestSession;
};

// ============================================================================
// App Creation
// ============================================================================

/** Error types for createApp */
export class UnauthorizedError {
  readonly _tag = "UnauthorizedError" as const;
}

export class RateLimitedError {
  readonly _tag = "RateLimitedError" as const;
  constructor(readonly resetsAt: string) {}
}

export class AppCreationError {
  readonly _tag = "AppCreationError" as const;
  constructor(readonly message: string) {}
}

interface CreatedApp {
  id: string;
}

export const createApp = (initialPrompt: string) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.post("/api/apps", {
      body: HttpBody.unsafeJson({ initialPrompt }),
      headers: Headers.fromInput({ "content-type": "application/json" }),
    });

    if (response.status === 401) {
      return yield* Effect.fail(new UnauthorizedError());
    }
    if (response.status === 429) {
      const body = yield* response.json;
      const data = body as { resetsAt?: string };
      return yield* Effect.fail(
        new RateLimitedError(data.resetsAt ?? new Date().toISOString()),
      );
    }
    if (response.status >= 400) {
      const body = yield* response.json;
      const data = body as { error?: string };
      return yield* Effect.fail(
        new AppCreationError(data.error ?? "Failed to create app"),
      );
    }

    const body = yield* response.json;
    return body as CreatedApp;
  }) as Effect.Effect<
    CreatedApp,
    UnauthorizedError | RateLimitedError | AppCreationError,
    HttpClient.HttpClient
  >;

// ============================================================================
// Query Keys
// ============================================================================

export const appKeys = {
  all: ["apps"] as const,
  checkSlug: (slug: string, appId: string) =>
    [...appKeys.all, "check-slug", slug, appId] as const,
};

export const usageKeys = {
  daily: ["usage", "daily"] as const,
};

// ============================================================================
// API Functions
// ============================================================================

const deleteApp = (appId: string) =>
  HttpClient.del(`/api/apps/${appId}?permanent=true`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.asVoid,
  ) as Effect.Effect<void, Error, HttpClient.HttpClient>;

// ============================================================================
// Usage Types & API
// ============================================================================

export interface DailyUsage {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string; // ISO string
}

interface UsageResponse {
  daily: DailyUsage;
}

const fetchDailyUsage = () =>
  HttpClient.get("/api/usage").pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
    Effect.map((data) => (data as UsageResponse).daily),
  ) as Effect.Effect<DailyUsage, Error, HttpClient.HttpClient>;

interface SlugAvailability {
  available: boolean;
  reason?: string;
}

const checkSlugAvailability = (slug: string, appId: string) =>
  HttpClient.get(
    `/api/apps/check-slug?slug=${encodeURIComponent(slug)}&appId=${encodeURIComponent(appId)}`,
  ).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
  ) as Effect.Effect<SlugAvailability, Error, HttpClient.HttpClient>;

interface UpdateAppSlugParams {
  appId: string;
  slug: string | null;
}

const updateAppSlug = (params: UpdateAppSlugParams) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.patch(`/api/apps/${params.appId}`, {
      body: HttpBody.unsafeJson({ slug: params.slug }),
      headers: Headers.fromInput({ "content-type": "application/json" }),
    });
    yield* HttpClientResponse.filterStatusOk(response);
    return yield* response.json;
  }) as Effect.Effect<unknown, Error, HttpClient.HttpClient>;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Check if a slug is available
 */
export function useCheckSlugQuery(
  slug: string,
  appId: string,
  enabled = true,
): UseQueryResult<SlugAvailability, Error> {
  return useQuery({
    queryKey: appKeys.checkSlug(slug, appId),
    queryFn: () => runWithHttp(checkSlugAvailability(slug, appId)),
    enabled: enabled && slug.length >= 3,
    staleTime: 10_000, // Cache for 10 seconds
  });
}

/**
 * Get current user's daily usage stats
 */
export function useDailyUsageQuery(
  enabled = true,
  initialData?: DailyUsage,
): UseQueryResult<DailyUsage, Error> {
  return useQuery({
    queryKey: usageKeys.daily,
    queryFn: () => runWithHttp(fetchDailyUsage()),
    enabled,
    initialData,
    staleTime: 30_000, // Cache for 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useDeleteAppMutation(): UseMutationResult<void, Error, string> {
  return useMutation({
    mutationFn: (appId: string) => runWithHttp(deleteApp(appId)),
  });
}

/**
 * Update an app's slug
 */
export function useUpdateSlugMutation(): UseMutationResult<
  unknown,
  Error,
  UpdateAppSlugParams
> {
  return useMutation({
    mutationFn: (params: UpdateAppSlugParams) =>
      runWithHttp(updateAppSlug(params)),
  });
}
