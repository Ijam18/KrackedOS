"use client";

import type { UIMessage } from "ai";
import { ListTodoIcon, MonitorIcon } from "lucide-react";
import { use, useRef, useState } from "react";
import {
  type CookingProgress,
  ProgressPanel,
} from "@/features/sandbox/components/progress-panel";
import { WorkPanel } from "@/features/sandbox/components/work-panel";
import { useSandboxFiles } from "@/features/sandbox/hooks/use-sandbox-files";
import type { SandboxInfo } from "@/lib/services/sandbox/types";
import { cn } from "@/lib/ui/utils";

type MobileTab = "progress" | "preview";

interface SandboxContentProps {
  sessionId: string;
  sandboxPromise: Promise<SandboxInfo>;
  initialMessages?: UIMessage[];
  initialPrompt?: string | null;
  currentSlug?: string | null;
  isPublished?: boolean;
  currentUsername?: string | null;
  appTitle?: string | null;
}

export function SandboxContent({
  sessionId,
  sandboxPromise,
  initialMessages = [],
  initialPrompt,
  currentSlug,
  isPublished,
  currentUsername,
  appTitle,
}: SandboxContentProps) {
  // This will suspend until the sandbox is ready
  const sandbox = use(sandboxPromise);
  const [manualRefreshCount, setManualRefreshCount] = useState(0);
  const readyAtRef = useRef(Date.now());

  // Mobile tab state - default to preview on mobile
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview");

  // Track LLM streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [cookingProgress, setCookingProgress] = useState<CookingProgress>({
    completed: 0,
    total: 0,
    currentLabel: null,
    activeTool: null,
    isReasoning: false,
  });

  const handleStatusChange = (status: string) => {
    setIsStreaming(status === "streaming" || status === "submitted");
    setIsWaitingForInput(status === "awaiting-input");
  };

  const {
    files,
    isLoading: isLoadingFiles,
    refreshFiles,
  } = useSandboxFiles(
    sessionId,
    true, // Sandbox is ready since we're past Suspense
  );

  const previewRefreshKey = readyAtRef.current + manualRefreshCount;

  const handleRefreshPreview = () => {
    setManualRefreshCount((c) => c + 1);
  };

  const handleToolExecuted = () => {
    refreshFiles();
    // Small delay then refresh preview
    setTimeout(() => {
      setManualRefreshCount((c) => c + 1);
    }, 500);
  };

  return (
    <>
      <title>
        {isStreaming
          ? "Cooking... | Roti Canai"
          : appTitle
            ? `${appTitle} | Roti Canai`
            : "Roti Canai"}
      </title>
      <div className="flex h-full flex-1 flex-col bg-background text-foreground overflow-hidden">
        {/* Mobile Tab Navigation - only visible on small screens */}
        <div className="flex-shrink-0 flex md:hidden px-3 py-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                mobileTab === "preview"
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <MonitorIcon className="h-4 w-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("progress")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                mobileTab === "progress"
                  ? "bg-foreground text-background"
                  : "border border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <ListTodoIcon className="h-4 w-4" />
              Progress
            </button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Progress Panel - full width on mobile, 40% on desktop (LEFT) */}
          <div
            className={cn(
              "flex-col h-full p-4 md:pr-2",
              "w-full",
              mobileTab === "progress" ? "flex" : "hidden",
              "md:flex md:w-[40%]",
            )}
          >
            <ProgressPanel
              sessionId={sessionId}
              isReady={true}
              initialMessages={initialMessages}
              initialPrompt={initialPrompt}
              appTitle={appTitle}
              onToolExecuted={handleToolExecuted}
              onStatusChange={handleStatusChange}
              onProgressChange={setCookingProgress}
            />
          </div>
          {/* Work Panel - full width on mobile, 60% on desktop (RIGHT) */}
          <div
            className={cn(
              "w-full h-full p-4 md:pl-2",
              mobileTab === "preview" ? "flex" : "hidden",
              "md:flex md:w-[60%]",
            )}
          >
            <WorkPanel
              sessionId={sessionId}
              files={files}
              isLoadingFiles={isLoadingFiles}
              previewUrl={sandbox.previewUrl}
              previewRefreshKey={previewRefreshKey}
              isReady={true}
              isStreaming={isStreaming}
              isWaitingForInput={isWaitingForInput}
              cookingProgress={cookingProgress}
              currentSlug={currentSlug}
              isPublished={isPublished}
              currentUsername={currentUsername}
              appTitle={appTitle}
              onRefreshFiles={refreshFiles}
              onRefreshPreview={handleRefreshPreview}
              onSwitchToProgress={() => setMobileTab("progress")}
            />
          </div>
        </div>
      </div>
    </>
  );
}
