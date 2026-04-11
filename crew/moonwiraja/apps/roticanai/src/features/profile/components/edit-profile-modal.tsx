"use client";

import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/ui/utils";
import {
  useCheckUsernameQuery,
  useUpdateProfileMutation,
} from "../hooks/queries";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string | null;
  currentBio: string | null;
}

export function EditProfileModal({
  open,
  onOpenChange,
  currentUsername,
  currentBio,
}: EditProfileModalProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [username, setUsername] = useState(currentUsername ?? "");
  const [bio, setBio] = useState(currentBio ?? "");
  const [saved, setSaved] = useState(false);
  const [debouncedUsername, setDebouncedUsername] = useState("");

  const trimmedUsername = username.trim().toLowerCase();

  // Should we check availability?
  const shouldCheck =
    trimmedUsername.length >= 3 &&
    trimmedUsername !== currentUsername?.toLowerCase();

  // Debounce username for API calls
  useEffect(() => {
    if (!shouldCheck) {
      setDebouncedUsername("");
      return;
    }
    const timeoutId = setTimeout(
      () => setDebouncedUsername(trimmedUsername),
      300,
    );
    return () => clearTimeout(timeoutId);
  }, [trimmedUsername, shouldCheck]);

  const {
    data: availability,
    isLoading: isChecking,
    error: checkError,
  } = useCheckUsernameQuery(
    debouncedUsername,
    shouldCheck && debouncedUsername.length >= 3,
  );

  const updateProfile = useUpdateProfileMutation();

  // Determine status
  const getStatus = () => {
    if (
      !trimmedUsername ||
      trimmedUsername === currentUsername?.toLowerCase()
    ) {
      return "idle";
    }
    if (trimmedUsername.length < 3) return "invalid";
    if (isChecking || trimmedUsername !== debouncedUsername) return "checking";
    if (checkError) return "invalid";
    if (availability?.available) return "available";
    if (availability && !availability.available) return "taken";
    return "idle";
  };

  const status = getStatus();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setUsername(currentUsername ?? "");
      setBio(currentBio ?? "");
      setDebouncedUsername("");
      setSaved(false);
    }
  }, [open, currentUsername, currentBio]);

  const usernameChanged = trimmedUsername !== (currentUsername ?? "");
  const bioChanged = bio.trim() !== (currentBio ?? "");
  const hasChanges = usernameChanged || bioChanged;

  const canSave =
    hasChanges &&
    !updateProfile.isPending &&
    (status === "idle" ||
      status === "available" ||
      trimmedUsername === "" ||
      !usernameChanged);

  const handleSave = useCallback(() => {
    if (!canSave) return;

    const data: { username?: string | null; bio?: string | null } = {};
    if (usernameChanged) {
      data.username = trimmedUsername || null;
    }
    if (bioChanged) {
      data.bio = bio.trim() || null;
    }

    updateProfile.mutate(data, {
      onSuccess: (result) => {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          onOpenChange(false);
          // If username changed, redirect to new profile URL
          if (usernameChanged && result.username) {
            router.replace(`/u/${result.username}`);
          } else {
            router.refresh();
          }
        }, 1000);
      },
    });
  }, [
    canSave,
    usernameChanged,
    bioChanged,
    trimmedUsername,
    bio,
    updateProfile,
    onOpenChange,
    router,
  ]);

  const getStatusIcon = () => {
    switch (status) {
      case "checking":
        return (
          <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
        );
      case "available":
        return <CheckIcon className="h-4 w-4 text-green-500" />;
      case "taken":
      case "invalid":
        return <XIcon className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getErrorMessage = () => {
    if (checkError) return t("checkFailed");
    if (trimmedUsername && trimmedUsername.length < 3)
      return t("usernameTooShort");
    if (availability && !availability.available) return availability.reason;
    if (updateProfile.error) return t("saveFailed");
    return null;
  };

  const errorMessage = getErrorMessage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            {t("editProfile")}
          </DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Username */}
          <div className="space-y-2">
            <label
              htmlFor="username-input"
              className="text-sm font-medium text-muted-foreground"
            >
              {t("username")}
            </label>
            <div className="flex items-center border-2 border-border rounded-md overflow-hidden">
              <span className="shrink-0 px-2 h-9 flex items-center bg-muted/50 border-r-2 border-border text-xs sm:text-sm text-muted-foreground">
                @
              </span>
              <Input
                id="username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder={t("usernamePlaceholder")}
                className={cn(
                  "flex-1 min-w-0 border-0 rounded-none font-mono focus-visible:ring-0 focus-visible:ring-offset-0",
                  status === "available" && "text-green-500",
                  (status === "taken" || status === "invalid") &&
                    "text-destructive",
                )}
              />
              <div className="shrink-0 px-2 h-9 flex items-center">
                {getStatusIcon()}
              </div>
            </div>
            {errorMessage && (
              <p className="text-xs text-destructive">{errorMessage}</p>
            )}
            <p className="text-xs text-muted-foreground">{t("usernameHint")}</p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label
              htmlFor="bio-input"
              className="text-sm font-medium text-muted-foreground"
            >
              {t("bio")}
            </label>
            <textarea
              id="bio-input"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder={t("bioPlaceholder")}
              rows={3}
              className="w-full px-3 py-2 border-2 border-border rounded-md bg-background font-mono text-sm focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/160
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateProfile.isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {updateProfile.isPending ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : saved ? (
              <>
                <CheckIcon className="h-4 w-4 text-green-500" />
                {t("saved")}
              </>
            ) : (
              t("save")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
