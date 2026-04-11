import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FeedCard } from "@/features/feed/components/feed-card";
import { FeedDetail } from "@/features/feed/components/feed-detail";
import { getCachedPresignedUrl, isStorageConfigured } from "@/lib/core/storage";
import {
  getPublishedAppById,
  getPublishedAppsByAuthor,
  incrementViewCount,
} from "@/lib/services/feed";

interface ExploreDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExploreDetailPage({
  params,
}: ExploreDetailPageProps) {
  const { id } = await params;
  const t = await getTranslations("explore");

  const app = await getPublishedAppById(id);
  if (!app) notFound();

  // Count the view server-side on every page render
  incrementViewCount(id);

  // Generate presigned thumbnail URL
  let thumbnailUrl: string | null = null;
  if (app.thumbnailKey && isStorageConfigured()) {
    thumbnailUrl = await getCachedPresignedUrl(app.thumbnailKey);
  }

  // Get more apps from the same author
  const moreApps = await getPublishedAppsByAuthor(app.author.id, id, 3);

  // Generate thumbnail URLs for more apps
  const moreAppsWithThumbnails = await Promise.all(
    moreApps.map(async (app) => {
      let thumbUrl: string | null = null;
      if (app.thumbnailKey && isStorageConfigured()) {
        thumbUrl = await getCachedPresignedUrl(app.thumbnailKey);
      }
      return { ...app, thumbnailUrl: thumbUrl };
    }),
  );

  return (
    <div className="min-h-full bg-background overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12">
        {/* Back link */}
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 font-mono text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeftIcon className="size-4" />
          {t("backToExplore")}
        </Link>

        <FeedDetail app={{ ...app, thumbnailUrl }} />

        {/* More from author */}
        {moreAppsWithThumbnails.length > 0 && (
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="font-mono text-lg text-foreground mb-6">
              More from {app.author.name}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moreAppsWithThumbnails.map((app) => (
                <FeedCard key={app.id} app={app} liked={false} compact />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
