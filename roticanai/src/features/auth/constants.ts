/** Key used in localStorage for cross-tab guest flag reactivity */
export const GUEST_STORAGE_KEY = "rotican_guest";

/**
 * Cookie name for the guest session flag.
 * Written by the client alongside localStorage so the server can read it
 * during SSR, ensuring the initial render matches the client and preventing
 * hydration mismatches.
 */
export const GUEST_FLAG_COOKIE_NAME = "rotican_guest";
