"use client";

import type { UIMessage } from "ai";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { App } from "@/db/schema";
import { LoadingWrapper } from "@/features/sandbox/components/loading-wrapper";
import { SandboxContent } from "@/features/sandbox/components/sandbox-content";
import { SandboxLoading } from "@/features/sandbox/components/sandbox-loading";
import {
  getOrCreateSandboxPromise,
  type SandboxCreationState,
} from "@/features/sandbox/hooks/use-sandbox";

interface AppWorkspaceProps {
  appId: string;
  app: App;
  initialMessages: UIMessage[];
  initialPrompt: string | null;
  currentUsername?: string | null;
}

export function AppWorkspace({
  appId,
  app,
  initialMessages,
  initialPrompt,
  currentUsername,
}: AppWorkspaceProps) {
  // Track app title separately so we can update it once async generation completes
  const [appTitle, setAppTitle] = useState(app.title);

  // If title is missing on load, poll until the AI title generation finishes
  // biome-ignore lint/correctness/useExhaustiveDependencies: appId is stable
  useEffect(() => {
    if (appTitle) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/apps/${appId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.title) {
          setAppTitle(data.title);
          clearInterval(interval);
        }
      } catch {
        // ignore fetch errors, just keep polling
      }
    }, 2000);

    // Stop after 30s regardless
    const timeout = setTimeout(() => clearInterval(interval), 30_000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // If sandbox already exists, start in a "reconnecting" state instead of "idle"
  // This provides better UX - user sees we're just reconnecting, not creating from scratch
  const hasExistingSandbox = !!app.sandboxId;

  const [loadingState, setLoadingState] = useState<SandboxCreationState>({
    status: hasExistingSandbox ? "reconnecting" : "idle",
    message: hasExistingSandbox ? "Reconnecting..." : "Preparing...",
    sandbox: null,
    error: null,
  });

  const sandboxPromise = useMemo(
    () => getOrCreateSandboxPromise(appId, setLoadingState),
    [appId],
  );

  return (
    <LoadingWrapper
      status={loadingState.status}
      error={loadingState.error}
      appTitle={appTitle}
    >
      <Suspense
        fallback={
          <SandboxLoading
            status={loadingState.status}
            error={loadingState.error}
            appTitle={appTitle}
          />
        }
      >
        <SandboxContent
          sessionId={appId}
          sandboxPromise={sandboxPromise}
          initialMessages={initialMessages}
          initialPrompt={initialPrompt}
          currentSlug={app.slug}
          isPublished={app.isPublished}
          currentUsername={currentUsername}
          appTitle={appTitle}
        />
      </Suspense>
    </LoadingWrapper>
  );
}
