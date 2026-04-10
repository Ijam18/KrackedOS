"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GuidedTourStep, UseHomeTourOptions } from "../types";
import { hasSeenHomeTour, markHomeTourAsSeen } from "./use-tour-storage";

export interface UseGuidedTourResult {
  /** Current step index */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether the tour is currently open */
  isOpen: boolean;
  /** Current step data */
  step: GuidedTourStep | null;
  /** Target element for the current step */
  targetElement: Element | null;
  /** Go to the next step */
  next: () => void;
  /** Go to the previous step */
  back: () => void;
  /** Skip/close the tour */
  skip: () => void;
  /** Start the tour */
  start: () => void;
  /** Check if there's a next step */
  canGoNext: boolean;
  /** Check if there's a previous step */
  canGoBack: boolean;
}

export function useGuidedTour(
  steps: GuidedTourStep[],
  options: UseHomeTourOptions & {
    onComplete?: () => void;
    onSkip?: () => void;
    initialStep?: number;
  } = {},
): UseGuidedTourResult {
  const {
    autoOpen = false,
    autoOpenDelay = 1000,
    disabled = false,
    onComplete,
    onSkip,
    initialStep = 0,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const autoOpenTriggered = useRef(false);

  // Get the target element for the current step
  const resolveTarget = useCallback(
    (target: GuidedTourStep["target"]): Element | null => {
      if (typeof target === "function") {
        return target();
      }
      return document.querySelector(target);
    },
    [],
  );

  // Update target element when step changes
  useEffect(() => {
    if (!isOpen || steps.length === 0) {
      setTargetElement(null);
      return;
    }

    const step = steps[currentStep];
    if (!step) {
      setTargetElement(null);
      return;
    }

    // Run beforeEnter callback if present
    if (step.beforeEnter) {
      Promise.resolve(step.beforeEnter()).then(() => {
        setTargetElement(resolveTarget(step.target));
      });
    } else {
      setTargetElement(resolveTarget(step.target));
    }
  }, [isOpen, currentStep, steps, resolveTarget]);

  // Listen for scroll and resize to update target position
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      const step = steps[currentStep];
      if (step) {
        setTargetElement(resolveTarget(step.target));
      }
    };

    window.addEventListener("scroll", handleUpdate, { passive: true });
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, currentStep, steps, resolveTarget]);

  // Auto-open on mount if enabled and not seen
  useEffect(() => {
    if (!autoOpen || disabled || autoOpenTriggered.current) return;
    autoOpenTriggered.current = true;

    if (hasSeenHomeTour()) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, autoOpenDelay);

    return () => clearTimeout(timer);
  }, [autoOpen, autoOpenDelay, disabled]);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Complete
      markHomeTourAsSeen();
      setIsOpen(false);
      setCurrentStep(0);
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const back = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skip = useCallback(() => {
    markHomeTourAsSeen();
    setIsOpen(false);
    setCurrentStep(0);
    onSkip?.();
  }, [onSkip]);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsOpen(true);
  }, []);

  const step = steps[currentStep] ?? null;

  return {
    currentStep,
    totalSteps: steps.length,
    isOpen,
    step,
    targetElement,
    next,
    back,
    skip,
    start,
    canGoNext: true,
    canGoBack: currentStep > 0,
  };
}
