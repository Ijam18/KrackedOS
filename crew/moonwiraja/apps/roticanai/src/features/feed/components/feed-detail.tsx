"use client";

import { formatDistanceToNow } from "date-fns";
import {
  EyeIcon,
  GitForkIcon,
  HeartIcon,
  ImageIcon,
  LinkIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  useCheckLikeQuery,
  useRemixAppMutation,
  useToggleLikeMutation,
} from "@/features/feed/hooks/queries";
import type { FeedApp } from "@/lib/services/feed";
import { cn } from "@/lib/ui/utils";

interface FeedDetailProps {
  app: FeedApp & { thumbnailUrl?: string | null };
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function FeedDetail({ app }: FeedDetailProps) {
  const t = useTranslations("explore");
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const { data: likeData } = useCheckLikeQuery(app.id);
  const toggleLike = useToggleLikeMutation();
  const remixApp = useRemixAppMutation();

  const isLiked = likeData?.liked ?? false;

  const handleLike = () => {
    toggleLike.mutate(app.id);
  };

  const handleRemix = () => {
    remixApp.mutate(app.id, {
      onSuccess: (data) => {
        router.push(`/apps/${data.app.id}`);
      },
    });
  };

  const handleShare = async (platform: "x" | "facebook" | "copy") => {
    const shareId = app.slug || app.id;
    const url = `https://${shareId}.rotican.ai`;
    const text = `Check out ${app.title || "this app"} on rotican.ai`;

    switch (platform) {
      case "x":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          "_blank",
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          "_blank",
        );
        break;
      case "copy":
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  const title = app.title || t("untitled");
  const description = app.description || t("noDescription");
  const publishedAt = app.publishedAt ? new Date(app.publishedAt) : null;
  const _timeAgo = publishedAt
    ? formatDistanceToNow(publishedAt, { addSuffix: false }).toUpperCase()
    : "";

  const shareId = app.slug || app.id;
  const appUrl = `https://${shareId}.rotican.ai`;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        {/* Title */}
        <h1 className="font-pixel text-3xl sm:text-4xl lg:text-5xl text-foreground">
          {title}
        </h1>

        {/* Author and Stats Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Author */}
            <Link
              href={`/u/${app.author.username ?? app.author.id}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {app.author.image ? (
                <Image
                  src={app.author.image}
                  alt={app.author.name}
                  width={24}
                  height={24}
                  className="size-6 rounded-full"
                />
              ) : (
                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-mono text-primary">
                    {app.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-mono text-muted-foreground">
                {app.author.username || app.author.name}
              </span>
            </Link>

            {/* Stats */}
            <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <EyeIcon className="size-4" />
                {formatCount(app.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <HeartIcon className="size-4" />
                {formatCount(app.likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <GitForkIcon className="size-4" />
                {formatCount(app.remixCount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Like Button */}
            <button
              type="button"
              onClick={handleLike}
              disabled={toggleLike.isPending}
              className={cn(
                "flex items-center justify-center size-10 border border-border rounded-lg transition-colors",
                isLiked
                  ? "text-red-500 border-red-500"
                  : "text-muted-foreground hover:border-primary hover:text-primary",
              )}
              title={t("like")}
            >
              <HeartIcon className={cn("size-5", isLiked && "fill-current")} />
            </button>

            {/* Remix Button */}
            <button
              type="button"
              onClick={handleRemix}
              disabled={remixApp.isPending}
              className="flex items-center gap-2 px-5 py-2.5 font-mono text-sm border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              <span>+</span>
              <span>{t("makeItYourOwn")}</span>
            </button>

            {/* View Button */}
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 font-mono text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <span>+</span>
              <span>{t("openApp")}</span>
            </a>
          </div>
        </div>
      </div>

      {/* App Preview */}
      <div className="aspect-video w-full overflow-hidden border border-border bg-muted/30 rounded-lg">
        {app.thumbnailUrl ? (
          <Image
            src={app.thumbnailUrl}
            alt={title}
            width={1200}
            height={675}
            className="h-full w-full object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
            <ImageIcon className="size-16 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* About and Share Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* About */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-mono text-sm text-foreground">Prompt</h2>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Share */}
        <div className="space-y-3">
          <h2 className="font-mono text-sm text-foreground">Share</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleShare("x")}
              className="flex items-center justify-center size-10 border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
              aria-label="Share on X"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <title>X logo</title>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleShare("facebook")}
              className="flex items-center justify-center size-10 border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
              aria-label="Share on Facebook"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <title>Facebook logo</title>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleShare("copy")}
              className="flex items-center justify-center size-10 border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
              aria-label="Copy link"
            >
              <LinkIcon className="size-4" />
            </button>
          </div>
          {copied && (
            <p className="text-xs font-mono text-muted-foreground">
              Link copied!
            </p>
          )}
          <p className="text-xs font-mono text-muted-foreground/60">
            Last Updated{" "}
            {publishedAt?.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
