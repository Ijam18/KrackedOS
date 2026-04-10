"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ArchiveIcon,
  EyeIcon,
  GitForkIcon,
  HeartIcon,
  ImageIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { App } from "@/db/schema";
import { truncateText } from "@/lib/ui/utils";
import { useDeleteAppMutation } from "../hooks/queries";

// Extended App type with presigned thumbnail URL (generated server-side)
type AppWithThumbnail = Omit<App, "thumbnailKey"> & {
  thumbnailUrl: string | null;
};

interface AppCardProps {
  app: AppWithThumbnail;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export function AppCard({ app }: AppCardProps) {
  const t = useTranslations("apps");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const deleteApp = useDeleteAppMutation();

  const createdAt = new Date(app.createdAt);
  const timeAgo = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: false }).toUpperCase()
    : "";

  // Generate a title from description or use default
  const title = app.title || truncateText(app.description, 40) || t("untitled");

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteApp.mutate(app.id, {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setDeleted(true);
      },
    });
  };

  if (deleted) return null;

  return (
    <>
      <div className="group relative overflow-hidden border border-border bg-card rounded-lg transition-all hover:border-primary">
        <Link href={`/apps/${app.id}`} className="block">
          {/* Thumbnail */}
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

            {/* Archived badge */}
            {app.status === "archived" && (
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-muted text-muted-foreground border border-border rounded-md">
                <ArchiveIcon className="size-3" />
                <span>Archived</span>
              </div>
            )}
          </div>

          {/* Card content */}
          <div className="p-4">
            {/* Title */}
            <h3 className="font-mono text-lg text-foreground group-hover:text-primary transition-colors mb-4 truncate">
              {title}
            </h3>

            {/* Stats row */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
                  <EyeIcon className="size-4" />
                  <span>{formatCount(app.viewCount || 0)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
                  <HeartIcon className="size-4" />
                  <span>{formatCount(app.likeCount || 0)}</span>
                </span>
                <span className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
                  <GitForkIcon className="size-4" />
                  <span>{formatCount(app.remixCount || 0)}</span>
                </span>
              </div>

              {/* Time ago */}
              {timeAgo && (
                <span
                  suppressHydrationWarning
                  className="text-xs font-mono text-muted-foreground/60"
                >
                  {timeAgo}
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 hover:bg-destructive hover:text-destructive-foreground border border-border hover:border-destructive z-10 rounded-lg"
          title="Delete app"
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription className="font-mono text-sm">
              {t("deleteConfirm", { title })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" disabled={deleteApp.isPending}>
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteApp.isPending}
            >
              {deleteApp.isPending ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
