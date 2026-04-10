import { FolderIcon, PlusIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AppCard } from "@/features/apps/components/app-card";
import { auth } from "@/lib/core/auth/server";
import { getCachedPresignedUrl, isStorageConfigured } from "@/lib/core/storage";
import { getAppsForUser } from "@/lib/services/app";

export default async function AppsPage() {
  // Get session (server-side)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to home if not authenticated
  if (!session) {
    redirect("/?auth=required");
  }

  // Load user's apps
  const apps = await getAppsForUser(session.user.id, {
    status: "active",
    limit: 50,
  });

  // Generate presigned URLs for thumbnails (server-side only, with Redis caching)
  const storageEnabled = isStorageConfigured();
  const appsWithThumbnails = await Promise.all(
    apps.map(async (app) => ({
      ...app,
      // Generate presigned URL from storage key if it exists
      thumbnailUrl:
        storageEnabled && app.thumbnailKey
          ? await getCachedPresignedUrl(app.thumbnailKey)
          : null,
    })),
  );

  const t = await getTranslations("apps");

  return (
    <div className="min-h-full bg-background overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-pixel text-5xl sm:text-6xl lg:text-7xl text-foreground mb-3">
                {t("title")}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FolderIcon className="size-4" />
                <span className="font-mono text-sm">
                  {apps.length} {t("projects", { count: apps.length })}
                </span>
              </div>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 font-mono text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity mb-0.5"
            >
              <PlusIcon className="size-4" />
              <span>{t("newApp")}</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="w-full">
          {apps.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {appsWithThumbnails.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

async function EmptyState() {
  const t = await getTranslations("apps");
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="border border-border bg-card rounded-lg shadow-sm p-4 p-8">
        <FolderIcon className="mx-auto size-12 text-primary" />
        <h2 className="mt-4 font-mono text-lg text-foreground">
          {t("emptyTitle")}
        </h2>
        <p className="mt-2 max-w-sm font-mono text-sm text-muted-foreground">
          {t("emptyDescription")}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 font-mono text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="size-4" />
          {t("createFirst")}
        </Link>
      </div>
    </div>
  );
}
