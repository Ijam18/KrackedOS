"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuthSeed } from "@/features/auth/components/auth-provider";
import {
  GUEST_FLAG_COOKIE_NAME,
  GUEST_STORAGE_KEY,
} from "@/features/auth/constants";

/**
 * Mark the current browser as a guest session.
 * Called after successfully creating a guest user.
 * Writes to both localStorage (for cross-tab reactivity) and a cookie
 * (so the server can read it during SSR to avoid hydration mismatches).
 */
export function setGuestFlag() {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, "1");
  } catch {}
  try {
    // biome-ignore lint/suspicious/noDocumentCookie: Required for SSR hydration mismatch prevention
    document.cookie = `${GUEST_FLAG_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {}
}

/**
 * Clear the guest flag (e.g. after signing in).
 */
export function clearGuestFlag() {
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch {}
  try {
    // biome-ignore lint/suspicious/noDocumentCookie: Required for SSR hydration mismatch prevention
    document.cookie = `${GUEST_FLAG_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch {}
}

/** Subscribe to storage events so the flag is reactive across tabs */
function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getGuestSnapshot(): boolean {
  try {
    return localStorage.getItem(GUEST_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getGuestServerSnapshot(): boolean {
  return false;
}

/**
 * Sync localStorage guest flag to a cookie for existing guest users
 * who set the flag before the cookie was introduced.
 * Runs once on mount; no-ops if already in sync.
 */
function useSyncGuestCookie() {
  useEffect(() => {
    try {
      const hasLocal = localStorage.getItem(GUEST_STORAGE_KEY) === "1";
      const hasCookie = document.cookie
        .split("; ")
        .some((c) => c === `${GUEST_FLAG_COOKIE_NAME}=1`);

      if (hasLocal && !hasCookie) {
        // biome-ignore lint/suspicious/noDocumentCookie: Required for SSR hydration mismatch prevention
        document.cookie = `${GUEST_FLAG_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      } else if (!hasLocal && hasCookie) {
        // biome-ignore lint/suspicious/noDocumentCookie: Required for SSR hydration mismatch prevention
        document.cookie = `${GUEST_FLAG_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
      }
    } catch {}
  }, []);
}

/**
 * Hook for accessing authentication state.
 * Uses server-seeded auth state only - no client-side session fetching.
 * Auth state updates after sign-in/sign-out via page refresh.
 */
export function useAuth() {
  const seed = useAuthSeed();
  useSyncGuestCookie();

  useEffect(() => {
    if (seed?.isAuthenticated && !seed.isGuest) {
      clearGuestFlag();
    }
  }, [seed?.isAuthenticated, seed?.isGuest]);

  const hasGuestFlag = useSyncExternalStore(
    subscribeToStorage,
    getGuestSnapshot,
    getGuestServerSnapshot,
  );

  // Server seed is the source of truth
  // isGuest is true if server says guest OR if guest flag is set locally
  const isGuest = seed?.isGuest || (!seed?.isAuthenticated && hasGuestFlag);
  const isAuthenticated = seed?.isAuthenticated || isGuest;

  return {
    session: null,
    user: seed?.userId
      ? {
          id: seed.userId,
          name: seed.userName,
          email: seed.userEmail,
          image: seed.userImage,
        }
      : null,
    isLoading: false,
    isAuthenticated,
    isGuest,
    error: null,
  };
}
