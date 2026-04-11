"use client";

import { FetchHttpClient } from "@effect/platform";
import { Effect, Match } from "effect";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HeroArc } from "@/components/home/hero-arc";
import { HeroSection } from "@/components/home/hero-section";
import { HomePromptInput } from "@/components/home/home-prompt-input";
import { LimitReachedModal } from "@/features/apps/components/limit-reached-modal";
import {
  createApp,
  ensureGuestSession,
  useDailyUsageQuery,
} from "@/features/apps/hooks/queries";
import { SignInModal } from "@/features/auth/components/sign-in-modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { HomeChat } from "@/features/home/components/home-chat";
import type { HomeMode } from "@/features/home/types";
import {
  HomeTour,
  hasSeenHomeTour,
  markHomeTourAsSeen,
  useHomeTourTrigger,
} from "@/features/onboarding";
import { useBrowserNotification } from "@/hooks/use-browser-notification";
import type { SerializedDailyUsage } from "@/lib/services/usage";
import { validatePrompt } from "@/lib/validation/prompt";

interface HomeClientProps {
  /** Pre-filled prompt from inspo remix */
  initialPrompt?: string | null;
  /** Inspo title for display context */
  inspoTitle?: string | null;
  /** Server-fetched initial usage to avoid flash */
  initialUsage?: SerializedDailyUsage | null;
}

