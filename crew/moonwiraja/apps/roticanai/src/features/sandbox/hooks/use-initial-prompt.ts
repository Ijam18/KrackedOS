import { useRef } from "react";

/**
 * Reads and clears the initial prompt from sessionStorage for a given session ID.
 * The prompt is only read once per component lifecycle.
 */
export function useInitialPrompt(sessionId: string): string | null {
  const initialPromptRef = useRef<string | null>(null);
  const hasReadPrompt = useRef(false);

  if (typeof window !== "undefined" && !hasReadPrompt.current) {
    hasReadPrompt.current = true;
    initialPromptRef.current = sessionStorage.getItem(`prompt:${sessionId}`);
    if (initialPromptRef.current) {
      sessionStorage.removeItem(`prompt:${sessionId}`);
    }
  }

  return initialPromptRef.current;
}
