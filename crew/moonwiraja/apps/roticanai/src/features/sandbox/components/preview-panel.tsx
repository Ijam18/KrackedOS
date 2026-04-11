"use client";

import {
  ListTodoIcon,
  Loader2Icon,
  MessageCircleQuestionIcon,
  MonitorIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AgentScene } from "@/components/agent-visualization/agent-scene";

import { cn } from "@/lib/ui/utils";
import type { CookingProgress } from "./progress-panel";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

export type DeviceSize = "desktop" | "tablet" | "phone";

const DEVICE_WIDTHS: Record<DeviceSize, string> = {
  desktop: "100%",
  tablet: "768px",
  phone: "375px",
};

interface PreviewPanelProps {
  url: string | null;
  refreshKey?: number;
  onRefresh?: () => void;
  deviceSize?: DeviceSize;
  isStreaming?: boolean;
  isWaitingForInput?: boolean;
  cookingProgress?: CookingProgress;
  onSwitchToProgress?: () => void;
}

export function PreviewPanel({
  url,
  refreshKey = 0,
  deviceSize = "desktop",
  isStreaming = false,
  isWaitingForInput = false,
  cookingProgress,
  onSwitchToProgress,
}: PreviewPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [serverReady, setServerReady] = useState(false);
  const isMobile = useIsMobile();

  // Poll preview URL until dev server responds, then render iframe
  useEffect(() => {
    if (!url) {
      setServerReady(false);
      return;
    }
    setServerReady(false);
    let cancelled = false;

    const poll = async () => {
      while (!cancelled) {
        try {
          // no-cors: opaque response = server is up; TypeError = server is down
          await fetch(url, { mode: "no-cors" });
          if (!cancelled) setServerReady(true);
          return;
        } catch {
          if (cancelled) return;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Reset loading state when URL or refreshKey changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on prop change
  useEffect(() => {
    setIsLoading(true);
  }, [url, refreshKey]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6 bg-background p-8 text-center">
        <div className="border border-border bg-card rounded-lg shadow-sm p-8 flex flex-col items-center gap-4">
          <MonitorIcon className="h-12 w-12 text-primary" />
          <div className="space-y-3">
            <h3 className="font-mono text-sm text-primary">No Signal</h3>
            <p className="text-sm text-muted-foreground font-mono max-w-md">
              Waiting for dev server...
            </p>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            <span className="text-sm font-mono">Connecting...</span>
          </div>
        </div>
      </div>
    );
  }

  // Add cache-busting parameter for refresh
  const iframeUrl = `${url}${url.includes("?") ? "&" : "?"}_t=${refreshKey}`;
  const currentWidth = DEVICE_WIDTHS[deviceSize];

  return (
    <div className="flex h-full flex-col">
      {/* Preview iframe */}
      <div className="flex-1 bg-card overflow-hidden flex justify-center relative rounded-b-xl">
        {/* Loading / streaming / waiting overlay */}
        {(isLoading || isStreaming || isWaitingForInput) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 overflow-hidden">
            {isWaitingForInput ? (
              <div className="flex flex-col items-center gap-6 w-full max-w-xs px-6 text-center">
                <div className="size-16 flex items-center justify-center rounded-full bg-muted">
                  <MessageCircleQuestionIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-foreground">
                    Just a few quick questions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We need a bit more info before we can start building
                  </p>
                </div>
                {isMobile && onSwitchToProgress && (
                  <button
                    type="button"
                    onClick={onSwitchToProgress}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <ListTodoIcon className="h-4 w-4" />
                    Answer Questions
                  </button>
                )}
              </div>
            ) : isStreaming ? (
              <AgentScene
                currentLabel={cookingProgress?.activeTool ?? null}
                taskLabel={cookingProgress?.currentLabel ?? null}
                isReasoning={cookingProgress?.isReasoning ?? false}
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="font-mono text-xs text-primary">
                  Loading Preview...
                </p>
              </div>
            )}
          </div>
        )}
        {serverReady && (
          <iframe
            key={`preview-${refreshKey}`}
            src={iframeUrl}
            onLoad={handleIframeLoad}
            className={cn(
              "h-full bg-white transition-all duration-300",
              deviceSize === "desktop" && "w-full",
              deviceSize !== "desktop" && "flex-shrink-0",
            )}
            style={{
              width: deviceSize !== "desktop" ? currentWidth : undefined,
              maxWidth: "100%",
            }}
            title="App Preview"
          />
        )}
      </div>
    </div>
  );
}
