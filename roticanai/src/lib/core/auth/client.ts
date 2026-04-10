"use client";

import { createAuthClient } from "better-auth/react";
import { clearGuestFlag } from "@/features/auth/hooks/use-auth";
import { GITHUB_PUSH_SCOPES } from "./github-scopes";

export const authClient = createAuthClient();

export const { linkSocial, signIn, signOut, useSession } = authClient;

export async function signOutGuest() {
  const response = await fetch("/api/auth/guest", {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Failed to sign out guest");
  }

  clearGuestFlag();
}

export async function signOutCurrentUser(isGuest: boolean) {
  if (isGuest) {
    await signOutGuest();
    return;
  }

  await signOut();
  clearGuestFlag();
}

export function signInWithGitHub(callbackURL?: string) {
  return signIn.social({
    provider: "github",
    callbackURL,
  });
}

export function linkGitHubForPush(callbackURL?: string) {
  return linkSocial({
    provider: "github",
    callbackURL,
    scopes: [...GITHUB_PUSH_SCOPES],
  });
}
