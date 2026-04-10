"use client";

import { cn } from "@/lib/ui/utils";
import type { SandboxStatus } from "../hooks/use-sandbox";
import { SandboxLoadingArc } from "./sandbox-loading-arc";

interface SandboxLoadingProps {
  status: SandboxStatus;
  error?: string | null;
  appTitle?: string | null;
}

const fullSteps: { status: SandboxStatus; label: string }[] = [
  { status: "creating", label: "HEATING UP THE PAN" },
  { status: "bootstrapping", label: "PREPARING INGREDIENTS" },
  { status: "ready", label: "READY TO SERVE!" },
];

const reconnectSteps: {
  status: SandboxStatus;
  label: string;
}[] = [
  { status: "reconnecting", label: "WARMING UP" },
  { status: "ready", label: "READY TO SERVE!" },
];

function getStepIndex(status: SandboxStatus, steps: typeof fullSteps): number {
  const index = steps.findIndex((s) => s.status === status);
  return index === -1 ? 0 : index;
}

function isReconnecting(status: SandboxStatus): boolean {
  return status === "reconnecting";
}

export function SandboxLoading({
  status,
  error,
  appTitle,
}: SandboxLoadingProps) {
  const reconnecting = isReconnecting(status);
  const steps = reconnecting ? reconnectSteps : fullSteps;
  const currentIndex = getStepIndex(status, steps);

  const loadingTitle = appTitle
    ? `Loading ${appTitle}... | Roti Canai`
    : "Loading... | Roti Canai";

  const currentLabel = steps[currentIndex]?.label ?? "LOADING";
  const progressPercent = Math.round(((currentIndex + 1) / steps.length) * 100);

  if (error) {
    return (
      <>
        <title>Error | Roti Canai</title>
        <div className="relative flex h-full flex-1 flex-col items-center justify-center bg-background px-4">
          <div className="relative z-10 w-full max-w-lg">
            <div className="border border-border bg-card rounded-lg shadow-sm p-8 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 border-2 border-destructive rounded-lg flex items-center justify-center">
                  <span className="font-mono text-2xl text-destructive">!</span>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="font-mono text-sm text-destructive">Error</h2>
                <p className="text-sm text-muted-foreground font-mono">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="border border-border bg-primary text-primary-foreground px-6 py-3 font-mono text-xs hover:bg-primary/80 rounded-md transition-all"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <title>{loadingTitle}</title>
      <div className="relative flex h-full flex-1 flex-col bg-background overflow-hidden">
        {/* Arc images */}
        <SandboxLoadingArc />

        {/* Bottom progress bar */}
        <div className="relative z-10 mt-auto flex flex-col items-center gap-4 pb-16">
          <div className="flex items-center gap-6">
            <span className="font-mono text-sm text-muted-foreground tracking-widest">
              {currentLabel}...
            </span>
            <span className="font-mono text-sm text-muted-foreground">
              {progressPercent}%
            </span>
          </div>
          <div className="w-64 h-0.5 bg-border rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full bg-foreground transition-all duration-500 ease-out rounded-full",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
