"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  Loader2Icon,
  UnplugIcon,
  UploadIcon,
  WifiOffIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { GitHubIcon } from "@/components/icons/github";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type GitHubApiError,
  useAppGitHubStatusQuery,
  useLinkGitHubRepoMutation,
  usePushGitHubRepoMutation,
  useUnlinkGitHubRepoMutation,
} from "@/features/apps/hooks/github-queries";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { linkGitHubForPush, useSession } from "@/lib/core/auth/client";

interface GitHubSyncModalProps {
  appId: string;
  appTitle?: string | null;
}

function formatRepoName(input: string | null | undefined, fallback: string) {
  const normalized = (input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function formatErrorMessage(error: GitHubApiError | null) {
  if (!error) return null;

  if (error.code === "GITHUB_RECONNECT_REQUIRED") {
    return "Reconnect GitHub to grant public repository access.";
  }

  return error.message;
}

export function GitHubSyncModal({ appId, appTitle }: GitHubSyncModalProps) {
  const t = useTranslations("githubSync");
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isGuest } = useAuth();
  const betterAuthSession = useSession();
  const hasBrowserSession = Boolean(betterAuthSession.data?.user);
  const statusQuery = useAppGitHubStatusQuery(
    appId,
    open && isAuthenticated && !isGuest && hasBrowserSession,
  );
  const linkMutation = useLinkGitHubRepoMutation(appId);
  const unlinkMutation = useUnlinkGitHubRepoMutation(appId);
  const pushMutation = usePushGitHubRepoMutation(appId);

  const defaultRepoName = useMemo(
    () => formatRepoName(appTitle, appId),
    [appId, appTitle],
  );

  const [createRepoName, setCreateRepoName] = useState(defaultRepoName);
  const [createDescription, setCreateDescription] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCreateRepoName(defaultRepoName);
    setCreateDescription("");
    setFeedback(null);
  }, [defaultRepoName, open]);

  const isBusy =
    linkMutation.isPending ||
    unlinkMutation.isPending ||
    pushMutation.isPending;
  const mutationError = formatErrorMessage(
    (linkMutation.error ??
      unlinkMutation.error ??
      pushMutation.error ??
      null) as GitHubApiError | null,
  );
  const statusError = formatErrorMessage(statusQuery.error ?? null);

  const handleReconnect = () => {
    setFeedback(null);
    if (!hasBrowserSession) {
      setFeedback(
        "Your browser auth session is missing. Refresh the page and sign in again before linking GitHub.",
      );
      return;
    }
    void linkGitHubForPush(window.location.href);
  };

  const handleCreateRepo = () => {
    setFeedback(null);
    linkMutation.mutate(
      {
        mode: "create",
        repoName: createRepoName.trim(),
        description: createDescription.trim() || undefined,
      },
      {
        onSuccess: () => {
          setFeedback("GitHub repository linked.");
        },
      },
    );
  };

  const handlePush = () => {
    setFeedback(null);
    pushMutation.mutate(undefined, {
      onSuccess: (data) => {
        setFeedback(`Pushed to ${data.pushResult.branch}.`);
      },
    });
  };

  const handleUnlink = () => {
    setFeedback(null);
    unlinkMutation.mutate(undefined, {
      onSuccess: () => {
        setFeedback("Repository unlinked.");
      },
    });
  };

  const linkedRepo = statusQuery.data?.linkedRepo;
  const connStatus = statusQuery.data?.connectionStatus;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="h-8 w-8 flex items-center justify-center border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors rounded-md"
          title="Push to GitHub"
        >
          <GitHubIcon className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div>
            <DialogTitle className="font-mono text-sm font-semibold text-foreground leading-none">
              {t("title")}
            </DialogTitle>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3">
          {!isAuthenticated || isGuest ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-3">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="font-mono text-xs text-muted-foreground">
                {t("signInRequired")}
              </p>
            </div>
          ) : open && betterAuthSession.isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !hasBrowserSession ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-3">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="font-mono text-xs text-muted-foreground">
                {t("sessionExpired")}
              </p>
            </div>
          ) : statusQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Connection status strip */}
              <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {connStatus === "ready" ? (
                    <CheckCircle2Icon className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : connStatus === "reconnect_required" ? (
                    <WifiOffIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  ) : (
                    <WifiOffIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="font-mono text-xs text-foreground">
                    {connStatus === "ready"
                      ? statusQuery.data?.viewerLogin
                        ? t("connectedAs", {
                            login: statusQuery.data.viewerLogin,
                          })
                        : t("connected")
                      : connStatus === "reconnect_required"
                        ? t("reconnectRequired")
                        : t("notConnected")}
                  </span>
                </div>
                {connStatus !== "ready" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleReconnect}
                    className="h-7 font-mono text-xs px-2.5"
                  >
                    {connStatus === "reconnect_required"
                      ? t("reconnect")
                      : t("connect")}
                  </Button>
                )}
              </div>

              {/* Linked repo card */}
              {linkedRepo && (
                <div className="rounded-md border border-border bg-muted/10 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-border/60 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium text-foreground truncate">
                        {linkedRepo.owner}/{linkedRepo.name}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
                        {linkedRepo.defaultBranch}
                        {linkedRepo.lastPushedAt && (
                          <>
                            {" "}
                            ·{" "}
                            {new Date(
                              linkedRepo.lastPushedAt,
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </>
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(linkedRepo.url, "_blank")}
                      className="h-7 w-7 p-0 shrink-0"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {statusQuery.data?.repoLinkStatus === "invalid" && (
                    <p className="px-3 py-2 font-mono text-[10px] text-destructive bg-destructive/5">
                      {t("repoInvalid")}
                    </p>
                  )}
                  <div className="px-3 py-2.5 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handlePush}
                      disabled={
                        isBusy ||
                        connStatus !== "ready" ||
                        statusQuery.data?.repoLinkStatus === "invalid"
                      }
                      className="h-7 font-mono text-xs flex-1"
                    >
                      {pushMutation.isPending ? (
                        <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <UploadIcon className="h-3.5 w-3.5" />
                      )}
                      {t("push")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUnlink}
                      disabled={isBusy}
                      className="h-7 font-mono text-xs"
                    >
                      <UnplugIcon className="h-3.5 w-3.5" />
                      {t("unlink")}
                    </Button>
                  </div>
                </div>
              )}

              {/* Create repo form */}
              {connStatus === "ready" &&
                statusQuery.data?.repoLinkStatus !== "linked" && (
                  <div className="rounded-md border border-border overflow-hidden">
                    <div className="px-3 py-2 border-b border-border/60 bg-muted/10">
                      <p className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {t("createSection")}
                      </p>
                    </div>
                    <div className="px-3 py-3 space-y-2">
                      <Input
                        value={createRepoName}
                        onChange={(event) =>
                          setCreateRepoName(event.target.value)
                        }
                        placeholder={t("repoNamePlaceholder")}
                        className="h-8 font-mono text-xs"
                      />
                      <Textarea
                        value={createDescription}
                        onChange={(event) =>
                          setCreateDescription(event.target.value)
                        }
                        placeholder={t("descriptionPlaceholder")}
                        className="min-h-16 font-mono text-xs resize-none"
                      />
                      <Button
                        type="button"
                        onClick={handleCreateRepo}
                        disabled={isBusy || !createRepoName.trim()}
                        className="w-full h-8 font-mono text-xs"
                      >
                        {linkMutation.isPending ? (
                          <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <GitHubIcon className="h-3.5 w-3.5" />
                        )}
                        {t("createAndLink")}
                      </Button>
                    </div>
                  </div>
                )}

              {/* Feedback / error */}
              {(statusError || mutationError || feedback) && (
                <div
                  className={`flex items-start gap-2 rounded-md border px-3 py-2.5 ${
                    statusError || mutationError
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-emerald-500/30 bg-emerald-500/5"
                  }`}
                >
                  {statusError || mutationError ? (
                    <AlertCircleIcon className="h-3.5 w-3.5 shrink-0 mt-px text-destructive" />
                  ) : (
                    <CheckCircle2Icon className="h-3.5 w-3.5 shrink-0 mt-px text-emerald-500" />
                  )}
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-foreground">
                      {statusError ?? mutationError ?? feedback}
                    </p>
                    {pushMutation.data?.pushResult?.commitUrl &&
                      !mutationError && (
                        <a
                          href={pushMutation.data.pushResult.commitUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-primary hover:underline"
                        >
                          {t("viewCommit")}
                          <ExternalLinkIcon className="h-3 w-3" />
                        </a>
                      )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
