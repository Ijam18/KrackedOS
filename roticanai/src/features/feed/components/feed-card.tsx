"use client";

import { formatDistanceToNow } from "date-fns";
import { EyeIcon, GitForkIcon, HeartIcon, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useRemixAppMutation,
  useToggleLikeMutation,
} from "@/features/feed/hooks/queries";
import type { FeedApp } from "@/lib/services/feed";
import { cn, truncateText } from "@/lib/ui/utils";

interface FeedCardProps {
  app: FeedApp & { thumbnailUrl?: string | null };
  liked?: boolean;
  compact?: boolean;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function FeedCard({
  app,
  liked = false,
  compact = false,
}: FeedCardProps) {
  const t = useTranslations("explore");
  const router = useRouter();

  const toggleLike = useToggleLikeMutation();
  const remixApp = useRemixAppMutation();

  const isLiked = liked;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike.mutate(app.id);
  };

  const handleRemix = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    remixApp.mutate(app.id, {
      onSuccess: (data) => {
        router.push(`/apps/${data.app.id}`);
      },
    });
  };

  const title = app.title || truncateText(app.description, 40) || t("untitled");
  const publishedAt = app.publishedAt ? new Date(app.publishedAt) : null;
  const timeAgo = publishedAt
    ? formatDistanceToNow(publishedAt, { addSuffix: false }).toUpperCase()
    : "";

  const detailUrl = `/explore/${app.id}`;

  return (
    <div className="group relative overflow-hidden border border-border bg-card rounded-lg transition-all hover:border-primary">
      {/* Thumbnail */}
      <Link href={detailUrl} className="block">
        <div className="aspect-video w-full overflow-hidden bg-muted/30 relative">
          {app.thumbnailUrl ? (
            <Image
              src={app.thumbnailUrl}
              alt={title}
              width={400}
              height={225}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
              <ImageIcon className="size-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </Link>

      {/* Card content */}
      <div className="p-4">
        {/* Title */}
        <Link href={detailUrl}>
          <h3 className="font-mono text-lg text-foreground group-hover:text-primary transition-colors mb-4 truncate">
            {title}
          </h3>
        </Link>

        {/* Stats and Author row */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          {/* Stats */}
          <div className="flex items-center gap-4">
            {/* View count */}
            <span className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
              <EyeIcon className="size-4" />
              <span>{formatCount(app.viewCount)}</span>
            </span>

            {/* Like button */}
            <button
              type="button"
              onClick={handleLike}
              disabled={toggleLike.isPending}
              className={cn(
                "relative z-10 flex items-center gap-1.5 text-sm font-mono transition-colors cursor-pointer",
                isLiked
                  ? "text-red-500"
                  : "text-muted-foreground hover:text-red-500",
              )}
              title={t("like")}
            >
              <HeartIcon className={cn("size-4", isLiked && "fill-current")} />
              <span>{formatCount(app.likeCount)}</span>
            </button>

            {/* Remix count */}
            <span className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
              <GitForkIcon className="size-4" />
              <span>{formatCount(app.remixCount)}</span>
            </span>
          </div>

          {/* Author */}
          <Link
            href={`/u/${app.author.username ?? app.author.id}`}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {app.author.image ? (
              <Image
                src={app.author.image}
                alt={app.author.name}
                width={24}
                height={24}
                className="size-6 rounded-full shrink-0"
              />
            ) : (
              <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-mono text-primary">
                  {app.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm font-mono text-muted-foreground">
              {app.author.name}
            </span>
          </Link>
        </div>

        {/* Make it your own button - hidden in compact mode */}
        {!compact && (
          <button
            type="button"
            onClick={handleRemix}
            disabled={remixApp.isPending}
            className="relative z-10 mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-mono border border-border rounded-lg transition-colors cursor-pointer hover:border-primary hover:text-primary"
            title={t("makeItYourOwn")}
          >
            <span>+</span>
            <span>{t("makeItYourOwn")}</span>
          </button>
        )}

        {/* Time ago - hidden in compact mode */}
        {!compact && timeAgo && (
          <p
            suppressHydrationWarning
            className="mt-3 text-center text-xs font-mono text-muted-foreground/60"
          >
            {timeAgo}
          </p>
        )}
      </div>
    </div>
  );
}
