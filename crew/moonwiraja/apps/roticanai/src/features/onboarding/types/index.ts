/**
 * Home page mode - determines whether to create an app or have an ephemeral chat
 * Re-exported from @/features/home/types for convenience
 */
export type HomeMode = "build" | "chat";

/**
 * Placement options for the step card relative to the target element
 */
export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

/**
 * A single step in the guided tour
 */
export interface GuidedTourStep {
  /** Unique identifier for the step */
  id: string;
  /** CSS selector or element reference for the target */
  target: string | (() => Element | null);
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Preferred placement of the step card */
  placement?: TourPlacement;
  /** Optional callback called before entering this step */
  beforeEnter?: () => void | Promise<void>;
}

/**
 * Props for the GuidedTour component
 */
export interface GuidedTourProps {
  /** Whether the tour is currently open */
  open: boolean;
  /** Array of tour steps */
  steps: GuidedTourStep[];
  /** Called when the tour is completed (finished all steps) */
  onComplete?: () => void;
  /** Called when the tour is skipped/dismissed */
  onSkip?: () => void;
  /** Initial step index (0-based) */
  initialStep?: number;
}

/**
 * Storage key for persisting home tour seen state
 */
export const HOME_TOUR_STORAGE_KEY = "rotican_home_tour_seen";

/**
 * Options for the useHomeTour hook
 */
export interface UseHomeTourOptions {
  /** Whether to auto-open the tour on mount */
  autoOpen?: boolean;
  /** Delay in ms before auto-opening */
  autoOpenDelay?: number;
  /** Whether the tour should be disabled (e.g., during remix or chat) */
  disabled?: boolean;
}
