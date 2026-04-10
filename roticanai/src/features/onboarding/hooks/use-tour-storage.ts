"use client";

import { useCallback, useEffect, useState } from "react";
import { HOME_TOUR_STORAGE_KEY } from "../types";

/**
 * Event name for triggering the home tour
 */
export const HOME_TOUR_TRIGGER_EVENT = "rotican:trigger-home-tour";

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Check if the home tour has been seen
 */
export function hasSeenHomeTour(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(HOME_TOUR_STORAGE_KEY) === "true";
}

/**
 * Mark the home tour as seen
 */
export function markHomeTourAsSeen(): void {
  if (!isBrowser()) return;
  localStorage.setItem(HOME_TOUR_STORAGE_KEY, "true");
}

/**
 * Trigger the home tour from anywhere in the app
 */
export function triggerHomeTour(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(HOME_TOUR_TRIGGER_EVENT));
}

/**
 * React hook for managing tour seen state
 */
export function useTourStorage() {
  const [seen, setSeen] = useState(() => hasSeenHomeTour());

  const markAsSeen = useCallback(() => {
    markHomeTourAsSeen();
    setSeen(true);
  }, []);

  return {
    seen,
    markAsSeen,
  };
}

/**
 * React hook to listen for tour trigger events
 */
export function useHomeTourTrigger(onTrigger: () => void) {
  useEffect(() => {
    const handleTrigger = () => {
      onTrigger();
    };

    window.addEventListener(
      HOME_TOUR_TRIGGER_EVENT,
      handleTrigger as EventListener,
    );

    return () => {
      window.removeEventListener(
        HOME_TOUR_TRIGGER_EVENT,
        handleTrigger as EventListener,
      );
    };
  }, [onTrigger]);
}
