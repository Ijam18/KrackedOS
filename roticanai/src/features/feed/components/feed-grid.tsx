"use client";

import { ArrowDownIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedApp } from "@/lib/services/feed";
import { useBatchLikesQuery, useFeedQuery } from "../hooks/queries";
import { FeedCard } from "./feed-card";

interface FeedGridProps {
  /** Pre-resolved thumbnail URLs from server, keyed by app ID */
  thumbnailUrls?: Record<string, string | null>;
}

export function FeedGrid({ thumbnailUrls }: FeedGridProps) {
  const t = useTranslations("explore");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useFeedQuery(sort);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Infinite scroll with intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  const allApps: (FeedApp & { thumbnailUrl?: string | null })[] =
    data?.pages.flatMap((page) =>
      page.apps.map((app) => ({
        ...app,
        thumbnailUrl: thumbnailUrls?.[app.id] ?? null,
      })),
    ) ?? [];

  const total = data?.pages[0]?.total ?? 0;

  // Batch check likes for all visible apps (single request)
  const appIds = allApps.map((app) => app.id);
  const { data: batchLikes } = useBatchLikesQuery(appIds);

  const handleSortChange = (newSort: "recent" | "popular") => {
    setSort(newSort);
    setIsDropdownOpen(false);
  };

  const currentLabel = sort === "recent" ? t("recent") : t("popular");

  return (
    <div className="space-y-6">
      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] sm:text-xs text-muted-foreground">
          {total} {t("published", { count: total })}
        </p>

        {/* Dropdown sort button */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 font-mono text-xs border border-border rounded-lg hover:border-primary transition-colors"
          >
            <span>{currentLabel}</span>
            <ArrowDownIcon
              className={`size-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-10 min-w-[140px] border border-border bg-background rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                type="button"
                onClick={() => handleSortChange("recent")}
                className={`w-full px-4 py-2 font-mono text-xs text-left transition-colors hover:bg-muted ${
                  sort === "recent" ? "bg-primary/10 text-primary" : ""
                }`}
              >
                {t("recent")}
              </button>
              <button
                type="button"
                onClick={() => handleSortChange("popular")}
                className={`w-full px-4 py-2 font-mono text-xs text-left transition-colors hover:bg-muted ${
                  sort === "popular" ? "bg-primary/10 text-primary" : ""
                }`}
              >
                {t("popular")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2Icon className="size-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-mono text-sm text-destructive">
            {t("errorTitle")}
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {t("errorDescription")}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && allApps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="border border-border bg-card rounded-lg shadow-sm p-4 p-8">
            <p className="font-mono text-sm text-foreground">
              {t("emptyTitle")}
            </p>
            <p className="mt-2 max-w-sm font-mono text-xs text-muted-foreground">
              {t("emptyDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Feed grid */}
      {allApps.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allApps.map((app) => (
            <FeedCard
              key={app.id}
              app={app}
              liked={batchLikes?.liked[app.id] ?? false}
            />
          ))}
        </div>
      )}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-4">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