export function HomeClient({
  initialPrompt,
  inspoTitle,
  initialUsage,
}: HomeClientProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { data: usage } = useDailyUsageQuery(
    isAuthenticated,
    initialUsage ?? undefined,
  );
  const { permission, requestPermission } = useBrowserNotification();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitResetsAt, setLimitResetsAt] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mode, setMode] = useState<HomeMode>("build");
  const [chatStarted, setChatStarted] = useState(false);
  const [pendingChatMessage, setPendingChatMessage] = useState<string | null>(
    null,
  );
  const [showTour, setShowTour] = useState(false);
  const [tourHasAutoOpened, setTourHasAutoOpened] = useState(false);

  const pendingPromptRef = useRef<string | null>(null);
  const modeBeforeTourRef = useRef<HomeMode>("build");

  const isRemixing = !!initialPrompt;

  // Auto-open tour for first-time visitors
  useEffect(() => {
    // Don't auto-show during remix flows, when chat has started, or during creation
    if (isRemixing || chatStarted || isCreating || tourHasAutoOpened) {
      return;
    }

    // Check if user has seen the tour before
    if (hasSeenHomeTour()) {
      return;
    }

    // Wait for page to settle after hydration
    const timer = setTimeout(() => {
      setShowTour(true);
      setTourHasAutoOpened(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isRemixing, chatStarted, isCreating, tourHasAutoOpened]);

  const handleModeChange = (newMode: HomeMode) => {
    setMode(newMode);
  };

  const handleTourComplete = () => {
    markHomeTourAsSeen();
    setShowTour(false);
    // Restore original mode
    setMode(modeBeforeTourRef.current);
  };

  const handleTourSkip = () => {
    markHomeTourAsSeen();
    setShowTour(false);
    // Restore original mode
    setMode(modeBeforeTourRef.current);
  };

  // Listen for manual tour trigger from header
  useHomeTourTrigger(() => {
    // Save current mode before tour starts
    modeBeforeTourRef.current = mode;
    setShowTour(true);
  });

  const handleSubmit = async ({ text }: { text: string }) => {
    // Chat mode: validate and start chat
    if (mode === "chat") {
      const nextValidationError = validatePrompt(text);
      if (nextValidationError) {
        setValidationError(nextValidationError);
        return;
      }

      setValidationError(null);

      // If limit reached, show limit modal
      if (usage && usage.remaining <= 0) {
        setShowLimitModal(true);
        return;
      }

      // If not authenticated, silently create a guest session first
      if (!isAuthenticated) {
        try {
          await ensureGuestSession();
        } catch (error) {
          console.error("Failed to create guest session:", error);
          return;
        }
      }

      // Start chat with this message
      setPendingChatMessage(text);
      setChatStarted(true);
      return;
    }

    // Build mode: create app
    if (isCreating) return;

    const nextValidationError = validatePrompt(text);
    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    setValidationError(null);

    // Request notification permission on user gesture (first time only)
    if (permission === "default") {
      requestPermission();
    }

    // If still loading auth state, store prompt and wait
    if (isLoading) {
      pendingPromptRef.current = text;
      return;
    }

    // If limit reached, show limit modal
    if (usage && usage.remaining <= 0) {
      setShowLimitModal(true);
      return;
    }

    // If not authenticated, silently create a guest session first
    if (!isAuthenticated) {
      try {
        await ensureGuestSession();
      } catch (error) {
        console.error("Failed to create guest session:", error);
        return;
      }
    }

    // Proceed with creating app (works for both guest and authenticated users)
    await proceedWithPrompt(text);
  };

  const proceedWithPrompt = async (text: string) => {
    setIsCreating(true);

    const program = createApp(text).pipe(
      Effect.tap((app) => Effect.sync(() => router.push(`/apps/${app.id}`))),
      Effect.catchAll((error) =>
        Effect.sync(() =>
          Match.value(error).pipe(
            Match.when({ _tag: "UnauthorizedError" }, () => {
              pendingPromptRef.current = text;
              setShowSignIn(true);
            }),
            Match.when({ _tag: "RateLimitedError" }, (e) => {
              setLimitResetsAt(e.resetsAt);
              setShowLimitModal(true);
            }),
            Match.when({ _tag: "AppCreationError" }, (e) => {
              setValidationError(e.message);
            }),
            Match.exhaustive,
          ),
        ),
      ),
      Effect.ensuring(Effect.sync(() => setIsCreating(false))),
      Effect.provide(FetchHttpClient.layer),
    );

    await Effect.runPromise(program);
  };

  const handleSignInOpenChange = async (open: boolean) => {
    setShowSignIn(open);

    if (!open && pendingPromptRef.current && isAuthenticated) {
      const prompt = pendingPromptRef.current;
      pendingPromptRef.current = null;
      await proceedWithPrompt(prompt);
    }
  };

  // Chat mode with active conversation
  if (mode === "chat" && chatStarted) {
    return (
      <div className="relative flex h-full flex-1 flex-col bg-background px-4 pb-4">
        <HomeChat
          initialMessage={pendingChatMessage}
          onSwitchToBuild={() => {
            setMode("build");
            setChatStarted(false);
            setPendingChatMessage(null);
          }}
        />
        <LimitReachedModal
          open={showLimitModal}
          onOpenChange={setShowLimitModal}
          resetsAt={
            limitResetsAt ?? usage?.resetsAt ?? new Date().toISOString()
          }
        />
      </div>
    );
  }

  // Build mode or chat mode before first message
  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden bg-background px-4 pb-4">
      <div className="relative z-10 shrink-0 h-[4vh] md:h-[10vh]" />

      <HeroSection isRemixing={isRemixing} inspoTitle={inspoTitle} />

      <div className="h-4 md:flex-1 md:min-h-[20vh]" />

      <HeroArc />

      <div className="flex-1" />

      <HomePromptInput
        initialPrompt={initialPrompt}
        isRemixing={isRemixing}
        isCreating={isCreating}
        isAuthenticated={isAuthenticated}
        mode={mode}
        onModeChange={handleModeChange}
        error={validationError}
        onInputChange={() => setValidationError(null)}
        onSubmit={handleSubmit}
      />

      <HomeTour
        open={showTour}
        mode={mode}
        onModeChange={handleModeChange}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      <SignInModal open={showSignIn} onOpenChange={handleSignInOpenChange} />
      <LimitReachedModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
        resetsAt={limitResetsAt ?? usage?.resetsAt ?? new Date().toISOString()}
      />
    </div>
  );
}
