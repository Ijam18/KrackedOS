"use client";

import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCheckSlugQuery,
  useUpdateSlugMutation,
} from "@/features/apps/hooks/queries";
import { usePublishAppMutation } from "@/features/feed/hooks/queries";
import {
  useCheckUsernameQuery,
  useUpdateProfileMutation,
} from "@/features/profile/hooks/queries";
import { cn } from "@/lib/ui/utils";

interface ShareUrlModalProps {
  appId: string;
  currentSlug: string | null;
  isPublished?: boolean;
  currentUsername?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  onSlugChange?: (newSlug: string | null) => void;
  onPublishChange?: (published: boolean) => void;
}

const DOMAIN = "rotican.ai";

export function ShareUrlModal({
  appId,
  currentSlug,
  isPublished: initialIsPublished = false,
  currentUsername,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  onSlugChange,
  onPublishChange,
}: ShareUrlModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [slug, setSlug] = useState(currentSlug ?? "");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const [published, setPublished] = useState(initialIsPublished);
  const [usernameInput, setUsernameInput] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState("");

  const trimmedSlug = slug.trim().toLowerCase();

  // Should we check availability?
  const shouldCheck =
    trimmedSlug.length >= 3 &&
    trimmedSlug !== currentSlug?.toLowerCase() &&
    trimmedSlug !== appId.toLowerCase();

  // Debounce the slug for API calls
  useEffect(() => {
    if (!shouldCheck) {
      setDebouncedSlug("");
      return;
    }

    const timeoutId = setTimeout(() => {
      setDebouncedSlug(trimmedSlug);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [trimmedSlug, shouldCheck]);

  // Check slug availability with React Query
  const {
    data: availability,
    isLoading: isChecking,
    error: checkError,
  } = useCheckSlugQuery(
    debouncedSlug,
    appId,
    shouldCheck && debouncedSlug.length >= 3,
  );

  // Update slug mutation
  const updateSlugMutation = useUpdateSlugMutation();

  // Publish mutation
  const publishMutation = usePublishAppMutation();

  // Username prompt: show when toggling publish ON and no username set
  const showUsernamePrompt =
    published && !initialIsPublished && !currentUsername;

  const trimmedUsername = usernameInput.trim().toLowerCase();
  const shouldCheckUsername = showUsernamePrompt && trimmedUsername.length >= 3;

  // Debounce username
  useEffect(() => {
    if (!shouldCheckUsername) {
      setDebouncedUsername("");
      return;
    }
    const timeoutId = setTimeout(
      () => setDebouncedUsername(trimmedUsername),
      300,
    );
    return () => clearTimeout(timeoutId);
  }, [trimmedUsername, shouldCheckUsername]);

  const { data: usernameAvailability, isLoading: isCheckingUsername } =
    useCheckUsernameQuery(
      debouncedUsername,
      shouldCheckUsername && debouncedUsername.length >= 3,
    );

  const updateProfileMutation = useUpdateProfileMutation();

  const getUsernameStatus = () => {
    if (!trimmedUsername) return "idle";
    if (trimmedUsername.length < 3) return "invalid";
    if (isCheckingUsername || trimmedUsername !== debouncedUsername)
      return "checking";
    if (usernameAvailability?.available) return "available";
    if (usernameAvailability && !usernameAvailability.available) return "taken";
    return "idle";
  };

  const usernameStatus = getUsernameStatus();

  // Determine status
  const getStatus = () => {
    if (
      !trimmedSlug ||
      trimmedSlug === currentSlug?.toLowerCase() ||
      trimmedSlug === appId.toLowerCase()
    ) {
      return "idle";
    }
    if (trimmedSlug.length < 3) {
      return "invalid";
    }
    if (isChecking || trimmedSlug !== debouncedSlug) {
      return "checking";
    }
    if (checkError) {
      return "invalid";
    }
    if (availability?.available) {
      return "available";
    }
    if (availability && !availability.available) {
      return availability.reason?.includes("reserved") ? "invalid" : "taken";
    }
    return "idle";
  };

  const status = getStatus();

  // The effective identifier for the URL (slug if set, else appId)
  const effectiveId = trimmedSlug || currentSlug || appId;
  const shareUrl = `https://${effectiveId}.${DOMAIN}`;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSlug(currentSlug ?? "");
      setDebouncedSlug("");
      setCopied(false);
      setSaved(false);
      setPublished(initialIsPublished);
      setUsernameInput("");
      setDebouncedUsername("");
    }
  }, [open, currentSlug, initialIsPublished]);

  const handleSave = useCallback(async () => {
    const slugChanged = trimmedSlug !== (currentSlug?.toLowerCase() ?? "");
    const publishChanged = published !== initialIsPublished;

    // Nothing to save
    if (!slugChanged && !publishChanged) {
      return;
    }

    // If slug changed, validate it
    if (
      slugChanged &&
      trimmedSlug &&
      status !== "available" &&
      status !== "idle"
    ) {
      return;
    }

    let savedCount = 0;
    const totalSaves = (slugChanged ? 1 : 0) + (publishChanged ? 1 : 0);

    const checkDone = () => {
      savedCount++;
      if (savedCount >= totalSaves) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    };

    // Save slug if changed
    if (slugChanged) {
      const newSlug = trimmedSlug || null;
      updateSlugMutation.mutate(
        { appId, slug: newSlug },
        {
          onSuccess: () => {
            onSlugChange?.(newSlug);
            checkDone();
          },
        },
      );
    }

    // Save publish state if changed
    if (publishChanged) {
      publishMutation.mutate(
        { appId, published },
        {
          onSuccess: () => {
            onPublishChange?.(published);
            checkDone();
          },
        },
      );
    }

    // Save username if provided during first publish
    if (
      showUsernamePrompt &&
      trimmedUsername &&
      usernameStatus === "available"
    ) {
      updateProfileMutation.mutate({ username: trimmedUsername });
    }
  }, [
    trimmedSlug,
    appId,
    currentSlug,
    status,
    published,
    initialIsPublished,
    onSlugChange,
    onPublishChange,
    updateSlugMutation,
    publishMutation,
    showUsernamePrompt,
    trimmedUsername,
    usernameStatus,
    updateProfileMutation,
  ]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

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
    if (checkError) return "Failed to check availability";
    if (trimmedSlug && trimmedSlug.length < 3)
      return "Too short - use at least 3 characters";
    if (availability && !availability.available) return availability.reason;
    if (updateSlugMutation.error) return "Failed to save";
    return null;
  };

  const errorMessage = getErrorMessage();

  const slugChanged = trimmedSlug !== (currentSlug?.toLowerCase() ?? "");
  const publishChanged = published !== initialIsPublished;
  const hasChanges = slugChanged || publishChanged;

  const canSave =
    hasChanges &&
    !updateSlugMutation.isPending &&
    !publishMutation.isPending &&
    (status === "idle" ||
      status === "available" ||
      trimmedSlug === "" ||
      !slugChanged);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">Share App</DialogTitle>
          <DialogDescription>
            Share your app with anyone using this link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-hidden">
          {/* Current URL display */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Share URL
            </p>
            <div className="flex items-center border-2 border-border bg-muted/50 rounded-md overflow-hidden">
              <span className="flex-1 min-w-0 text-sm font-mono text-foreground truncate px-3 py-2">
                {shareUrl}
              </span>
              <div className="flex shrink-0 border-l-2 border-border">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleCopy}
                      className="h-9 w-9"
                    >
                      {copied ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <CopyIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? "Copied!" : "Copy URL"}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      asChild
                      className="h-9 w-9 border-l-2 border-border"
                    >
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in new tab</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Custom URL input */}
          <div className="space-y-2">
            <label
              htmlFor="slug-input"
              className="text-sm font-medium text-muted-foreground"
            >
              Custom URL (optional)
            </label>
            <div className="flex items-center border-2 border-border rounded-md overflow-hidden">
              <Input
                id="slug-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder={appId}
                className={cn(
                  "flex-1 min-w-0 border-0 rounded-none font-mono focus-visible:ring-0 focus-visible:ring-offset-0",
                  status === "available" && "text-green-500",
                  (status === "taken" || status === "invalid") &&
                    "text-destructive",
                )}
              />
              <div className="shrink-0 flex items-center gap-1 px-2 h-9 border-l-2 border-border bg-muted/50">
                {getStatusIcon()}
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  .{DOMAIN}
                </span>
              </div>
            </div>
            {errorMessage && (
              <p className="text-xs text-destructive">{errorMessage}</p>
            )}
            <p className="text-xs text-muted-foreground">
              3-32 characters (letters, numbers, hyphens).
            </p>
          </div>

          {/* Publish to feed toggle */}
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GlobeIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Publish to Explore
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Show your app in the community feed
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={published}
                onClick={() => setPublished(!published)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors",
                  published
                    ? "bg-primary border-primary"
                    : "bg-muted border-border",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform",
                    published ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {/* Username prompt on first publish */}
            {showUsernamePrompt && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Set a username for your public profile (optional)
                </p>
                <div className="flex items-center border-2 border-border rounded-md overflow-hidden">
                  <span className="shrink-0 px-2 h-9 flex items-center bg-muted/50 border-r-2 border-border text-xs text-muted-foreground">
                    @
                  </span>
                  <Input
                    value={usernameInput}
                    onChange={(e) =>
                      setUsernameInput(e.target.value.toLowerCase())
                    }
                    placeholder="your-username"
                    className={cn(
                      "flex-1 min-w-0 border-0 rounded-none font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0",
                      usernameStatus === "available" && "text-green-500",
                      (usernameStatus === "taken" ||
                        usernameStatus === "invalid") &&
                        "text-destructive",
                    )}
                  />
                  <div className="shrink-0 px-2 h-9 flex items-center">
                    {usernameStatus === "checking" && (
                      <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {usernameStatus === "available" && (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    )}
                    {(usernameStatus === "taken" ||
                      usernameStatus === "invalid") && (
                      <XIcon className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                {usernameAvailability && !usernameAvailability.available && (
                  <p className="text-xs text-destructive">
                    {usernameAvailability.reason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={updateSlugMutation.isPending || publishMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!canSave}>
            {updateSlugMutation.isPending || publishMutation.isPending ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckIcon className="h-4 w-4 text-green-500" />
                Saved
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
