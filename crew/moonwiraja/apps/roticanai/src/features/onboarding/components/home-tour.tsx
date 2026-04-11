"use client";

import { useTranslations } from "next-intl";
import type { GuidedTourStep, HomeMode } from "../types";
import { GuidedTour } from "./guided-tour";

interface HomeTourProps {
  /** Whether the tour is open */
  open: boolean;
  /** Current mode (build or chat) */
  mode: HomeMode;
  /** Callback to change mode */
  onModeChange: (mode: HomeMode) => void;
  /** Callback when tour is completed */
  onComplete?: () => void;
  /** Callback when tour is skipped */
  onSkip?: () => void;
}

export function HomeTour({
  open,
  mode,
  onModeChange,
  onComplete,
  onSkip,
}: HomeTourProps) {
  const t = useTranslations("homeTour");

  const steps: GuidedTourStep[] = [
    // Step 1: Intro - centered on screen
    {
      id: "intro",
      target: "body",
      title: t("steps.intro.title"),
      description: t("steps.intro.description"),
      placement: "center",
    },
    // Step 2: Mode toggle - explain build vs chat
    {
      id: "mode-toggle",
      target: "[data-tour-id='home-tour-mode-toggle']",
      title: t("steps.modeToggle.title"),
      description: t("steps.modeToggle.description"),
      placement: "bottom",
    },
    // Step 3: Build prompt input (force build mode first)
    {
      id: "build-prompt",
      target: "[data-tour-id='home-tour-build-prompt']",
      title: t("steps.buildPrompt.title"),
      description: t("steps.buildPrompt.description"),
      placement: "top",
      beforeEnter: () => {
        if (mode !== "build") {
          onModeChange("build");
        }
      },
    },
    // Step 4: Build helpers - idea wizard and suggestions
    {
      id: "build-helpers",
      target: "[data-tour-id='home-tour-idea-wizard']",
      title: t("steps.buildHelpers.title"),
      description: t("steps.buildHelpers.description"),
      placement: "top",
    },
    // Step 5: Build suggestions
    {
      id: "build-suggestions",
      target: "[data-tour-id='home-tour-build-suggestions']",
      title: t("steps.buildSuggestions.title"),
      description: t("steps.buildSuggestions.description"),
      placement: "top",
    },
    // Step 6: Chat mode prompt input (force chat mode)
    {
      id: "chat-prompt",
      target: "[data-tour-id='home-tour-chat-prompt']",
      title: t("steps.chatPrompt.title"),
      description: t("steps.chatPrompt.description"),
      placement: "top",
      beforeEnter: () => {
        if (mode !== "chat") {
          onModeChange("chat");
        }
      },
    },
    // Step 7: Chat suggestions
    {
      id: "chat-suggestions",
      target: "[data-tour-id='home-tour-chat-suggestions']",
      title: t("steps.chatSuggestions.title"),
      description: t("steps.chatSuggestions.description"),
      placement: "top",
    },
    // Step 8: Completion - centered
    {
      id: "completion",
      target: "body",
      title: t("steps.completion.title"),
      description: t("steps.completion.description"),
      placement: "center",
    },
  ];

  return (
    <GuidedTour
      open={open}
      steps={steps}
      onComplete={onComplete}
      onSkip={onSkip}
    />
  );
}
