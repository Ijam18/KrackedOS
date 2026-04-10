import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import { FeedGrid } from "@/features/feed/components/feed-grid";
import { feedKeys } from "@/features/feed/hooks/keys";
import { getCachedPresignedUrl, isStorageConfigured } from "@/lib/core/storage";
import type { FeedResult } from "@/lib/services/feed";
import { getPublishedApps } from "@/lib/services/feed";

/** Serialize Date objects to ISO strings so hydrated data matches API responses. */
function serializeFeedResult(result: FeedResult): FeedResult {
  return {
    ...result,
    apps: result.apps.map((app) => ({
      ...app,
      publishedAt: app.publishedAt
        ? (app.publishedAt.toISOString() as unknown as Date)
        : null,
      createdAt: app.createdAt.toISOString() as unknown as Date,
    })),
  };
}

export default async function ExplorePage() {
  const _t = await getTranslations("explore");

  // Server-side QueryClient for prefetching
  const queryClient = new QueryClient();

  // Prefetch the first page of the "recent" feed into the query cache
  await queryClient.prefetchInfiniteQuery({
    queryKey: feedKeys.list("recent"),
    queryFn: async ({ pageParam = 0 }) => {
      const result = await getPublishedApps({
        sort: "recent",
        limit: 20,
        offset: pageParam,
      });
      // Serialize dates so hydrated cache matches client-fetched data
      return serializeFeedResult(result);
    },
    initialPageParam: 0,
  });

  // Extract the prefetched apps to resolve presigned thumbnail URLs
  const dehydratedState = dehydrate(queryClient);
  const prefetchedApps =
    (
      dehydratedState.queries[0]?.state.data as
        | { pages: FeedResult[] }
        | undefined
    )?.pages.flatMap((p) => p.apps) ?? [];

  // Generate presigned URLs for thumbnails (server-side)
  const storageEnabled = isStorageConfigured();
  const thumbnailUrls: Record<string, string | null> = {};

  if (storageEnabled) {
    await Promise.all(
      prefetchedApps.map(async (app) => {
        if (app.thumbnailKey) {
          thumbnailUrls[app.id] = await getCachedPresignedUrl(app.thumbnailKey);
        }
      }),
    );
  }

  return (
    <div className="min-h-full bg-background overflow-x-hidden">
      {/* Header */}
      <header>
        <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12 text-center">
          <h1 className="font-pixel text-4xl sm:text-5xl lg:text-6xl text-foreground mb-4">
            Get Inspired
          </h1>
          <p className="font-mono text-sm text-muted-foreground max-w-2xl mx-auto">
            Discover the best apps, components and starters from the community.
          </p>
        </div>
      </header>

      {/* Feed content - hydrated with server-prefetched data */}
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-4 sm:py-8 w-full">
        <HydrationBoundary state={dehydratedState}>
          <FeedGrid thumbnailUrls={thumbnailUrls} />
        </HydrationBoundary>
      </main>
    </div>
  );
}
