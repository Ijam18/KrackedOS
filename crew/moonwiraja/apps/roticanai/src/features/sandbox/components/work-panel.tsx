"use client";

import {
  CodeIcon,
  EyeIcon,
  GlobeIcon,
  Loader2Icon,
  MonitorIcon,
  RefreshCwIcon,
  ShareIcon,
  SmartphoneIcon,
  TabletIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GitHubSyncModal } from "@/features/apps/components/github-sync-modal";
import { cn } from "@/lib/ui/utils";
import type { FileTreeNode } from "../hooks/use-sandbox-files";
import { EditorPanel } from "./editor-panel";
import { FileExplorer } from "./file-explorer";
import { LogsPanel } from "./logs-panel";
import { type DeviceSize, PreviewPanel } from "./preview-panel";
import type { CookingProgress } from "./progress-panel";
import { ShareUrlModal } from "./share-url-modal";

type ViewMode = "preview" | "code";

interface WorkPanelProps {
  sessionId: string;
  files: FileTreeNode[];
  isLoadingFiles: boolean;
  previewUrl: string | null;
  previewRefreshKey: number;
  isReady: boolean;
  isStreaming?: boolean;
  isWaitingForInput?: boolean;
  cookingProgress?: CookingProgress;
  currentSlug?: string | null;
  isPublished?: boolean;
  currentUsername?: string | null;
  appTitle?: string | null;
  onRefreshFiles: () => void;
  onRefreshPreview: () => void;
  onSwitchToProgress?: () => void;
}

