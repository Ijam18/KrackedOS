"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/ui/utils";
import { useGuidedTour } from "../hooks";
import type { GuidedTourProps, TourPlacement } from "../types";

interface SpotlightProps {
  targetElement: Element | null;
}

function Spotlight({ targetElement }: SpotlightProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!targetElement) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      setRect(targetElement.getBoundingClientRect());
    };

    updateRect();

    const observer = new ResizeObserver(updateRect);
    observer.observe(targetElement);

    return () => observer.disconnect();
  }, [targetElement]);

  if (!rect) return null;

  const padding = 8;
  const x = rect.left - padding;
  const y = rect.top - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  return (
    <div
      className={cn(
        "absolute pointer-events-none",
        !prefersReducedMotion && "transition-all duration-300 ease-out",
      )}
      style={{
        left: x,
        top: y,
        width,
        height,
        boxShadow: "0 0 0 9999px hsl(0 0% 0% / 0.75)",
        borderRadius: 8,
      }}
    />
  );
}

interface TourCardProps {
  step: NonNullable<ReturnType<typeof useGuidedTour>["step"]>;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  canGoBack: boolean;
  targetElement: Element | null;
}

function TourCard({
  step,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  canGoBack,
  targetElement,
}: TourCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [placement, setPlacement] = useState<TourPlacement>(
    step.placement ?? "bottom",
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const calculatePosition = () => {
      const card = cardRef.current;
      if (!card) return;

      const cardRect = card.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Center placement for intro/completion steps
      if (step.placement === "center" || !targetElement) {
        setPosition({
          x: (viewportWidth - cardRect.width) / 2,
          y: (viewportHeight - cardRect.height) / 2,
        });
        setPlacement("center");
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();
      const padding = 16;

      // Mobile: position at top to avoid obstructing the target
      if (viewportWidth < 768) {
        const targetCenterY = targetRect.top + targetRect.height / 2;
        // If target is in top half, place card at bottom; otherwise place at top
        if (targetCenterY < viewportHeight / 2) {
          setPosition({
            x: (viewportWidth - cardRect.width) / 2,
            y: viewportHeight - cardRect.height - 24,
          });
          setPlacement("bottom");
        } else {
          setPosition({
            x: (viewportWidth - cardRect.width) / 2,
            y: 24,
          });
          setPlacement("top");
        }
        return;
      }

      // Desktop: try preferred placement, fallback if needed
      let bestPlacement = step.placement ?? "bottom";
      let x = 0;
      let y = 0;

      const tryPlacement = (p: string) => {
        switch (p) {
          case "top":
            x = targetRect.left + targetRect.width / 2 - cardRect.width / 2;
            y = targetRect.top - cardRect.height - padding;
            break;
          case "bottom":
            x = targetRect.left + targetRect.width / 2 - cardRect.width / 2;
            y = targetRect.bottom + padding;
            break;
          case "left":
            x = targetRect.left - cardRect.width - padding;
            y = targetRect.top + targetRect.height / 2 - cardRect.height / 2;
            break;
          case "right":
            x = targetRect.right + padding;
            y = targetRect.top + targetRect.height / 2 - cardRect.height / 2;
            break;
        }

        // Check if within viewport
        return (
          x >= padding &&
          x + cardRect.width <= viewportWidth - padding &&
          y >= padding &&
          y + cardRect.height <= viewportHeight - padding
        );
      };

      // Try preferred placement
      if (!tryPlacement(bestPlacement)) {
        // Fallback order
        const fallbacks: Array<"bottom" | "top" | "right" | "left"> = [
          "bottom",
          "top",
          "right",
          "left",
        ];
        for (const fallback of fallbacks) {
          if (fallback !== bestPlacement && tryPlacement(fallback)) {
            bestPlacement = fallback;
            break;
          }
        }
      }

      setPosition({ x, y });
      setPlacement(bestPlacement);
    };

    calculatePosition();

    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition, { passive: true });

    return () => {
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition);
    };
  }, [step, targetElement]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "fixed z-[100] w-[90vw] max-w-md rounded-xl border border-border bg-background p-6 pt-10 shadow-xl font-mono relative",
        !prefersReducedMotion && "transition-all duration-300 ease-out",
        placement === "center" && "text-center",
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-title"
      aria-describedby="tour-description"
    >
      {/* Close button - top right */}
      <button
        type="button"
        onClick={onSkip}
        className="absolute top-3 right-3 rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Close tour"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress indicator - centered */}
      <div className="mb-6 flex justify-center">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Progress indicators are static and don't reorder
              key={`step-${i}`}
              className={cn(
                "h-1.5 w-8 rounded-full transition-colors",
                i <= currentStep ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <h2
        id="tour-title"
        className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground"
      >
        {step.title}
      </h2>
      <p
        id="tour-description"
        className="mb-6 text-xs text-muted-foreground leading-relaxed"
      >
        {step.description}
      </p>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className={cn(
            "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            canGoBack
              ? "text-foreground hover:bg-muted"
              : "text-muted-foreground cursor-not-allowed",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSkip}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {currentStep === totalSteps - 1 ? "Finish" : "Next"}
            {currentStep < totalSteps - 1 && (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function GuidedTour({
  open,
  steps,
  onComplete,
  onSkip,
  initialStep = 0,
}: GuidedTourProps) {
  const tour = useGuidedTour(steps, {
    onComplete,
    onSkip,
    initialStep,
  });

  // Sync external open state with internal state
  useEffect(() => {
    if (open && !tour.isOpen) {
      tour.start();
    }
  }, [open, tour.isOpen, tour.start]);

  // Keyboard navigation
  useEffect(() => {
    if (!tour.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        tour.skip();
      } else if (e.key === "ArrowRight") {
        tour.next();
      } else if (e.key === "ArrowLeft" && tour.canGoBack) {
        tour.back();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tour]);

  // Scroll target into view
  useEffect(() => {
    if (!tour.isOpen || !tour.targetElement) return;

    const step = tour.step;
    if (!step || step.placement === "center") return;

    const isMobile = window.innerWidth < 768;
    const targetRect = tour.targetElement.getBoundingClientRect();
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const viewportHeight = window.innerHeight;

    // On mobile, adjust scroll based on where the card will be positioned
    if (isMobile) {
      // If target is in top half, card goes at bottom, so center is fine
      // If target is in bottom half, card goes at top, so scroll target lower
      if (targetCenterY >= viewportHeight / 2) {
        // Target is in bottom half, card will be at top
        tour.targetElement.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "center",
        });
        return;
      }
    }

    tour.targetElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });
  }, [tour.isOpen, tour.targetElement, tour.step]);

  if (!tour.isOpen || !tour.step) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop with spotlight */}
      <div className="absolute inset-0">
        <Spotlight targetElement={tour.targetElement} />
      </div>

      {/* Tour card */}
      <TourCard
        step={tour.step}
        currentStep={tour.currentStep}
        totalSteps={tour.totalSteps}
        onNext={tour.next}
        onBack={tour.back}
        onSkip={tour.skip}
        canGoBack={tour.canGoBack}
        targetElement={tour.targetElement}
      />
    </div>,
    document.body,
  );
}
