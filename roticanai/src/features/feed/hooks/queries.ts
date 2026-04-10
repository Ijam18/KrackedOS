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
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Effect } from "effect";
import { ensureGuestSession } from "@/features/apps/hooks/queries";
import type { FeedResult } from "@/lib/services/feed";

export { feedKeys } from "./keys";

import { feedKeys } from "./keys";

const runWithHttp = <A, E>(
  effect: Effect.Effect<A, E, HttpClient.HttpClient>,
) => effect.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise);

// ============================================================================
// API Functions
// ============================================================================

const fetchFeed = (sort: string, limit: number, offset: number) =>
  HttpClient.get(`/api/feed?sort=${sort}&limit=${limit}&offset=${offset}`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
    Effect.map((data) => data as FeedResult),
  ) as Effect.Effect<FeedResult, Error, HttpClient.HttpClient>;

const toggleLike = (appId: string) =>
  HttpClient.post(`/api/apps/${appId}/like`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
    Effect.map((data) => data as { liked: boolean }),
  ) as Effect.Effect<{ liked: boolean }, Error, HttpClient.HttpClient>;

const checkLike = (appId: string) =>
  HttpClient.get(`/api/apps/${appId}/like`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
    Effect.map((data) => data as { liked: boolean }),
  ) as Effect.Effect<{ liked: boolean }, Error, HttpClient.HttpClient>;

const batchCheckLikes = (appIds: string[]) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.post("/api/feed/likes", {
      body: HttpBody.unsafeJson({ appIds }),
      headers: Headers.fromInput({ "content-type": "application/json" }),
    });
    yield* HttpClientResponse.filterStatusOk(response);
    const data = yield* response.json;
    return data as { liked: Record<string, boolean> };
  }) as Effect.Effect<
    { liked: Record<string, boolean> },
    Error,
    HttpClient.HttpClient
  >;

const publishApp = (appId: string, published: boolean) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.post(`/api/apps/${appId}/publish`, {
      body: HttpBody.unsafeJson({ published }),
      headers: Headers.fromInput({ "content-type": "application/json" }),
    });
    yield* HttpClientResponse.filterStatusOk(response);
    return yield* response.json;
  }) as Effect.Effect<unknown, Error, HttpClient.HttpClient>;

const remixApp = (appId: string) =>
  HttpClient.post(`/api/apps/${appId}/remix`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
    Effect.map((data) => data as { app: { id: string } }),
  ) as Effect.Effect<{ app: { id: string } }, Error, HttpClient.HttpClient>;

const recordView = (appId: string) =>
  HttpClient.post(`/api/apps/${appId}/view`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.asVoid,
  ) as Effect.Effect<void, Error, HttpClient.HttpClient>;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Infinite scroll feed query
 */
export function useFeedQuery(sort: "recent" | "popular" = "recent") {
  return useInfiniteQuery({
    queryKey: feedKeys.list(sort),
    queryFn: ({ pageParam = 0 }) => runWithHttp(fetchFeed(sort, 20, pageParam)),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.reduce((acc, page) => acc + page.apps.length, 0);
    },
    staleTime: 30_000, // 30 seconds
  });
}

/**
 * Check if the current user has liked an app
 */
export function useCheckLikeQuery(
  appId: string,
  enabled = true,
): UseQueryResult<{ liked: boolean }, Error> {
  return useQuery({
    queryKey: feedKeys.like(appId),
    queryFn: () => runWithHttp(checkLike(appId)),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Batch check which apps the current user has liked.
 * Single request instead of N individual checks.
 */
export function useBatchLikesQuery(appIds: string[], enabled = true) {
  return useQuery({
    queryKey: feedKeys.batchLikes(appIds),
    queryFn: () => runWithHttp(batchCheckLikes(appIds)),
    enabled: enabled && appIds.length > 0,
    staleTime: 60_000,
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Toggle like on an app.
 * Optimistically updates both individual and batch like caches.
 */
export function useToggleLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      await ensureGuestSession();
      return runWithHttp(toggleLike(appId));
    },
    onMutate: async (appId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: feedKeys.all });

      // Snapshot previous individual like state
      const previousLike = queryClient.getQueryData<{ liked: boolean }>(
        feedKeys.like(appId),
      );

      // Optimistically toggle individual cache
      queryClient.setQueryData(
        feedKeys.like(appId),
        (old: { liked: boolean } | undefined) => ({
          liked: !(old?.liked ?? false),
        }),
      );

      // Optimistically toggle in all batch likes caches
      const batchQueries = queryClient.getQueriesData<{
        liked: Record<string, boolean>;
      }>({ queryKey: [...feedKeys.all, "likes"] });

      const previousBatches = batchQueries.map(
        ([key, data]) => [key, data] as const,
      );

      for (const [key, data] of batchQueries) {
        if (data && appId in data.liked) {
          queryClient.setQueryData(key, {
            liked: { ...data.liked, [appId]: !data.liked[appId] },
          });
        }
      }

      return { previousLike, previousBatches };
    },
    onError: (_err, appId, context) => {
      // Rollback individual cache
      if (context?.previousLike) {
        queryClient.setQueryData(feedKeys.like(appId), context.previousLike);
      }
      // Rollback batch caches
      if (context?.previousBatches) {
        for (const [key, data] of context.previousBatches) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      // Refetch feed to get updated counts
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}

/**
 * Publish or unpublish an app
 */
export function usePublishAppMutation(): UseMutationResult<
  unknown,
  Error,
  { appId: string; published: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId, published }) =>
      runWithHttp(publishApp(appId, published)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}

/**
 * Remix an app (creates a new app from the published app's prompt)
 */
export function useRemixAppMutation(): UseMutationResult<
  { app: { id: string } },
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      await ensureGuestSession();
      return runWithHttp(remixApp(appId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedKeys.all });
    },
  });
}

/**
 * Record a view on a published app (fire-and-forget)
 */
export function useRecordView() {
  return useMutation({
    mutationFn: (appId: string) => runWithHttp(recordView(appId)),
    // No cache invalidation needed - view count updates are background
  });
}