export function WorkPanel({
  sessionId,
  files,
  isLoadingFiles,
  previewUrl,
  previewRefreshKey,
  isReady,
  isStreaming,
  isWaitingForInput,
  cookingProgress,
  currentSlug: initialSlug,
  isPublished: initialIsPublished,
  currentUsername,
  appTitle,
  onRefreshFiles,
  onRefreshPreview,
  onSwitchToProgress,
}: WorkPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [deviceSize, setDeviceSize] = useState<DeviceSize>("desktop");
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(initialSlug ?? null);
  const [isPublished, setIsPublished] = useState(initialIsPublished ?? false);
  const [shareBannerDismissed, setShareBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      sessionStorage.getItem(`share-banner-dismissed-${sessionId}`) === "1"
    );
  });
  const [shareBannerReady, setShareBannerReady] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Show the share banner after a delay once preview is loaded and app is not published
  useEffect(() => {
    if (
      isPublished ||
      shareBannerDismissed ||
      !previewUrl ||
      !isReady ||
      isStreaming
    ) {
      setShareBannerReady(false);
      return;
    }
    const timer = setTimeout(() => setShareBannerReady(true), 3000);
    return () => clearTimeout(timer);
  }, [isPublished, shareBannerDismissed, previewUrl, isReady, isStreaming]);

  const dismissShareBanner = useCallback(() => {
    setShareBannerDismissed(true);
    sessionStorage.setItem(`share-banner-dismissed-${sessionId}`, "1");
  }, [sessionId]);

  const handleFileSelect = (path: string) => {
    // Check if it's a file (not a directory)
    const isFile = path.includes(".") && !path.endsWith("/");
    if (isFile) {
      // Add to open files if not already open
      if (!openFiles.includes(path)) {
        setOpenFiles([...openFiles, path]);
      }
      setActiveFile(path);
      // Switch to code view if not already there
      if (viewMode !== "code") {
        setViewMode("code");
      }
    }
  };

  const handleCloseFile = (path: string) => {
    const newOpenFiles = openFiles.filter((f) => f !== path);
    setOpenFiles(newOpenFiles);

    // If closing the active file, switch to another open file or null
    if (activeFile === path) {
      setActiveFile(
        newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null,
      );
    }
  };

  const handleFileSaved = () => {
    onRefreshFiles();
    onRefreshPreview();
  };

  const getPathFromUrl = (urlString: string): string => {
    try {
      const parsed = new URL(urlString);
      return parsed.pathname + parsed.search + parsed.hash || "/";
    } catch {
      return "/";
    }
  };

  return (
    <Card className="flex w-full h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-0 gap-0 shadow-sm">
      {/* Top toolbar with view switcher and URL bar */}
      <div className="flex-shrink-0 flex items-center gap-2 border-b border-border bg-card px-3 py-2">
        {/* View/Code Toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={cn(
              "h-8 flex items-center gap-1.5 px-3 rounded-md font-mono text-[10px] transition-colors",
              viewMode === "preview"
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <EyeIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">VIEW</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("code")}
            className={cn(
              "h-8 flex items-center gap-1.5 px-3 rounded-md font-mono text-[10px] transition-colors",
              viewMode === "code"
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <CodeIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CODE</span>
          </button>
        </div>

        {/* URL Bar - only shown in preview mode */}
        {viewMode === "preview" && previewUrl && (
          <div className="flex items-center flex-1 min-w-0">
            <div className="h-8 border border-border bg-background px-2 flex-1 min-w-0 flex items-center gap-2 rounded-md">
              <span className="text-xs text-primary font-mono flex-1 truncate">
                {getPathFromUrl(previewUrl)}
              </span>
              <button
                type="button"
                onClick={onRefreshPreview}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCwIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Device size toggle - only shown in preview mode, hidden on mobile */}
        {viewMode === "preview" && (
          <ToggleGroup
            type="single"
            value={deviceSize}
            onValueChange={(value) => {
              if (value) setDeviceSize(value as DeviceSize);
            }}
            variant="outline"
            size="sm"
            className="hidden sm:flex flex-shrink-0 border border-border h-8 [&>*]:h-8"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="desktop"
                  aria-label="Desktop size"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <MonitorIcon className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Desktop (100%)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="tablet"
                  aria-label="Tablet size"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <TabletIcon className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Tablet (768px)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="phone"
                  aria-label="Phone size"
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  <SmartphoneIcon className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Phone (375px)</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        )}

        {/* Right side buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {viewMode === "code" && (
            <button
              type="button"
              onClick={onRefreshFiles}
              className="h-8 w-8 flex items-center justify-center border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors rounded-md"
              title="Refresh files"
            >
              <RefreshCwIcon
                className={cn("h-3.5 w-3.5", isLoadingFiles && "animate-spin")}
              />
            </button>
          )}
          <GitHubSyncModal appId={sessionId} appTitle={appTitle} />
          {viewMode === "preview" && previewUrl && (
            <>
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors rounded-md"
                title="Share"
                onClick={() => setShareModalOpen(true)}
              >
                <ShareIcon className="h-3.5 w-3.5" />
              </button>
              <ShareUrlModal
                appId={sessionId}
                currentSlug={slug}
                isPublished={isPublished}
                currentUsername={currentUsername}
                open={shareModalOpen}
                onOpenChange={setShareModalOpen}
                onSlugChange={setSlug}
                onPublishChange={(published) => {
                  setIsPublished(published);
                  if (published) dismissShareBanner();
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* Loading state - shown while environment is preparing */}
        {!isReady && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-background">
            <div className="border border-border bg-card rounded-lg shadow-sm p-8 flex flex-col items-center gap-4">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
              <div className="space-y-2 text-center">
                <h3 className="font-mono text-sm text-primary">NOW LOADING</h3>
                <p className="text-sm text-muted-foreground font-mono max-w-xs">
                  Creating sandbox environment...
                </p>
              </div>
              {/* Progress bar */}
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary animate-pulse"
                  style={{ width: "60%" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Preview view */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            viewMode !== "preview" && "invisible pointer-events-none",
          )}
        >
          <PreviewPanel
            url={previewUrl}
            refreshKey={previewRefreshKey}
            onRefresh={onRefreshPreview}
            deviceSize={deviceSize}
            isStreaming={isStreaming}
            isWaitingForInput={isWaitingForInput}
            cookingProgress={cookingProgress}
            onSwitchToProgress={onSwitchToProgress}
          />

          {/* Share prompt banner */}
          {shareBannerReady && !isPublished && (
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-3 rounded-lg border bg-background/95 backdrop-blur p-3 shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-300">
              <GlobeIcon className="size-4 text-muted-foreground shrink-0" />
              <p className="font-mono text-sm text-muted-foreground flex-1">
                Share your creation with the community
              </p>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 font-mono"
                onClick={() => setShareModalOpen(true)}
              >
                Share
              </Button>
              <button
                type="button"
                onClick={dismissShareBanner}
                className="shrink-0 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                <XIcon className="size-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Code view - File explorer + Editor + Logs */}
        <div
          className={cn(
            "absolute inset-0 flex h-full w-full flex-col",
            viewMode !== "code" && "invisible pointer-events-none",
          )}
        >
          <div className="flex min-h-0 flex-1">
            {/* File explorer sidebar */}
            <div className="w-56 flex-shrink-0 overflow-hidden flex flex-col bg-card">
              <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                <div className="h-2 w-2 bg-primary" />
                <span className="font-mono text-[10px] text-muted-foreground">
                  FILES
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                <FileExplorer
                  files={files}
                  isLoading={isLoadingFiles}
                  onFileSelect={handleFileSelect}
                  selectedFile={activeFile}
                />
              </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-hidden relative">
                <EditorPanel
                  sessionId={sessionId}
                  openFiles={openFiles}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                  onFileClose={handleCloseFile}
                  onSave={handleFileSaved}
                />
              </div>
            </div>
          </div>

          {/* Logs panel - only in code view */}
          <LogsPanel sessionId={sessionId} isReady={isReady} />
        </div>
      </div>
    </Card>
  );
}
