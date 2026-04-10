"use client";

import { PencilIcon, SparklesIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PublicProfile } from "@/lib/services/user-profile";
import { EditProfileModal } from "./edit-profile-modal";

interface ProfileHeaderProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const t = useTranslations("profile");
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex flex-col items-center text-center py-8 sm:py-12">
      {/* Avatar */}
      {profile.image ? (
        <Image
          src={profile.image}
          alt={profile.name}
          width={80}
          height={80}
          className="size-16 sm:size-20 rounded-2xl border-2 border-border mb-4"
        />
      ) : (
        <div className="size-16 sm:size-20 rounded-2xl border-2 border-border bg-primary/20 flex items-center justify-center mb-4">
          <span className="text-2xl sm:text-3xl font-mono text-primary">
            {profile.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Name */}
      <h1 className="font-pixel text-2xl sm:text-3xl text-foreground mb-1">
        {profile.name}
      </h1>

      {/* Username */}
      {profile.username && (
        <p className="font-mono text-sm text-muted-foreground mb-3">
          @{profile.username}
        </p>
      )}

      {/* Bio */}
      <p className="font-mono text-sm text-muted-foreground mb-4 max-w-md">
        {profile.bio || "Add your bio here..."}
      </p>

      {/* Edit button and Prompts count - side by side */}
      <div className="flex items-center gap-3">
        {/* Edit button for own profile */}
        {isOwnProfile && (
          <>
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 font-mono text-xs text-muted-foreground border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon className="size-4" />
              <span>{t("editProfile")}</span>
            </button>
            <EditProfileModal
              open={editOpen}
              onOpenChange={setEditOpen}
              currentUsername={profile.username}
              currentBio={profile.bio}
            />
          </>
        )}

        {/* Prompts count badge */}
        <div className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg">
          <SparklesIcon className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            {profile.stats.totalApps} PROMPTS
          </span>
        </div>
      </div>
    </div>
  );
}
