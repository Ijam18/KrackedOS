"use client";

import { ArrowDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { FeedCard } from "@/features/feed/components/feed-card";
import { useBatchLikesQuery } from "@/features/feed/hooks/queries";
import type { FeedApp } from "@/lib/services/feed";

interface ProfileAppsGridProps {
  apps: (FeedApp & { thumbnailUrl?: string | null })[];
  isOwnProfile?: boolean;
}

export function ProfileAppsGrid({
  apps,
  // biome-ignore lint/correctness/noUnusedFunctionParameters: Intentionally unused - reserved for future edit/delete features
  isOwnProfile = false,
}: ProfileAppsGridProps) {
  const t = useTranslations("profile");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Sort apps based on selection
  const sortedApps = [...apps].sort((a, b) => {
    if (sort === "popular") {
      return b.likeCount - a.likeCount;
    }
    // Recent - sort by publishedAt
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Batch check likes for all apps
  const appIds = apps.map((app) => app.id);
  const { data: batchLikes } = useBatchLikesQuery(appIds);

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="border border-border bg-card rounded-lg shadow-sm p-4 p-8">
          <p className="font-mono text-sm text-foreground">{t("emptyTitle")}</p>
          <p className="mt-2 max-w-sm font-mono text-xs text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      </div>
    );
  }

  const currentLabel = sort === "recent" ? "RECENT" : "POPULAR";

  return (
    <div className="space-y-6">
      {/* Filter controls */}
      <div className="flex items-center justify-end">
        {/* Sort dropdown */}
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
                onClick={() => {
                  setSort("recent");
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-4 py-2 font-mono text-xs text-left transition-colors hover:bg-muted ${
                  sort === "recent" ? "bg-primary/10 text-primary" : ""
                }`}
              >
                RECENT
              </button>
              <button
                type="button"
                onClick={() => {
                  setSort("popular");
                  setIsDropdownOpen(false);
                }}
                className={`w-full px-4 py-2 font-mono text-xs text-left transition-colors hover:bg-muted ${
                  sort === "popular" ? "bg-primary/10 text-primary" : ""
                }`}
              >
                POPULAR
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Apps grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedApps.map((app) => (
          <FeedCard
            key={app.id}
            app={app}
            liked={batchLikes?.liked[app.id] ?? false}
          />
        ))}
      </div>
    </div>
  );
}
