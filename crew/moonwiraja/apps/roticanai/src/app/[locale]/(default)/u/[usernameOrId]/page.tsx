import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileAppsGrid } from "@/features/profile/components/profile-apps-grid";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { auth } from "@/lib/core/auth/server";
import { getCachedPresignedUrl, isStorageConfigured } from "@/lib/core/storage";
import type { FeedApp } from "@/lib/services/feed";
import { getPublicProfile } from "@/lib/services/user-profile";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ usernameOrId: string }>;
}) {
  const { usernameOrId } = await params;

  const result = await getPublicProfile(usernameOrId);
  if (!result) notFound();

  const { profile, apps } = result;

  // Check if viewing own profile
  const session = await auth.api.getSession({ headers: await headers() });
  const isOwnProfile = session?.user.id === profile.id;

  // Generate presigned URLs for thumbnails
  const storageEnabled = isStorageConfigured();
  const thumbnailUrls: Record<string, string | null> = {};

  if (storageEnabled) {
    await Promise.all(
      apps.map(async (app) => {
        if (app.thumbnailKey) {
          thumbnailUrls[app.id] = await getCachedPresignedUrl(app.thumbnailKey);
        }
      }),
    );
  }

  // Build FeedApp-shaped objects for the grid (add author info from profile)
  const feedApps: (FeedApp & { thumbnailUrl?: string | null })[] = apps.map(
    (app) => ({
      ...app,
      thumbnailUrl: thumbnailUrls[app.id] ?? null,
      author: {
        id: profile.id,
        username: profile.username,
        name: profile.name,
        image: profile.image,
      },
    }),
  );

  // Serialize profile for client component (dates -> strings)
  const serializedProfile = {
    ...profile,
    createdAt: profile.createdAt.toISOString() as unknown as Date,
  };

  return (
    <div className="min-h-full bg-background overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12">
        <ProfileHeader
          profile={serializedProfile}
          isOwnProfile={isOwnProfile}
        />

        {/* Apps grid */}
        <main className="w-full">
          <ProfileAppsGrid apps={feedApps} isOwnProfile={isOwnProfile} />
        </main>
      </div>
    </div>
  );
}
